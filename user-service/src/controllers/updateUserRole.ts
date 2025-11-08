import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import User from "../models/User";

// @desc    Update user role
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { role } = req.body;
  const userId = req.params.id;

  // Validate role
  if (!role || !["user", "admin", "moderator"].includes(role)) {
    throw new CustomError(
      "Invalid role. Role must be 'user', 'admin', or 'moderator'",
      400,
    );
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError("User not found", 404);
  }

  // Prevent admin from removing their own admin role
  if (
    req.currentUser?.userId === userId &&
    user.role === "admin" &&
    role !== "admin"
  ) {
    throw new CustomError("You cannot remove your own admin role", 403);
  }

  // Update role
  user.role = role as "user" | "admin" | "moderator";
  await user.save();

  res.json({
    success: true,
    message: "User role updated successfully",
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.getFullName(),
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt,
      },
    },
  });
};
