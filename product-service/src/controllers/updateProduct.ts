import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import Product from "../models/Product";

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new CustomError("Product not found", 404);
  }

  const updateData = {
    ...req.body,
    updatedBy: req.currentUser?.userId,
  };

  Object.assign(product, updateData);
  await product.save();

  res.json({
    success: true,
    data: {
      product,
    },
  });
};
