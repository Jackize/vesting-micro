import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import Product from "../models/Product";

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new CustomError("Product not found", 404);
  }

  await Product.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Product deleted successfully",
  });
};
