import { NextFunction, Request, Response } from "express";
import RefreshToken from "../models/RefreshToken";

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await RefreshToken.deleteByToken(refreshToken);
  }

  res.json({ success: true, message: "Logged out successfully" });
};
