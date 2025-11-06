import Quiz from "../models/Quiz.js";
import llmService from "../services/llmService.js";

export async function createQuiz(req, res) {
	try {
		const { topic } = req.body || {};
		if (!topic || typeof topic !== "string") {
			return res.status(400).json({ error: "Missing or invalid 'topic' in request body" });
		}

		// Ask LLM service to generate quiz content
		const generated = await llmService.generateQuiz(topic);

		const quiz = new Quiz({
			title: generated.title || `Quiz: ${topic}`,
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
