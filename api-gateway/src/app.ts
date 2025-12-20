import { errorHandler, notFoundHandler } from "@vestify/shared";
import cors from "cors";
import dotenv from "dotenv";
import express, { Application } from "express";
import "express-async-errors";
import helmet from "helmet";
import { servicesHealthHandler } from "./config/services";
import { requestId, requestLogger } from "./middleware/logger";
import { serviceProxy } from "./middleware/proxy";
import {
  apiRateLimiter,
  authRateLimiter,
  paymentRateLimiter,
} from "./middleware/rateLimiter";
import { attachServiceName } from "./middleware/serviceName";

// Load environment variables
dotenv.config();

const app: Application = express();

// Trust proxy (for rate limiting and IP detection behind reverse proxy)
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request ID middleware (must be early)
app.use(requestId);

// Request logging middleware
app.use(requestLogger);

// Health check handler
const healthHandler = (req: express.Request, res: express.Response) => {
  res.status(200).json({
    success: true,
    message: "API Gateway is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

// Health check endpoints (for internal k8s probes - direct pod access)
app.get("/health", healthHandler);
app.get("/health/services", servicesHealthHandler);

// Health check endpoints (for external access through ingress /api/*)
app.get("/api/health", healthHandler);
app.get("/api/health/services", servicesHealthHandler);

// Attach service name to request
app.use(attachServiceName);

// Apply rate limiting based on route
app.use((req, res, next) => {
  // Auth endpoints - strict rate limiting
  if (
    req.path.startsWith("/api/users/login") ||
    req.path.startsWith("/api/users/register")
  ) {
    return authRateLimiter(req, res, next);
  }

  // Payment endpoints - payment rate limiting
  if (req.path.startsWith("/api/payments")) {
    return paymentRateLimiter(req, res, next);
  }

  // All other API routes - general rate limiting
  if (req.path.startsWith("/api")) {
    return apiRateLimiter(req, res, next);
  }

  next();
});

// Service proxy middleware (routes requests to appropriate microservices)
app.use("/api", serviceProxy);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
