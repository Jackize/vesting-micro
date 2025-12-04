import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import EmailVerificationToken from "../models/EmailVerificationToken";
import User from "../models/User";
import { EmailService } from "../services/emailService";

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
        isActive: user.isActive,
      },
    },
  });
};
