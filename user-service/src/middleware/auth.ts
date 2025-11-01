import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { CustomError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// Protect routes - require authentication
export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new CustomError('Not authorized, no token provided', 401);
    }

    try {
      // Verify token
      const secret = process.env.JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(token, secret) as { userId: string };

      // Get user from token
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new CustomError('User not found', 404);
      }

      if (!user.isActive) {
        throw new CustomError('Account has been deactivated', 403);
      }

      req.user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new CustomError('Invalid token', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new CustomError('Token expired', 401);
      }
      throw error;
    }
};

// Grant access to specific roles
export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new CustomError('Not authorized', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new CustomError(
        `User role '${req.user.role}' is not authorized to access this route`,
        403
      );
    }

    next();
  };
};

