const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// WebSocket Configuration
const io = new Server(server, {
  cors: {
    origin: "https://nssrbu.com", // ✅ Allow frontend to connect
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// ✅ Root Route (Fixes "Cannot GET /")
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// ✅ Sample API Route
app.get("/quizzes", (req, res) => {
  res.json(quizQuestions);
});

// Quiz Data
let quizQuestions = [
  { text: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correct: "Paris" },
  { text: "What is 5 + 7?", options: ["10", "12", "15", "20"], correct: "12" },
  { text: "What is the color of the sky?", options: ["Red", "Blue", "Green", "Yellow"], correct: "Blue" },
];

let currentQuestionIndex = 0;
let leaderboard = [];
const teams = new Map();
let answeredTeams = new Set();
let quizStartTime = null;
let countdownInterval = null;
let questionTimer = null;

// Start Quiz Countdown
const broadcastCountdown = () => {
  if (!quizStartTime) return;

  const now = Date.now();
  const timeLeft = Math.max(0, Math.floor((quizStartTime - now) / 1000));

  io.emit("countdownUpdate", { timeLeft });

  if (timeLeft === 0) {
    clearInterval(countdownInterval);
    startQuiz();
  }
};

// Start the Quiz
const startQuiz = () => {
  console.log("🔹 Quiz Started!");
  currentQuestionIndex = 0;
  leaderboard = [];
  answeredTeams.clear();
  quizStartTime = null;
  io.emit("startQuiz");
  sendQuestion();
};

// Send Question
const sendQuestion = () => {
  if (currentQuestionIndex < quizQuestions.length) {
    answeredTeams.clear();
    io.emit("newQuestion", quizQuestions[currentQuestionIndex]);

    // Start 30-second timer for the question
    if (questionTimer) clearTimeout(questionTimer);
    questionTimer = setTimeout(nextQuestion, 30000);
  } else {
    io.emit("quizEnd", leaderboard);
  }
};

// Move to Next Question
const nextQuestion = () => {
  currentQuestionIndex++;
  answeredTeams.clear();
  sendQuestion();
};

// Admin Triggers Quiz Start
app.post("/set-quiz-start", (req, res) => {
  const { seconds } = req.body;
  quizStartTime = Date.now() + seconds * 1000;

  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(broadcastCountdown, 1000);
  broadcastCountdown();

  res.status(200).json({ message: "Quiz start countdown set", startTime: quizStartTime });
});

// WebSocket Handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("registerTeam", ({ teamName }) => {
    teams.set(socket.id, teamName);
    console.log(`Team registered: ${teamName} (ID: ${socket.id})`);

    if (quizStartTime) {
      broadcastCountdown();
    }
  });

  socket.on("submitAnswer", (data) => {
    const { answer, teamName } = data;
    const socketId = socket.id;
    const currentQuestion = quizQuestions[currentQuestionIndex];

    if (!answeredTeams.has(socketId)) {
      if (answer === currentQuestion.correct) {
        let existingTeam = leaderboard.find((t) => t.id === socketId);
        const points = answeredTeams.size === 0 ? 10 : 5; // First correct answer gets more points
        
        if (!existingTeam) {
          leaderboard.push({ id: socketId, name: teamName, points });
        } else {
          existingTeam.points += points;
        }
        
        leaderboard.sort((a, b) => b.points - a.points);
      }

      answeredTeams.add(socketId);
      io.emit("updateLeaderboard", leaderboard);
    }

    if (answeredTeams.size === teams.size) {
      clearTimeout(questionTimer);
      setTimeout(nextQuestion, 2000);
    }
  });

  socket.on("disconnect", () => {
    const teamName = teams.get(socket.id);
    console.log(`Team disconnected: ${teamName} (ID: ${socket.id})`);
    teams.delete(socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Export for Vercel
module.exports = app;