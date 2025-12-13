import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import RefreshToken from "../models/RefreshToken";

/**
 * @desc    Get all active sessions for current user
 * @route   GET /api/users/sessions
 * @access  Private
 */
export const getUserSessions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.currentUser!.userId;

    const sessions = await RefreshToken.findByUserId(userId);

    const sessionsData = sessions.map((session) => ({
      sessionId: session.sessionId,
      deviceInfo: session.deviceInfo,
      lastUsedAt: session.lastUsedAt,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: session.token === req.body.refreshToken, // Check if this is current session
    }));

    res.json({
      success: true,
      data: {
        sessions: sessionsData,
      },
    });
  } catch (error) {
    next(error);
  }
};
