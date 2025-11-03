import { currentUser, requireAuth, requireRole } from "@vestify/shared";
import express, { Router } from "express";
import { loginUser } from "../controllers/loginController";
import {
  getCurrentUser,
  updateUserProfile,
} from "../controllers/profileController";
import { registerUser } from "../controllers/registerController";
import {
  deleteUser,
  getAllUsers,
  getUserById,
} from "../controllers/userController";
import {
  validateLogin,
  validateRegister,
  validateUpdateProfile,
} from "../middleware/validator";

const router: Router = express.Router();

// Public routes
router.post("/register", validateRegister, registerUser);
router.post("/login", validateLogin, loginUser);

// Protected routes (require authentication)
router.get("/me", currentUser, requireAuth, getCurrentUser);
router.put(
  "/me",
  currentUser,
  requireAuth,
  validateUpdateProfile,
  updateUserProfile,
);

// User routes
router.get("/:id", currentUser, requireAuth, getUserById);

// Admin routes
router.get("/", currentUser, requireRole("admin", "moderator"), getAllUsers);
router.delete("/:id", currentUser, requireRole("admin"), deleteUser);

export default router;
