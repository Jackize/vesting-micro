import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import PasswordResetToken from "../models/PasswordResetToken";
import RefreshToken from "../models/RefreshToken";
import User from "../models/User";
import { EmailService } from "../services/emailService";
import { checkRateLimitSendPasswordResetEmail } from "../utils/blacklist";

/**
 * @desc    Request password reset (forgot password)
 * @route   POST /api/users/forgot-password
 * @access  Public
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response<any, Record<string, any>> | void> => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findByEmail(email);

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      // Still return success to prevent email enumeration
      return res.json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }
    // Check rate limit
    await checkRateLimitSendPasswordResetEmail(email);

    // Delete old reset tokens for this user
    await PasswordResetToken.deleteByUserId((user._id as any).toString());

    // Generate reset token
    const token = PasswordResetToken.generateToken();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await PasswordResetToken.create({
      userId: (user._id as any).toString(),
      token,
      expiresAt,
    });

    // Send password reset email (async, don't wait for it)
    EmailService.sendPasswordResetEmail(
      user.email,
      token,
      user.firstName,
    ).catch((error) => {
      console.error("Error sending password reset email:", error);
      // Don't throw - still return success to prevent email enumeration
    });

    res.json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify token for reset password
 * @route   GET /api/users/reset-password/?token=xxx
 * @access  Public
 */
export const verifyTokenResetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token } = req.query;

    if (token!.length !== 64) {
      throw new CustomError("Invalid or expired reset token", 400);
    }
    const resetToken = await PasswordResetToken.findByToken(token as string);
    // If token is not found, return error
    if (!resetToken) {
      throw new CustomError("Invalid or expired reset token", 400);
    }

    // Check if token is expired
    if (new Date() >= resetToken.expiresAt) {
      await PasswordResetToken.deleteByUserId(resetToken.userId);
      throw new CustomError("Reset token has expired", 400);
    }

    // Check if token has been used
    if (resetToken.used) {
      throw new CustomError("Reset token has already been used", 400);
    }
    res.json({
      success: true,
      message: "Reset token verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password with token
 * @route   POST /api/users/reset-password
 * @access  Public
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new CustomError("Token and new password are required", 400);
    }

    // Find reset token
    const resetToken = await PasswordResetToken.findByToken(token);

    if (!resetToken) {
      throw new CustomError("Invalid or expired reset token", 400);
    }

    // Check if token is expired
    if (new Date() >= resetToken.expiresAt) {
      await PasswordResetToken.deleteByUserId(resetToken.userId);
      throw new CustomError("Reset token has expired", 400);
    }

    // Check if token has been used
    if (resetToken.used) {
      throw new CustomError("Reset token has already been used", 400);
    }

    // Find user
    const user = await User.findById(resetToken.userId).select("+password");

    if (!user) {
      await PasswordResetToken.deleteByUserId(resetToken.userId);
      throw new CustomError("User not found", 404);
    }

    // Check if new password is same as current password
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      throw new CustomError(
        "New password must be different from current password",
        400,
      );
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Mark token as used
    resetToken.used = true;
    await resetToken.save();

    // Delete all other reset tokens for this user
    await PasswordResetToken.deleteByUserId(resetToken.userId);

    // Invalidate all refresh tokens (sessions) for security
    await RefreshToken.deleteByUserId(resetToken.userId);

    // Send password reset success email
    EmailService.sendPasswordResetSuccessEmail(
      user.email,
      user.firstName,
    ).catch((error) => {
      console.error("Error sending password reset success email:", error);
    });

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};
