import { currentUser, requireRole } from "@vestify/shared";
import express, { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getCategories,
  getFeaturedProducts,
  getProductById,
  getProductBySlug,
  getProductsByCategory,
  searchProducts,
  updateProduct,
  updateProductStock,
} from "../controllers";
import {
  validateCreateProduct,
  validateSearchQuery,
  validateUpdateProduct,
  validateUpdateStock,
} from "../middleware/validator";

const router: Router = express.Router();

// Public routes
// IMPORTANT: Specific routes must come BEFORE parameterized routes (/:id)
// to avoid route conflicts. Order matters in Express!

// Health check endpoint (must come first to avoid being caught by /:id)
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Product Service is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

router.get("/", getAllProducts);
router.get("/categories", getCategories);
router.get("/featured", getFeaturedProducts);
router.get("/search", validateSearchQuery, searchProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/slug/:slug", getProductBySlug);
router.get("/:id", getProductById);

// Protected routes (Admin only)
router.post(
  "/",
  currentUser,
  requireRole("admin"),
  validateCreateProduct,
  createProduct,
);
router.put(
  "/:id",
  currentUser,
  requireRole("admin"),
  validateUpdateProduct,
  updateProduct,
);
router.delete("/:id", currentUser, requireRole("admin"), deleteProduct);
router.patch(
  "/:id/stock",
  currentUser,
  requireRole("admin"),
  validateUpdateStock,
  updateProductStock,
);

export default router;
