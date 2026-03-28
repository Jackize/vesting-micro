import { requireAuth, requireRole } from "@vestify/shared";
import express, { Router } from "express";
import { changePassword } from "../controllers/changePasswordController";
import {
  resendVerificationEmail,
  verifyEmail,
} from "../controllers/emailVerificationController";
import { loginUser } from "../controllers/loginController";
import { logoutUser } from "../controllers/logoutController";
import {
  forgotPassword,
  resetPassword,
  verifyTokenResetPassword,
} from "../controllers/passwordResetController";
import {
  getCurrentUser,
  updateUserProfile,
} from "../controllers/profileController";
import { refreshAccessToken } from "../controllers/refreshController";
import { registerUser } from "../controllers/registerController";
import {
  deleteUser,
  getAllUsers,
  getUserById,
} from "../controllers/userController";
import { updateUserRole } from "../controllers/updateUserRole";
import { currentUser } from "../middleware/auth";
import {
  validateChangePassword,
  validateForgotPassword,
  validateLogin,
  validateRefreshToken,
  validateRegister,
  validateResendVerification,
  validateResetPassword,
  validateTokenResetPassword,
  validateUpdateProfile,
} from "../middleware/validator";

const router: Router = express.Router();

// Public routes
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "User Service is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

router.post("/register", validateRegister, registerUser);
router.post("/login", validateLogin, loginUser);
router.post("/refresh", validateRefreshToken, refreshAccessToken);
router.get("/verify-email", verifyEmail);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.get(
  "/reset-password",
  validateTokenResetPassword,
  verifyTokenResetPassword,
);
router.post("/reset-password", validateResetPassword, resetPassword);

// Protected routes (require authentication)
router.post("/logout", currentUser, requireAuth, logoutUser);
router.post(
  "/resend-verification",
  validateResendVerification,
  resendVerificationEmail,
);
router.get("/me", currentUser, requireAuth, getCurrentUser);
router.put(
  "/me",
  currentUser,
  requireAuth,
  validateUpdateProfile,
  updateUserProfile,
);
router.put(
  "/change-password",
  currentUser,
  requireAuth,
  validateChangePassword,
  changePassword,
);

// Admin routes
router.get("/", currentUser, requireRole("admin", "moderator"), getAllUsers);
router.delete("/:id", currentUser, requireRole("admin"), deleteUser);
router.get("/:id", currentUser, requireAuth, getUserById);
router.put("/:id/role", currentUser, requireRole("admin"), updateUserRole);

export default router;
