import { currentUser, requireAuth, requireRole } from "@vestify/shared";
import express, { Router } from "express";
import {
  cancelOrder,
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
} from "../controllers";
import {
  validateCreateOrder,
  validateUpdateOrderStatus,
} from "../middleware/validator";

const router: Router = express.Router();

// Create order route
router.post("/", currentUser, requireAuth, validateCreateOrder, createOrder);

// Get current user's orders
router.get("/", currentUser, requireAuth, getUserOrders);

// Get order by ID
router.get("/:id", currentUser, requireAuth, getOrderById);

// Cancel order
router.patch("/:id/cancel", currentUser, requireAuth, cancelOrder);

// Admin routes
router.get(
  "/admin/all",
  currentUser,
  requireRole("admin", "moderator"),
  getAllOrders,
);
router.patch(
  "/:id/status",
  currentUser,
  requireRole("admin", "moderator"),
  validateUpdateOrderStatus,
  updateOrderStatus,
);
router.delete("/:id", currentUser, requireRole("admin"), deleteOrder);

export default router;
