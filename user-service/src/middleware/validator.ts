import { validationRequest } from "@vestify/shared";
import { body, query } from "express-validator";

// Register validation rules
export const validateRegister = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    )
    .optional(),
  body("firstName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),
  body("phone")
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage("Please provide a valid phone number"),
  body("captchaToken")
    .optional()
    .isString()
    .withMessage("CAPTCHA token must be a string"),
  validationRequest,
];

// Login validation rules
export const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  body("captchaToken")
    .optional()
    .isString()
    .withMessage("CAPTCHA token must be a string"),
  body("mfaToken")
    .optional()
    .isString()
    .withMessage("MFA token must be a string"),
  validationRequest,
];

// Update profile validation rules
export const validateUpdateProfile = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),
  body("phone")
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage("Please provide a valid phone number"),
  body("avatar").optional().isURL().withMessage("Avatar must be a valid URL"),
  validationRequest,
];

// Refresh token validation rules
export const validateRefreshToken = [
  body("refreshToken")
    .notEmpty()
    .withMessage("Refresh token is required")
    .isString()
    .withMessage("Refresh token must be a string"),
  validationRequest,
];

// Change password validation rules
export const validateChangePassword = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number",
    )
    .optional(),
  validationRequest,
];

// Forgot password validation rules
export const validateForgotPassword = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  validationRequest,
];

// Resend verification email validation rules
export const validateResendVerification = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  validationRequest,
];

// Verify token reset password validation rules
export const validateTokenResetPassword = [
  query("token").notEmpty().withMessage("Reset token is required"),
  validationRequest,
];

// Reset password validation rules
export const validateResetPassword = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number",
    )
    .optional(),
  validationRequest,
];

// MFA validation rules
export const validateMfaToken = [
  body("token")
    .notEmpty()
    .withMessage("MFA token is required")
    .isString()
    .withMessage("MFA token must be a string"),
  validationRequest,
];

export const validateMfaDisable = [
  body("password").notEmpty().withMessage("Password is required"),
  validationRequest,
];
