import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import EmailVerificationToken from "../models/EmailVerificationToken";
import RefreshToken from "../models/RefreshToken";
import User from "../models/User";
import { EmailService } from "../services/emailService";
import { getDeviceInfo } from "../utils/deviceInfo";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password, firstName, lastName, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new CustomError("User with this email already exists", 400);
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    phone,
  });

  const userId = (user._id as mongoose.Types.ObjectId).toString();

  // Generate access token (short-lived)
  const accessToken = generateAccessToken(userId, user.role, user.isActive);

  // Generate refresh token (long-lived)
  const refreshTokenValue = RefreshToken.generateToken();
  const sessionId = RefreshToken.generateSessionId();
  const refreshTokenJWT = generateRefreshToken(userId);

  // Get device info
  const deviceInfo = getDeviceInfo(req);

  // Calculate expiration (7 days default)
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  const expiresInSeconds = expiresIn.endsWith("d")
    ? parseInt(expiresIn) * 24 * 60 * 60
    : expiresIn.endsWith("h")
      ? parseInt(expiresIn) * 60 * 60
      : parseInt(expiresIn);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  // Store refresh token in database
  await RefreshToken.create({
    userId,
    token: refreshTokenValue,
    sessionId,
    expiresAt,
    deviceInfo,
  });

  // Generate email verification token
  const verificationToken = EmailVerificationToken.generateToken();
  const verificationExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await EmailVerificationToken.create({
    userId,
    token: verificationToken,
    expiresAt: verificationExpiresAt,
  });

  // Send verification email (async, don't wait for it)
  EmailService.sendVerificationEmail(
    user.email,
    verificationToken,
    user.firstName,
  ).catch((error) => {
    console.error("Error sending verification email:", error);
    // Don't throw - registration should succeed even if email fails
  });

  res.status(201).json({
    success: true,
    message:
      "User registered successfully. Please check your email to verify your account.",
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.getFullName(),
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      accessToken,
      refreshToken: refreshTokenValue, // Return the DB token, not JWT
    },
  });
};
