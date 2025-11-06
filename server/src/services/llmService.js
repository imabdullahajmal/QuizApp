/*
  Stable Gemini-first quiz generator.
  - Ensures always-valid JSON.
  - Cleans malformed LLM output.
  - Guarantees answers always exist inside options.
*/

import process from "process";

const DEFAULT_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

const DEFAULT_ENDPOINT =
  process.env.GEMINI_MODEL_ENDPOINT ||
  `https://generativelanguage.googleapis.com/v1beta2/models/${DEFAULT_MODEL}:generate`;

/* ------------------------- Dummy Quiz Fallback ------------------------- */
function dummyQuiz(topic = "General Knowledge", num = 3, difficulty = "medium") {
  const title = `Quick Quiz: ${topic}`;
  const list = [];

  for (let i = 1; i <= num; i++) {
    list.push({
      // keep question concise and without numbering/difficulty tags
      question: `Which statement best describes ${topic}?`,
      options: [
        `${topic} example ${i}`,
        `Distractor ${i}A`,
        `Distractor ${i}B`,
        `Distractor ${i}C`
      ],
      answer: `${topic} example ${i}`
    });
  }

  return { title, questions: list };
}

/* ------------------------- JSON Extraction ------------------------- */
function extractJsonSafe(text) {
  if (!text) return null;

  text = text.replace(/```json|```/g, "");

  try {
    return JSON.parse(text);
  } catch (_) {}

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch (_) {}
  }
  return null;
}

// sanitize leading numbering / difficulty tags and trim
function sanitizeText(s) {
  if (s == null) return "";
  let out = String(s).trim();
  // remove leading numbering like '1. ' or '1) '
  out = out.replace(/^\s*\d+[\.)]?\s*/, "");
  // remove leading difficulty tags like '(Medium)' or 'Medium:'
  out = out.replace(/^\s*\(?\s*(Easy|Medium|Hard)\s*\)?[:\-\)]?\s*/i, "");
  return out.trim();
}

/* ------------------------- Normalization Layer ------------------------- */
function normalizeQuiz(parsed, topic, num, difficulty) {
  if (!parsed || !Array.isArray(parsed.questions)) return null;

  const out = {
    title: parsed.title || `Quick Quiz: ${topic}`,
    questions: []
  };

  for (const q of parsed.questions.slice(0, num)) {
    // sanitize question/options/answer
    const questionText = sanitizeText(q.question || `A question about ${topic}`);
    let opts = Array.isArray(q.options) ? q.options.map(o => sanitizeText(String(o))) : [];
    let ans = sanitizeText(q.answer || "");

    // ensure unique, trimmed options
    opts = opts.map(o => (o || "")).filter((v, i, a) => v && a.indexOf(v) === i);

    while (opts.length < 3) opts.push(`Option ${opts.length + 1}`);

    if (!opts.includes(ans)) {
      // put answer at front if it's non-empty, otherwise keep opts as-is
      if (ans) opts.unshift(ans);
    }

    // ensure max 4 options
    opts = opts.slice(0, 4);

    const chosenAnswer = ans && opts.includes(ans) ? ans : opts[0];

    out.questions.push({
      question: questionText,
      options: opts,
      answer: chosenAnswer
    });
  }

  return out.questions.length === num ? out : null;
}

/* ------------------------- Gemini Caller ------------------------- */
async function callGemini(prompt, apiKey) {
  const customUrl = process.env.GEMINI_API_URL;

  const headers = { "Content-Type": "application/json" };
  if (apiKey && customUrl) headers.Authorization = `Bearer ${apiKey}`;

  const body = {
    prompt: { text: prompt },
    temperature: 0.3,
    maxOutputTokens: 600
  };

  const url = customUrl
    ? customUrl
    : `${DEFAULT_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  const json = await res.json();

  const cand = json?.candidates?.[0];
  if (!cand) return null;

  if (typeof cand.output === "string") return cand.output;
  if (cand.text) return cand.text;

  if (Array.isArray(cand.content)) {
    return cand.content.map(c => c?.text || c).join("\n");
  }

  return JSON.stringify(json);
}

/* ------------------------- Main Quiz Generator ------------------------- */
export async function generateQuiz(topic = "General Knowledge", options = {}) {
  const num = Number(options.numQuestions) || 3;
  const difficulty = (options.difficulty || "medium").toLowerCase();

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.LLM_API_KEY ||
    process.env.GOOGLE_API_KEY;

  const hasCustom =
    Boolean(process.env.GEMINI_API_URL || process.env.GEMINI_MODEL_ENDPOINT);

  if (!apiKey && !hasCustom) {
    return dummyQuiz(topic, num, difficulty);
  }

  const prompt = `
Respond with VALID JSON ONLY. No markdown. No explanation.

{
  "title": "Quick Quiz: ${topic}",
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C"],
      "answer": "A"
    }
  ]
}

Rules:
- EXACTLY ${num} questions.
- Each "options" array must have 3–4 strings.
- "answer" MUST match one of the options.
- NO numbering inside questions.
- Questions must match difficulty: ${difficulty}.
`;

  try {
    const raw = await callGemini(prompt, apiKey);
    const parsed = extractJsonSafe(raw);
    const cleaned = normalizeQuiz(parsed, topic, num, difficulty);

    if (cleaned) return cleaned;
    return dummyQuiz(topic, num, difficulty);
  } catch (err) {
    console.error("LLM error:", err);
    return dummyQuiz(topic, num, difficulty);
  }
}

export default { generateQuiz };
