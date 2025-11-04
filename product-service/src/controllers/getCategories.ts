import { NextFunction, Request, Response } from "express";
import Product from "../models/Product";

// @desc    Get all unique categories
// @route   GET /api/products/categories
// @access  Public
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get all distinct categories from active products
    const categories = await Product.distinct("category", {
      status: "active",
    });

    // Sort categories alphabetically
    const sortedCategories = categories.sort();

    res.json({
      success: true,
      data: {
        categories: sortedCategories,
      },
    });
  } catch (error) {
    next(error);
  }
};
