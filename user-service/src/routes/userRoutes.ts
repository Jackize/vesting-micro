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
  disableMfa,
  regenerateBackupCodes,
  setupMfa,
  verifyAndEnableMfa,
  verifyMfaToken,
} from "../controllers/mfaController";
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
import { getUserSessions } from "../controllers/sessionController";
import {
  deleteUser,
  getAllUsers,
  getUserById,
} from "../controllers/userController";
import { currentUser } from "../middleware/auth";
import { verifyCaptcha } from "../middleware/captcha";
import {
  validateChangePassword,
  validateForgotPassword,
  validateLogin,
  validateMfaDisable,
  validateMfaToken,
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

router.post("/register", validateRegister, verifyCaptcha, registerUser);
router.post("/login", validateLogin, verifyCaptcha, loginUser);
router.post("/refresh", validateRefreshToken, refreshAccessToken);
router.get("/verify-email", verifyEmail);
router.post(
  "/forgot-password",
  validateForgotPassword,
  verifyCaptcha,
  forgotPassword,
);
router.get(
  "/reset-password",
  validateTokenResetPassword,
  verifyTokenResetPassword,
);
router.post(
  "/reset-password",
  validateResetPassword,
  verifyCaptcha,
  resetPassword,
);

// Protected routes (require authentication)
router.post("/logout", currentUser, requireAuth, logoutUser);
router.post(
  "/resend-verification",
  validateResendVerification,
  resendVerificationEmail,
);
router.get("/sessions", currentUser, requireAuth, getUserSessions);
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

// MFA routes
router.post("/mfa/setup", currentUser, requireAuth, setupMfa);
router.post(
  "/mfa/verify-enable",
  currentUser,
  requireAuth,
  validateMfaToken,
  verifyAndEnableMfa,
);
router.post(
  "/mfa/disable",
  currentUser,
  requireAuth,
  validateMfaDisable,
  disableMfa,
);
router.post(
  "/mfa/regenerate-backup-codes",
  currentUser,
  requireAuth,
  validateMfaDisable,
  regenerateBackupCodes,
);
router.post("/mfa/verify", validateMfaToken, verifyMfaToken);

// User routes
router.get("/:id", currentUser, requireAuth, getUserById);

// Admin routes
router.get("/", currentUser, requireRole("admin", "moderator"), getAllUsers);
router.delete("/:id", currentUser, requireRole("admin"), deleteUser);

export default router;
