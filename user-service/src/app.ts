import { errorHandler, notFoundHandler } from "@vestify/shared";
import cors from "cors";
import dotenv from "dotenv";
import express, { Application } from "express";
import "express-async-errors";
import helmet from "helmet";
import userRoutes from "./routes/userRoutes";

// Load environment variables
dotenv.config();

const app: Application = express();
const NODE_ENV = process.env.NODE_ENV || "development";

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

// API routes
app.use("/api/users", userRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
