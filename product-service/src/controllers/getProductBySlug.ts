import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import Product from "../models/Product";

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
export const getProductBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const product = await Product.findBySlug(req.params.slug);

  if (!product) {
    throw new CustomError("Product not found", 404);
  }

  res.json({
    success: true,
    data: {
      product,
    },
  });
};
