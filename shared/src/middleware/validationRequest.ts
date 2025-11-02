import { NextFunction, Request, Response } from "express";
import { ValidationChain, validationResult } from "express-validator";
import { CustomError } from "../errors/CustomError";

/**
 * Validation request middleware
 * Validates request input using express-validator
 * Should be used after validation chains
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validationRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => err.msg)
      .join(", ");
    throw new CustomError(errorMessages, 400);
  }
  next();
};

/**
 * Helper function to combine validation chains with validationRequest middleware
 *
 * @param validations - Array of validation chains from express-validator
 * @returns Array of middleware functions
 */
export const validate = (validations: ValidationChain[]) => {
  return [...validations, validationRequest];
};
