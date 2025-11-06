import express from "express";
import cors from "cors";
import quizRoutes from "./routes/quizRoutes.js";
import attemptRoutes from "./routes/attemptRoutes.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/quizzes", quizRoutes);
app.use("/api/attempts", attemptRoutes);

// Minimal health route
app.get("/", (req, res) => res.json({ ok: true }));

export default app;
