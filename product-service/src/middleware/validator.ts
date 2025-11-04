import { validationRequest } from "@vestify/shared";
import { body, query } from "express-validator";

// Create product validation rules
export const validateCreateProduct = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Product name must be between 1 and 200 characters"),
  body("slug")
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage(
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  body("description")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Description is required"),
  body("shortDescription")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Short description cannot exceed 500 characters"),
  body("sku").trim().isLength({ min: 1 }).withMessage("SKU is required"),
  body("category")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Category is required"),
  body("images")
    .isArray({ min: 1 })
    .withMessage("At least one image is required"),
  body("images.*").isURL().withMessage("Each image must be a valid URL"),
  body("videoUrl")
    .optional()
    .isURL()
    .withMessage("Video URL must be a valid URL"),
  body("basePrice")
    .isFloat({ min: 0 })
    .withMessage("Base price must be a non-negative number"),
  body("compareAtPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Compare at price must be a non-negative number"),
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("status")
    .optional()
    .isIn(["draft", "active", "archived", "out_of_stock"])
    .withMessage("Invalid status"),
  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be a boolean"),
  body("variants")
    .optional()
    .isArray()
    .withMessage("Variants must be an array"),
  body("variants.*.name")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Variant name is required"),
  body("variants.*.value")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Variant value is required"),
  body("variants.*.stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Variant stock must be a non-negative integer"),
  body("variants.*.price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Variant price must be a non-negative number"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Each tag must be a non-empty string"),
  validationRequest,
];

// Update product validation rules
export const validateUpdateProduct = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Product name must be between 1 and 200 characters"),
  body("slug")
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage(
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Description cannot be empty"),
  body("shortDescription")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Short description cannot exceed 500 characters"),
  body("sku")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("SKU cannot be empty"),
  body("category")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Category cannot be empty"),
  body("images")
    .optional()
    .isArray({ min: 1 })
    .withMessage("At least one image is required"),
  body("images.*")
    .optional()
    .isURL()
    .withMessage("Each image must be a valid URL"),
  body("videoUrl")
    .optional()
    .isURL()
    .withMessage("Video URL must be a valid URL"),
  body("basePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Base price must be a non-negative number"),
  body("compareAtPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Compare at price must be a non-negative number"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("status")
    .optional()
    .isIn(["draft", "active", "archived", "out_of_stock"])
    .withMessage("Invalid status"),
  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be a boolean"),
  body("variants")
    .optional()
    .isArray()
    .withMessage("Variants must be an array"),
  validationRequest,
];

// Update stock validation rules
export const validateUpdateStock = [
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("variantIndex")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Variant index must be a non-negative integer"),
  body("quantity")
    .optional()
    .isInt()
    .withMessage("Quantity must be an integer"),
  body().custom((value) => {
    if (value.variantIndex !== undefined && value.quantity === undefined) {
      throw new Error("Quantity is required when updating variant stock");
    }
    if (value.quantity !== undefined && value.variantIndex === undefined) {
      throw new Error("Variant index is required when updating variant stock");
    }
    if (value.stock === undefined && value.variantIndex === undefined) {
      throw new Error(
        "Either stock or variantIndex with quantity must be provided",
      );
    }
    return true;
  }),
  validationRequest,
];

// Search query validation
export const validateSearchQuery = [
  query("q")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Search query is required"),
  validationRequest,
];
