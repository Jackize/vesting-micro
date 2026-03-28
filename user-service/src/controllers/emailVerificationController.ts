import { CustomError, ResponseError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import EmailVerificationToken from "../models/EmailVerificationToken";
import User from "../models/User";
import { EmailService } from "../services/emailService";

const MINIMUM_TIME_BETWEEN_EMAILS = 5 * 60 * 1000; // 5 minutes

// @desc    Verify email with token
// @route   GET /api/users/verify-email?token=xxx
// @access  Public
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<
  Response<{ success: true; message: string }> | ResponseError | void
> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      throw new CustomError("Verification token is required", 400);
    }

    const verificationToken = await EmailVerificationToken.findByToken(token);

    if (!verificationToken) {
      throw new CustomError("Invalid or expired verification token", 400);
    }

    if (new Date() >= verificationToken.expiresAt) {
      await EmailVerificationToken.deleteByUserId(verificationToken.userId);
      throw new CustomError("Verification token has expired", 400);
    }

    const user = await User.findById(verificationToken.userId);

    if (!user) {
      await EmailVerificationToken.deleteByUserId(verificationToken.userId);
      throw new CustomError("User not found", 404);
    }

    if (user.isEmailVerified) {
      await EmailVerificationToken.deleteByUserId(verificationToken.userId);
      return res.json({ success: true, message: "Email is already verified" });
    }

    user.isEmailVerified = true;
    user.isActive = true;
    await user.save();

    await EmailVerificationToken.deleteByUserId(verificationToken.userId);

    res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/users/resend-verification
// @access  Public
export const resendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response<any, Record<string, any>> | void> => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);

    if (!user) {
      return res.json({
        success: true,
        message:
          "If an account with that email exists, a verification email has been sent.",
      });
    }

    if (user.isEmailVerified) {
      return res.json({ success: true, message: "Email is already verified" });
    }

    // Enforce 5-minute cooldown between sends
    const lastSentToken = await EmailVerificationToken.findOne({
      userId: user.id,
    });
    if (
      lastSentToken &&
      Date.now() - new Date(lastSentToken.createdAt).getTime() <
        MINIMUM_TIME_BETWEEN_EMAILS
    ) {
      const secondsLeft = Math.ceil(
        (MINIMUM_TIME_BETWEEN_EMAILS -
          (Date.now() - new Date(lastSentToken.createdAt).getTime())) /
          1000,
      );
      throw new CustomError(
        `Please wait ${secondsLeft} seconds before resending the verification email`,
        429,
      );
    }

    await EmailVerificationToken.deleteByUserId(user.id);

    const token = EmailVerificationToken.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await EmailVerificationToken.create({ userId: user.id, token, expiresAt });

    EmailService.sendVerificationEmail(user.email, token, user.firstName).catch(
      (error) => {
        console.error("Error sending verification email:", error);
      },
    );

    res.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    next(error);
  }
};
