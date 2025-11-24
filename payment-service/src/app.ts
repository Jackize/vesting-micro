import { errorHandler, notFoundHandler } from "@vestify/shared";
import cors from "cors";

import dotenv from "dotenv";
import express, { Application } from "express";
import "express-async-errors";
import helmet from "helmet";
import paymentRoutes from "./routes/paymentRoutes";

// Load environment variables
dotenv.config();

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.set("trust proxy", true);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (at root level)
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Payment Service is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/payments", paymentRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Payment Service API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      payments: "/api/payments",
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
