/*
  Lightweight LLM service for generating quizzes.
  - If process.env.LLM_API_KEY is present, it will attempt to call OpenAI's Chat Completions API (gpt-3.5-turbo) and parse JSON output.
  - If no API key is present, returns a deterministic dummy quiz for the given topic.
  Keep this simple and resilient: parsing failures fall back to dummy content.
*/

import process from "process";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

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

async function callOpenAI(prompt, apiKey) {
  // Use global fetch (Node 18+) — if not available, the caller will handle falling back to dummy data.
  if (typeof fetch !== "function") {
    throw new Error("fetch is not available in this environment");
  }

  const body = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "system", content: "You are a helpful assistant that outputs JSON only." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 800
  };

  const res = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenAI error: ${res.status} ${res.statusText} ${txt}`);
  }

  const data = await res.json();
  // assistant message content
  const assistant = data?.choices?.[0]?.message?.content;
  if (!assistant) throw new Error("No assistant content returned from OpenAI");
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
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    return dummyQuiz(topic);
  }

  // Build a prompt that asks for JSON containing title and questions with options+answer.
  const prompt = `Create a short quiz about the topic \"${topic}\". Respond with JSON only in the following shape:\n{\n  \"title\": string,\n  \"questions\": [\n    { \"question\": string, \"options\": [string], \"answer\": string }\n  ]\n}\nMake 3-6 questions. Ensure each question has 3-4 options and the answer field matches exactly one option.`;

  try {
    const assistantText = await callOpenAI(prompt, apiKey);
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
