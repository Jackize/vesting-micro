import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import User from "../models/User";

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = await User.findById(req.currentUser!.userId);

  if (!user) {
    throw new CustomError("User not found", 404);
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.getFullName(),
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  });
};

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
export const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { firstName, lastName, phone, avatar } = req.body;

  const user = await User.findById(req.currentUser!.userId);

  if (!user) {
    throw new CustomError("User not found", 404);
  }

  // Update fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone) user.phone = phone;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.getFullName(),
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        updatedAt: user.updatedAt,
      },
    },
  });
};
