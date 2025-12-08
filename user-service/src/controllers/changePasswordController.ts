import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import RefreshToken from "../models/RefreshToken";
import User from "../models/User";
import { EmailService } from "../services/emailService";
import { addToBlacklist } from "../utils/blacklist";
import { getDeviceInfo } from "../utils/deviceInfo";

/**
 * @desc    Change user password
 * @route   PUT /api/users/change-password
 * @access  Private
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.currentUser!.userId;

    // Find user with password field
    const user = await User.findById(userId).select("+password");
    if (!user) {
      throw new CustomError("User not found", 404);
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      const secondsLeft = user.getLockoutDuration();
      throw new CustomError(
        `Account is temporarily locked. Please try again in ${secondsLeft} second(s).`,
        423,
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      // Increment failed login attempts and apply lockout if needed
      await user.incrementFailedLoginAttempts();

      // Check if account got locked after this attempt
      if (user.isAccountLocked()) {
        const secondsLeft = user.getLockoutDuration();
        throw new CustomError(
          `Too many failed change password attempts. Account locked for ${secondsLeft} second(s).`,
          423,
        );
      }

      throw new CustomError("Invalid current password", 401);
    }

    // Reset failed login attempts on successful login
    await user.resetFailedLoginAttempts();

    // Check if new password is same as current password
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      throw new CustomError(
        "New password must be different from current password",
        400,
      );
    }

    // Get access token from Authorization header to blacklist it
    const authHeader = req.headers.authorization;
    let accessToken: string | undefined;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.split(" ")[1];
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    // Invalidate all refresh tokens (sessions) for this user
    await RefreshToken.deleteByUserId(userId);

    // Blacklist current access token if available
    if (accessToken) {
      console.log(accessToken);
      const decoded = jwt.decode(accessToken) as jwt.JwtPayload | null;
      if (decoded && decoded.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        const expiresIn = decoded.exp - currentTime;
        if (expiresIn > 0) {
          console.log(expiresIn);
          await addToBlacklist(accessToken, expiresIn);
        }
      }
    }
    const device = getDeviceInfo(req);

    // Send password reset success email
    EmailService.sendChangePasswordSuccessEmail(
      user.email,
      user.firstName,
      device,
    ).catch((error) => {
      console.error("Error sending change password success email:", error);
    });

    res.json({
      success: true,
      message:
        "Password changed successfully. All sessions have been logged out.",
    });
  } catch (error) {
    next(error);
  }
};
