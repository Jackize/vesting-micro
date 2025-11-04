import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import Product from "../models/Product";

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const product = await Product.findById(req.params.id);

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
