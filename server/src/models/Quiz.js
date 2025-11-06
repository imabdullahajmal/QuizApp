import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    title: String,
    numQuestions: Number,
    difficulty: String,
    questions: [
      {
        question: String,
        options: [String],
        answer: String
      }
    ]
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
