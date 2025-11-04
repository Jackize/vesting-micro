import { NextFunction, Request, Response } from "express";
import Product from "../models/Product";

// @desc    Get all products (with pagination, filtering, and sorting)
// @route   GET /api/products
// @access  Public
export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const skip = (page - 1) * limit;

  // Build filter
  const filter: any = {};

  if (req.query.status) {
    filter.status = req.query.status;
  } else {
    filter.status = "active"; // Default to active products
  }

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.featured === "true") {
    filter.featured = true;
  }

  if (req.query.search) {
    filter.$text = { $search: req.query.search as string };
  }

  if (req.query.tags) {
    const tags = Array.isArray(req.query.tags)
      ? req.query.tags
      : [req.query.tags];
    filter.tags = { $in: tags };
  }

  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    filter.basePrice = {};
    if (req.query.minPrice) {
      filter.basePrice.$gte = parseFloat(req.query.minPrice as string);
    }
    if (req.query.maxPrice) {
      filter.basePrice.$lte = parseFloat(req.query.maxPrice as string);
    }
  }

  // Sort options
  let sort: any = { createdAt: -1 }; // Default sort by newest
  if (req.query.sort) {
    const sortOption = req.query.sort as string;
    switch (sortOption) {
      case "price_asc":
        sort = { basePrice: 1 };
        break;
      case "price_desc":
        sort = { basePrice: -1 };
        break;
      case "name_asc":
        sort = { name: 1 };
        break;
      case "name_desc":
        sort = { name: -1 };
        break;
      case "rating":
        sort = { rating: -1 };
        break;
      case "newest":
        sort = { createdAt: -1 };
        break;
      case "oldest":
        sort = { createdAt: 1 };
        break;
    }
  }

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit),
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
    },
  });
};
