const express = require("express");
const router = express.Router();

// Sample quiz data
let quizQuestions = [
  { text: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correct: "Paris" },
  { text: "What is 5 + 7?", options: ["10", "12", "15", "20"], correct: "12" },
  { text: "What is the color of the sky?", options: ["Red", "Blue", "Green", "Yellow"], correct: "Blue" }
];

// ✅ Get all quizzes
router.get("/", (req, res) => {
  res.json(quizQuestions);
});

// ✅ Add a new quiz
router.post("/", (req, res) => {
  const { text, options, correct } = req.body;
  if (!text || !options || !correct) {
    return res.status(400).json({ error: "Missing fields" });
  }
  quizQuestions.push({ text, options, correct });
  res.status(201).json({ message: "Quiz added successfully" });
});

module.exports = router;
