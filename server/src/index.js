import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDatabase } from "./config/db.js";
import postRoutes from "./routes/postRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "LagaTour Backend API",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api", postRoutes);
app.use("/api/auth", authRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// Start Server and Initialize Database
async function startServer() {
  try {
    console.log("⏳ Connecting to MySQL and initializing schema...");
    try {
      await initDatabase();
    } catch (dbErr) {
      console.warn("⚠️ Warning: Could not connect to MySQL database at startup. Backend will keep running; please verify your MySQL server status and .env settings.", dbErr.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 LagaTour Node.js Server running on port ${PORT}`);
      console.log(`📡 Healthcheck available at: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

startServer();
