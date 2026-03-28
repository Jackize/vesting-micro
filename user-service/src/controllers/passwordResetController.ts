import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import PasswordResetToken from "../models/PasswordResetToken";
import RefreshToken from "../models/RefreshToken";
import User from "../models/User";
import { EmailService } from "../services/emailService";

// @desc    Request password reset (forgot password)
// @route   POST /api/users/forgot-password
// @access  Public
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response<any, Record<string, any>> | void> => {
  const { email } = req.body;

  const user = await User.findByEmail(email);

  if (!user) {
    return res.json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  }

  await PasswordResetToken.deleteByUserId((user._id as any).toString());

  const token = PasswordResetToken.generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await PasswordResetToken.create({
    userId: (user._id as any).toString(),
    token,
    expiresAt,
  });

  EmailService.sendPasswordResetEmail(user.email, token, user.firstName).catch(
    (error) => {
      console.error("Error sending password reset email:", error);
    },
  );

  res.json({
    success: true,
    message:
      "If an account with that email exists, a password reset link has been sent.",
  });
};

// @desc    Verify token for reset password
// @route   GET /api/users/reset-password/?token=xxx
// @access  Public
export const verifyTokenResetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { token } = req.query;

  if ((token as string).length !== 64) {
    throw new CustomError("Invalid or expired reset token", 400);
  }

  const resetToken = await PasswordResetToken.findByToken(token as string);
  if (!resetToken) {
    throw new CustomError("Invalid or expired reset token", 400);
  }

  if (new Date() >= resetToken.expiresAt) {
    await PasswordResetToken.deleteByUserId(resetToken.userId);
    throw new CustomError("Reset token has expired", 400);
  }

  if (resetToken.used) {
    throw new CustomError("Reset token has already been used", 400);
  }

  res.json({ success: true, message: "Reset token verified successfully" });
};

// @desc    Reset password with token
// @route   POST /api/users/reset-password
// @access  Public
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new CustomError("Token and new password are required", 400);
  }

  const resetToken = await PasswordResetToken.findByToken(token);
  if (!resetToken) {
    throw new CustomError("Invalid or expired reset token", 400);
  }

  if (new Date() >= resetToken.expiresAt) {
    await PasswordResetToken.deleteByUserId(resetToken.userId);
    throw new CustomError("Reset token has expired", 400);
  }

  if (resetToken.used) {
    throw new CustomError("Reset token has already been used", 400);
  }

  const user = await User.findById(resetToken.userId).select("+password");
  if (!user) {
    await PasswordResetToken.deleteByUserId(resetToken.userId);
    throw new CustomError("User not found", 404);
  }

  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    throw new CustomError(
      "New password must be different from current password",
      400,
    );
  }

  user.password = newPassword;
  await user.save();

  resetToken.used = true;
  await resetToken.save();

  await PasswordResetToken.deleteByUserId(resetToken.userId);
  await RefreshToken.deleteByUserId(resetToken.userId);

  res.json({ success: true, message: "Password reset successfully" });
};
