import { errorHandler, notFoundHandler } from "@vestify/shared";
import cors from "cors";
import dotenv from "dotenv";
import express, { Application } from "express";
import "express-async-errors";
import helmet from "helmet";
import productRoutes from "./routes/productRoutes";

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

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (at root level)
// app.get("/health", (req, res) => {
//   res.json({
//     success: true,
//     message: "Product Service is running",
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || "development",
//   });
// });

// API routes
app.use("/api/products", productRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Product Service API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      products: "/api/products",
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
