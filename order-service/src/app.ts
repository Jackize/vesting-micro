import { errorHandler, notFoundHandler } from "@vestify/shared";
import cors from "cors";
import dotenv from "dotenv";
import express, { Application } from "express";
import "express-async-errors";
import helmet from "helmet";
import orderRoutes from "./routes/orderRoutes";

// Load environment variables
dotenv.config();

const app: Application = express();
const NODE_ENV = process.env.NODE_ENV;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Order Service is running",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// API routes
app.use("/api/orders", orderRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Order Service API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      orders: "/api/orders",
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
