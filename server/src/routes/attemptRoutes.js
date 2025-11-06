import express from "express";
import { submitAttempt, getAttempts } from "../controllers/attemptController.js";

const router = express.Router();

// POST /api/attempts  -> submit an attempt
router.post("/", submitAttempt);

// GET /api/attempts   -> list attempts (populates quiz)
router.get("/", getAttempts);

export default router;
