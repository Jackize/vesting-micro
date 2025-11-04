import { NextFunction, Request, Response } from "express";
import { AppError, CustomError } from "../errors/CustomError";

// Error handler middleware
export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err } as AppError;
  error.message = err.message;

  // Log error for debugging
  console.error("Error:", {
    message: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new CustomError(message, 404);
  }

  // Mongoose duplicate key
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    const message = `${field} already exists`;
    error = new CustomError(message, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values((err as any).errors)
      .map((val: any) => val.message)
      .join(", ");
    error = new CustomError(message, 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new CustomError("Invalid token", 401);
  }

  if (err.name === "TokenExpiredError") {
    error = new CustomError("Token expired", 401);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// 404 Not Found handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new CustomError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};
