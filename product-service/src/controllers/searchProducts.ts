import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import Product from "../models/Product";

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
export const searchProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const query = req.query.q as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const skip = (page - 1) * limit;

  if (!query || query.trim().length === 0) {
    throw new CustomError("Search query is required", 400);
  }

  const filter: any = {
    $text: { $search: query },
    status: "active",
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      query,
    },
  });
};
