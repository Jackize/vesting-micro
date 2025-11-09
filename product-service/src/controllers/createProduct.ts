import { NextFunction, Request, Response } from "express";
import { ProductCreatedPublisher } from "../events/publishers/product-created-publisher";
import Product from "../models/Product";
import rabbitWrapper from "../rabbitWrapper";

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

  // Publish product created event
  await new ProductCreatedPublisher(rabbitWrapper.channel).publish({
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    status: product.status,
    basePrice: product.basePrice,
    stock: product.stock,
    variants: product.variants.map((v) => ({
      name: v.name,
      value: v.value,
      sku: v.sku,
      price: v.price,
      stock: v.stock,
      image: v.image,
    })),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  });

  return res.status(201).json({
    success: true,
    data: {
      product,
    },
  });
};
