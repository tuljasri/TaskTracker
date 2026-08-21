const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================================
// CORS CONFIGURATION
// =====================================================
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

// =====================================================
// JSON PARSER
// =====================================================
app.use(express.json());

// =====================================================
// ROUTES
// =====================================================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Task Tracker API is live and operational!"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// =====================================================
// 404 HANDLER
// =====================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================
app.use(errorHandler);

// =====================================================
// MONGODB CONNECTION & SERVER LAUNCH
// =====================================================
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/task_tracker";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(" Connected to MongoDB successfully");
    app.listen(PORT, () => {
      console.log(` Task Tracker Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error.message);
  });

module.exports = app;