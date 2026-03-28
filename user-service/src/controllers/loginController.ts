import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import RefreshToken from "../models/RefreshToken";
import User from "../models/User";
import { generateAccessToken } from "../utils/jwt";

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );

  if (!user) {
    throw new CustomError("Invalid email or password", 401);
  }

  if (!user.isEmailVerified) {
    throw new CustomError("Please verify your email before logging in", 403);
  }

  if (!user.isActive) {
    throw new CustomError("Account has been deactivated", 403);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new CustomError("Invalid email or password", 401);
  }

  user.lastLogin = new Date();
  await user.save();

  const userId = (user._id as mongoose.Types.ObjectId).toString();
  const accessToken = generateAccessToken(userId, user.role, user.isActive);

  const refreshTokenValue = RefreshToken.generateToken();
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  const expiresInSeconds = expiresIn.endsWith("d")
    ? parseInt(expiresIn) * 24 * 60 * 60
    : expiresIn.endsWith("h")
      ? parseInt(expiresIn) * 60 * 60
      : parseInt(expiresIn);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  await RefreshToken.create({
    userId,
    token: refreshTokenValue,
    expiresAt,
  });

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.getFullName(),
        role: user.role,
        lastLogin: user.lastLogin,
      },
      accessToken,
      refreshToken: refreshTokenValue,
    },
  });
};
