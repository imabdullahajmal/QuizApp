import Attempt from "../models/Attempt.js";
import Quiz from "../models/Quiz.js";

export async function submitAttempt(req, res) {
	try {
		const { quizId, userAnswers } = req.body || {};

		if (!quizId) {
			return res.status(400).json({ error: "Missing 'quizId' in request body" });
		}
		if (!Array.isArray(userAnswers)) {
			return res.status(400).json({ error: "'userAnswers' must be an array" });
		}

		const quiz = await Quiz.findById(quizId);
		if (!quiz) {
			return res.status(404).json({ error: "Quiz not found" });
		}

		// Compare answers. Count matches where user's answer === stored answer.
		const total = quiz.questions.length;
		let correct = 0;
		for (let i = 0; i < total; i++) {
			const correctAnswer = quiz.questions[i]?.answer;
			const userAnswer = userAnswers[i];
			if (userAnswer !== undefined && userAnswer === correctAnswer) {
				correct++;
			}
		}

		const attempt = new Attempt({
			quizId,
			userAnswers,
			score: correct
		});

		const saved = await attempt.save();

		// Populate quiz details for response
		await saved.populate("quizId");

		return res.status(201).json(saved);
	} catch (err) {
		console.error("submitAttempt error:", err);
		return res.status(500).json({ error: "Failed to submit attempt" });
	}
}

export async function getAttempts(req, res) {
	try {
		const attempts = await Attempt.find().populate("quizId").sort({ createdAt: -1 }).lean();
		return res.json(attempts);
	} catch (err) {
		console.error("getAttempts error:", err);
		return res.status(500).json({ error: "Failed to fetch attempts" });
	}
}

export default { submitAttempt, getAttempts };
