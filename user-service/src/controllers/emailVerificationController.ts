import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import EmailVerificationToken from "../models/EmailVerificationToken";
import User from "../models/User";
import { EmailService } from "../services/emailService";
import { checkRateLimitResendVerificationEmail } from "../utils/blacklist";
const MINIMUM_TIME_BETWEEN_EMAILS = 5 * 60 * 1000; // 5 minutes
/**
 * @desc    Verify email with token
 * @route   GET /api/users/verify-email?token=xxx
 * @access  Public
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response<any, Record<string, any>> | void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      throw new CustomError("Verification token is required", 400);
    }

    // Find verification token
    const verificationToken = await EmailVerificationToken.findByToken(token);

    if (!verificationToken) {
      throw new CustomError("Invalid or expired verification token", 400);
    }

    // Check if token is expired
    if (new Date() >= verificationToken.expiresAt) {
      await EmailVerificationToken.deleteByUserId(verificationToken.userId);
      throw new CustomError("Verification token has expired", 400);
    }

    // Find user
    const user = await User.findById(verificationToken.userId);

    if (!user) {
      await EmailVerificationToken.deleteByUserId(verificationToken.userId);
      throw new CustomError("User not found", 404);
    }

    // Check if already verified
    if (user.isEmailVerified) {
      await EmailVerificationToken.deleteByUserId(verificationToken.userId);
      return res.json({
        success: true,
        message: "Email is already verified",
      });
    }

    // Verify email
    user.isEmailVerified = true;
    await user.save();

    // Delete verification token
    await EmailVerificationToken.deleteByUserId(verificationToken.userId);

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend verification email
 * @route   POST /api/users/resend-verification
 * @access  Private
 */
export const resendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response<any, Record<string, any>> | void> => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.json({
        success: true,
        message: "Email is already verified",
      });
    }

    // Check rate limit
    await checkRateLimitResendVerificationEmail(user.email);

    // Check last sent time (minimum 5 minutes between each email)
    const lastSentToken = await EmailVerificationToken.findOne({
      userId: user!.id,
    });
    if (
      lastSentToken &&
      new Date(lastSentToken.expiresAt).getTime() +
        MINIMUM_TIME_BETWEEN_EMAILS >
        Date.now()
    ) {
      throw new CustomError(
        `Please wait ${Math.ceil(
          (MINIMUM_TIME_BETWEEN_EMAILS -
            (Date.now() - new Date(lastSentToken.expiresAt).getTime())) /
            1000,
        )} seconds before resending the verification email`,
        429,
      );
    }

    // Delete old verification tokens
    await EmailVerificationToken.deleteByUserId(user.id);

    // Generate new verification token
    const token = EmailVerificationToken.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await EmailVerificationToken.create({
      userId: user.id,
      token,
      expiresAt,
    });

    // Send verification email
    await EmailService.sendVerificationEmail(
      user.email,
      token,
      user.firstName,
    ).catch((error) => {
      console.error("Error sending verification email:", error);
      // Don't throw - still return success to prevent email enumeration
    });

    res.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    next(error);
  }
};
