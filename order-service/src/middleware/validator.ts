import { validationRequest } from "@vestify/shared";
import { body } from "express-validator";

// Create order validation rules
export const validateCreateOrder = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must have at least one item"),
  body("items.*.productId")
    .notEmpty()
    .withMessage("Product ID is required for each item"),
  body("items.*.productName")
    .notEmpty()
    .trim()
    .withMessage("Product name is required for each item"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1 for each item"),
  body("items.*.price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number for each item"),
  body("shippingAddress.fullName")
    .notEmpty()
    .trim()
    .withMessage("Full name is required"),
  body("shippingAddress.phone")
    .notEmpty()
    .trim()
    .withMessage("Phone number is required"),
  body("shippingAddress.address")
    .notEmpty()
    .trim()
    .withMessage("Address is required"),
  body("shippingAddress.city")
    .notEmpty()
    .trim()
    .withMessage("City is required"),
  body("shippingAddress.postalCode")
    .notEmpty()
    .trim()
    .withMessage("Postal code is required"),
  body("shippingAddress.country")
    .notEmpty()
    .trim()
    .withMessage("Country is required"),
  body("shippingCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping cost must be a non-negative number"),
  body("tax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax must be a non-negative number"),
  body("discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount must be a non-negative number"),
  body("notes").optional().trim(),
  validationRequest,
];

// Update order status validation rules
export const validateUpdateOrderStatus = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "expired",
    ])
    .withMessage("Invalid status"),
  validationRequest,
];
