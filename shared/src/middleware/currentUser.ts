import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { CustomError } from "../errors/CustomError";
import { JWTPayload } from "../types/jwt";

declare global {
  namespace Express {
    interface Request {
      currentUser?: JWTPayload;
    }
  }
}

/**
 * Current user middleware
 * Extracts JWT token from Authorization header and attaches payload to req.currentUser
 * Token should be in format: "Bearer <token>"
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const currentUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next();
    }

    // Verify token
    const secret = process.env.JWT_SECRET || "fallback-secret";
    const decoded = jwt.verify(token, secret) as JWTPayload;
    console.log("decoded", decoded);
    // Attach payload to request
    req.currentUser = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new CustomError("Invalid token", 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new CustomError("Token expired", 401));
    }
    return next(new CustomError("Invalid token", 401));
  }
};
