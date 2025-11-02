import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../errors/CustomError';

/**
 * Require authentication middleware
 * Decodes JWT token from Authorization header and attaches user payload to req.user
 * 
 * @param secret - Optional JWT secret (defaults to JWT_SECRET env variable)
 * @returns Express middleware function
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    
    if (!req.currentUser) {
        throw new CustomError('Not authorized, user not found in request', 401);
    }

    next();
};
