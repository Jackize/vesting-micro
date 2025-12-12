import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import RefreshToken from "../models/RefreshToken";
import TokenBlacklist from "../models/TokenBlacklist";
import { addToBlacklist } from "../utils/blacklist";

/**
 * @desc    Logout user (current session, specific session, or all sessions)
 * @route   POST /api/users/logout
 * @access  Private
 * @body    { sessionId?: string } - Optional. If "all", logout all sessions. If sessionId provided, logout that session.
 */
export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response<any, Record<string, any>> | void> => {
  try {
    const userId = req.currentUser!.userId;
    const { sessionId } = req.body;

    // Get access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new CustomError("No token provided", 401);
    }

    const accessToken = authHeader.split(" ")[1];

    if (!accessToken) {
      throw new CustomError("No token provided", 401);
    }

    // Decode access token to get expiration
    const decoded = jwt.decode(accessToken) as jwt.JwtPayload | null;
    if (!decoded || !decoded.userId) {
      throw new CustomError("Invalid token", 401);
    }

    // Calculate expiration time for access token
    let expiresIn: number;
    if (decoded.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      expiresIn = decoded.exp - currentTime;
    } else {
      // Default to 24 hours if no expiration found
      expiresIn = 24 * 60 * 60;
    }

    // Add access token to Redis blacklist
    if (expiresIn > 0) {
      await addToBlacklist(accessToken, expiresIn);
    }

    // Store access token in MongoDB for audit trail
    if (expiresIn > 0) {
      await TokenBlacklist.create({
        token: accessToken,
        userId: decoded.userId,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      });
    }

    // Handle session logout
    if (sessionId === "all") {
      // Logout all sessions
      await RefreshToken.deleteByUserId(userId);
      return res.json({
        success: true,
        message: "Logged out from all sessions successfully",
      });
    } else if (sessionId) {
      // Logout specific session
      const session = await RefreshToken.findBySessionId(sessionId);
      if (!session || session.userId !== userId) {
        return res.json({
          success: true,
          message: "Session not found",
        });
      }
      await RefreshToken.deleteBySessionId(sessionId);
      return res.json({
        success: true,
        message: "Logged out from session successfully",
      });
    } else {
      // Logout current session (need refresh token to identify current session)
      const { refreshToken } = req.body;
      if (refreshToken) {
        const session = await RefreshToken.findByToken(refreshToken);
        if (session && session.userId === userId) {
          await RefreshToken.deleteByToken(refreshToken);
        }
      }
      return res.json({
        success: true,
        message: "Logged out successfully",
      });
    }
  } catch (error) {
    next(error);
  }
};
