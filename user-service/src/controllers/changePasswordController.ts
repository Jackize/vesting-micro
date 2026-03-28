import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import RefreshToken from "../models/RefreshToken";
import User from "../models/User";

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.currentUser!.userId;

  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new CustomError("User not found", 404);
  }

  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new CustomError("Invalid current password", 401);
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

  await RefreshToken.deleteByUserId(userId);

  res.json({
    success: true,
    message:
      "Password changed successfully. All sessions have been logged out.",
  });
};
