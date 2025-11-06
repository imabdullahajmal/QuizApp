import express from "express";
import { createQuiz, getAllQuizzes, getQuizById } from "../controllers/quizController.js";

const router = express.Router();

// POST /api/quizzes   { topic }
router.post("/", createQuiz);

// GET /api/quizzes
router.get("/", getAllQuizzes);

// GET /api/quizzes/:id
router.get("/:id", getQuizById);

export default router;
