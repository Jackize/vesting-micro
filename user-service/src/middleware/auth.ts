import { CustomError, currentUser as sharedCurrentUser } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import { isBlacklisted } from "../utils/blacklist";

/**
 * Enhanced currentUser middleware with blacklist checking
 * Wraps the shared currentUser middleware and adds token blacklist validation
 */
export const currentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // First, extract token to check blacklist
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];

    // Check if token is blacklisted
    if (token) {
      const blacklisted = await isBlacklisted(token);
      if (blacklisted) {
        return next(new CustomError("Token has been revoked", 401));
      }
    }
  }

  // Use shared currentUser middleware
  return sharedCurrentUser(req, res, next);
};
