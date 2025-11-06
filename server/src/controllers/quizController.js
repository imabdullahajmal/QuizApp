import Quiz from "../models/Quiz.js";
import llmService from "../services/llmService.js";

export async function createQuiz(req, res) {
	try {
		const { topic, numQuestions, difficulty } = req.body || {};
		if (!topic || typeof topic !== "string") {
			return res.status(400).json({ error: "Missing or invalid 'topic' in request body" });
		}

		// Validate numQuestions (optional) — coerce to integer and clamp
		let count = 3;
		if (numQuestions !== undefined) {
			const n = Number(numQuestions);
			if (!Number.isInteger(n) || n < 1 || n > 50) {
				return res.status(400).json({ error: "'numQuestions' must be an integer between 1 and 50" });
			}
			count = n;
		}

		// Validate difficulty (optional)
		const allowed = ["easy", "medium", "hard"];
		let level = "medium";
		if (difficulty !== undefined) {
			if (typeof difficulty !== "string" || !allowed.includes(difficulty.toLowerCase())) {
				return res.status(400).json({ error: "'difficulty' must be one of: easy, medium, hard" });
			}
			level = difficulty.toLowerCase();
		}

		// Ask LLM service to generate quiz content
		const generated = await llmService.generateQuiz(topic, { numQuestions: count, difficulty: level });

		const quiz = new Quiz({
				title: generated.title || `Quiz: ${topic}`,
				numQuestions: generated.questions ? generated.questions.length : count,
				difficulty: level,
				questions: Array.isArray(generated.questions) ? generated.questions : []
		});

		const saved = await quiz.save();
		return res.status(201).json(saved);
	} catch (err) {
		console.error("createQuiz error:", err);
		return res.status(500).json({ error: "Failed to create quiz" });
	}
}

export async function getAllQuizzes(req, res) {
	try {
		const quizzes = await Quiz.find().sort({ createdAt: -1 }).lean();
		return res.json(quizzes);
	} catch (err) {
		console.error("getAllQuizzes error:", err);
		return res.status(500).json({ error: "Failed to fetch quizzes" });
	}
}

export async function getQuizById(req, res) {
	try {
		const { id } = req.params;
		if (!id) return res.status(400).json({ error: "Missing quiz id" });

		const quiz = await Quiz.findById(id).lean();
		if (!quiz) return res.status(404).json({ error: "Quiz not found" });
		return res.json(quiz);
	} catch (err) {
		console.error("getQuizById error:", err);
		return res.status(500).json({ error: "Failed to fetch quiz" });
	}
}

export default { createQuiz, getAllQuizzes, getQuizById };
