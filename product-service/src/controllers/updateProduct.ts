import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import { ProductUpdatedPublisher } from "../events/publishers/product-updated-publisher";
import Product from "../models/Product";
import rabbitWrapper from "../rabbitWrapper";

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

  // Publish product updated event
  await new ProductUpdatedPublisher(rabbitWrapper.channel).publish({
    id: product.id,
    name: req.body.name !== undefined ? product.name : undefined,
    slug: req.body.slug !== undefined ? product.slug : undefined,
    sku: req.body.sku !== undefined ? product.sku : undefined,
    status: req.body.status !== undefined ? product.status : undefined,
    basePrice: req.body.basePrice !== undefined ? product.basePrice : undefined,
    stock:
      req.body.stock !== undefined || req.body.variants !== undefined
        ? product.stock
        : undefined,
    variants:
      req.body.variants !== undefined
        ? product.variants.map((v) => ({
            name: v.name,
            value: v.value,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            image: v.image,
          }))
        : undefined,
    updatedAt: product.updatedAt,
  });

  res.json({
    success: true,
    data: {
      product,
    },
  });
};
