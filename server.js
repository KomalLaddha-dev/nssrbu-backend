const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// ✅ Root Route (Avoids "Cannot GET /")
app.get("/", (req, res) => {
  res.send("🚀 Backend is running!");
});

// ✅ API Routes
app.use("/api/quizzes", require("./routes/quizzes"));  // Load quiz routes

// ✅ WebSocket Configuration
const io = new Server(server, {
  cors: {
    origin: "https://nssrbu.com",
    methods: ["GET", "POST"]
  }
});

// ✅ WebSocket Events
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Export for Vercel
module.exports = app;
