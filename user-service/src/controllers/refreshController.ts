import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import RefreshToken from "../models/RefreshToken";
import User from "../models/User";
import { generateAccessToken } from "../utils/jwt";

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/users/refresh
 * @access  Public
 */
export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken } = req.body;

    // Find refresh token in database
    const storedToken = await RefreshToken.findByToken(refreshToken);

    if (!storedToken) {
      throw new CustomError("Invalid refresh token", 401);
    }

    // Check if token is expired
    if (new Date() >= storedToken.expiresAt) {
      await RefreshToken.deleteByToken(refreshToken);
      throw new CustomError("Refresh token has expired", 401);
    }

    // Verify JWT refresh token (if using JWT-based refresh tokens)
    // Note: We're using DB tokens, so we skip JWT verification
    // If you want to use JWT refresh tokens, uncomment below:
    // try {
    //   verifyRefreshToken(refreshToken);
    // } catch (error) {
    //   await RefreshToken.deleteByToken(refreshToken);
    //   throw new CustomError("Invalid refresh token", 401);
    // }

    // Find user
    const user = await User.findById(storedToken.userId);

    if (!user) {
      await RefreshToken.deleteByToken(refreshToken);
      throw new CustomError("User not found", 404);
    }

    // Check if user is active
    if (!user.isActive) {
      await RefreshToken.deleteByToken(refreshToken);
      throw new CustomError("Account has been deactivated", 403);
    }

    // Update last used timestamp
    storedToken.lastUsedAt = new Date();
    await storedToken.save();

    // Generate new access token
    const accessToken = generateAccessToken(
      (user._id as mongoose.Types.ObjectId).toString(),
      user.role,
      user.isActive,
    );

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};
