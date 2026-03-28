import { errorHandler, notFoundHandler } from "@vestify/shared";
import dotenv from "dotenv";
import express, { Application } from "express";
import "express-async-errors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import userRoutes from "./routes/userRoutes";

// Load environment variables
dotenv.config();

const app: Application = express();

// Security middleware (CSP disabled for /api/docs so Swagger UI assets load)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/docs")) return next();
  helmet()(req, res, next);
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "User Service is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API docs
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Vestify User Service API",
    swaggerOptions: { persistAuthorization: true },
  }),
);
app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// API routes
app.use("/api/users", userRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
