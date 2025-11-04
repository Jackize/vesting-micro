import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import Product from "../models/Product";

// @desc    Update product stock
// @route   PATCH /api/products/:id/stock
// @access  Private/Admin
export const updateProductStock = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { variantIndex, quantity } = req.body as {
    variantIndex: number;
    quantity: number;
  };

  if (variantIndex !== undefined && variantIndex !== null) {
    // Update specific variant stock
    if (typeof variantIndex !== "number" || variantIndex < 0) {
      throw new CustomError("Invalid variant index", 400);
    }
    if (typeof quantity !== "number") {
      throw new CustomError("Quantity must be a number", 400);
    }

    const product = await Product.updateStock(
      req.params.id,
      variantIndex,
      quantity,
    );

    if (!product) {
      throw new CustomError("Product or variant not found", 404);
    }

    return res.json({
      success: true,
      data: {
        product,
      },
    });
  }

  // Update total stock
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new CustomError("Product not found", 404);
  }

  if (typeof req.body.stock !== "number" || req.body.stock < 0) {
    throw new CustomError("Stock must be a non-negative number", 400);
  }

  product.stock = req.body.stock;
  await product.save();

  return res.json({
    success: true,
    data: {
      product,
    },
  });
};
