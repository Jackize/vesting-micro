import { NextFunction, Request, Response } from "express";
import { CustomError } from "../errors/CustomError";

/**
 * Require role middleware
 * Checks if the role exists in the token payload and matches the required roles
 * Must be used after currentUser middleware
 *
 * @param roles - Array of roles that are allowed to access the route
 * @returns Express middleware function
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      throw new CustomError("Not authorized, user not found in request", 401);
    }
    // Check if role exists in token payload
    if (!req.currentUser.role) {
      throw new CustomError("Role not found in token", 403);
    }

    // Check if user's role matches any of the required roles
    if (!roles.includes(req.currentUser.role)) {
      throw new CustomError(
        `User role '${req.currentUser.role}' is not authorized to access this route. Required roles: ${roles.join(", ")}`,
        403
      );
    }

    next();
  };
};
