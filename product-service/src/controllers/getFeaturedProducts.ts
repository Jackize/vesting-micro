import { NextFunction, Request, Response } from "express";
import Product from "../models/Product";

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const limit = parseInt(req.query.limit as string) || 10;

  const products = await Product.find({
    featured: true,
    status: "active",
  })
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({
    success: true,
    data: {
      products,
    },
  });
};
