import { NextFunction, Request, Response } from "express";
import Product from "../models/Product";

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const productData = {
    ...req.body,
    createdBy: req.currentUser?.userId,
    updatedBy: req.currentUser?.userId,
  };

  const product = await Product.create(productData);

  return res.status(201).json({
    success: true,
    data: {
      product,
    },
  });
};
