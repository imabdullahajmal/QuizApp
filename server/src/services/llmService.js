/*
  Lightweight LLM service for generating quizzes.
  - If process.env.LLM_API_KEY is present, it will attempt to call OpenAI's Chat Completions API (gpt-3.5-turbo) and parse JSON output.
  - If no API key is present, returns a deterministic dummy quiz for the given topic.
  Keep this simple and resilient: parsing failures fall back to dummy content.
*/

import process from "process";

// Gemini / Google Generative AI adapter
// If you have a custom Gemini-compatible endpoint, set GEMINI_API_URL.
// Prefer GEMINI_API_KEY, fallback to LLM_API_KEY for compatibility.
const DEFAULT_GEMINI_MODEL_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate";

function dummyQuiz(topic = "General Knowledge") {
  const title = `Quick Quiz: ${topic}`;
  const questions = [
    {
      question: `What is the main topic of this quiz?`,
      options: [topic, "Math", "History", "Science"],
      answer: topic
    },
    {
      question: `Which statement best describes ${topic}?`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      answer: "Option A"
    },
    {
      question: `Which of these is related to ${topic}?`,
      options: ["Related 1", "Related 2", "Related 3", "Related 4"],
      answer: "Related 1"
    }
  ];
  return { title, questions };
}

async function callGemini(prompt, apiKey) {
  // Use global fetch (Node 18+) — if not available, the caller will handle falling back to dummy data.
  if (typeof fetch !== "function") {
    throw new Error("fetch is not available in this environment");
  }

  // Allow explicit GEMINI_API_URL to be set for custom endpoints / proxies
  const customUrl = process.env.GEMINI_API_URL;
  let url;
  let init;

  if (customUrl) {
    url = customUrl;
    init = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({ prompt })
    };
  } else {
    // Best-effort Google Generative API v1beta2 call using API key as query param.
    // Allow overriding the default model endpoint via GEMINI_MODEL_ENDPOINT in .env.
    const endpoint = process.env.GEMINI_MODEL_ENDPOINT || DEFAULT_GEMINI_MODEL_ENDPOINT;
    // Note: users may need to set GEMINI_API_URL for their setup. This is a safe fallback.
    url = `${endpoint}?key=${encodeURIComponent(apiKey)}`;
    const body = {
      prompt: { text: prompt },
      temperature: 0.7,
      maxOutputTokens: 800
    };
    init = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    };
  }

  const res = await fetch(url, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Gemini/Generative API error: ${res.status} ${res.statusText} ${txt}`);
  }

  const data = await res.json();

  // Try a few common response shapes (Google Generative API uses candidates)
  // Candidates may have `output`, or `content` arrays — collect text pieces.
  let assistant = null;
  try {
    if (typeof data === 'string') assistant = data;
    else if (data?.candidates && Array.isArray(data.candidates) && data.candidates[0]) {
      const cand = data.candidates[0];
      if (typeof cand.output === 'string') assistant = cand.output;
      else if (Array.isArray(cand.content)) {
        assistant = cand.content.map(c => (typeof c === 'string' ? c : c?.text || '')).join('\n');
      } else if (typeof cand.text === 'string') assistant = cand.text;
    } else if (data?.choices && Array.isArray(data.choices) && data.choices[0]) {
      // some endpoints return choices similar to OpenAI shape
      assistant = data.choices[0]?.message?.content || data.choices[0]?.text || null;
    }
  } catch (e) {
    assistant = null;
  }

  if (!assistant) {
    // Fallback: try to stringify the whole response if nothing else
    assistant = JSON.stringify(data);
  }

  return assistant;
}

function extractJson(text) {
  // Try to find a JSON object in the text and parse it.
  try {
    // If the whole text is JSON, parse directly.
    return JSON.parse(text);
  } catch (e) {
    // Otherwise try to extract the first {...} block.
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const sub = text.slice(start, end + 1);
      try {
        return JSON.parse(sub);
      } catch (e2) {
        // fall through
      }
    }
  }
  return null;
}

export async function generateQuiz(topic = "General Knowledge") {
  // Prefer explicit GEMINI_API_KEY, fallback to LLM_API_KEY for compatibility
  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey) {
    return dummyQuiz(topic);
  }

  // Build a prompt that asks for JSON containing title and questions with options+answer.
  const prompt = `Create a short quiz about the topic \"${topic}\". Respond with JSON only in the following shape:\n{\n  \"title\": string,\n  \"questions\": [\n    { \"question\": string, \"options\": [string], \"answer\": string }\n  ]\n}\nMake 3-6 questions. Ensure each question has 3-4 options and the answer field matches exactly one option.`;

  try {
  const assistantText = await callGemini(prompt, apiKey);
    const parsed = extractJson(assistantText);
    if (parsed && parsed.title && Array.isArray(parsed.questions)) {
      // Basic validation/normalization: ensure options are arrays of strings and answer is string
      const questions = parsed.questions.map((q) => ({
        question: String(q.question || ""),
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        answer: String(q.answer || "")
      }));
      return { title: String(parsed.title), questions };
    }
    // Fallback
    return dummyQuiz(topic);
  } catch (err) {
    // On any error, return dummy quiz — keep API resilient
    return dummyQuiz(topic);
  }
}

export default { generateQuiz };
