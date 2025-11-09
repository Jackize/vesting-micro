import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { OrderCreatedPublisher } from "../events/publishers/order-created-publisher";
import Order from "../models/Order";
import Product from "../models/Product";
import rabbitWrapper from "../rabbitWrapper";

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.currentUser?.userId as string;

  const { items, shippingAddress, shippingCost, tax, discount, notes } =
    req.body;

  // Validate products and stock availability
  const validationErrors: string[] = [];
  const productIds = items.map((item: any) => item.productId);

  // Fetch all products in parallel
  const products = await Product.find({ productId: { $in: productIds } });

  // Create a map for quick lookup
  const productMap = new Map(products.map((p) => [p.productId, p]));

  // Validate each item
  for (const item of items) {
    const product = productMap.get(item.productId);

    // Check if product exists
    if (!product) {
      validationErrors.push(
        `Product "${item.productName}" (ID: ${item.productId}) not found`,
      );
      continue;
    }

    // Check product status
    if (product.status !== "active") {
      validationErrors.push(
        `Product "${item.productName}" is not available (status: ${product.status})`,
      );
      continue;
    }

    // Check stock availability
    if (item.variantId) {
      // Validate variant-based product
      const variantIndex = parseInt(item.variantId, 10);
      if (
        isNaN(variantIndex) ||
        variantIndex < 0 ||
        variantIndex >= product.variants.length
      ) {
        validationErrors.push(
          `Invalid variant for product "${item.productName}"`,
        );
        continue;
      }

      const variant = product.variants[variantIndex];
      if (variant.stock < item.quantity) {
        validationErrors.push(
          `Insufficient stock for "${item.productName}" - ${item.variantName}. Available: ${variant.stock}, Requested: ${item.quantity}`,
        );
        continue;
      }
    } else {
      // Validate product without variant
      if (product.variants && product.variants.length > 0) {
        validationErrors.push(
          `Product "${item.productName}" has variants but no variant was specified`,
        );
        continue;
      }

      if (product.stock < item.quantity) {
        validationErrors.push(
          `Insufficient stock for "${item.productName}". Available: ${product.stock}, Requested: ${item.quantity}`,
        );
        continue;
      }
    }
  }

  // If validation errors exist, return error
  if (validationErrors.length > 0) {
    throw new CustomError(
      `Order validation failed: ${validationErrors.join("; ")}`,
      400,
    );
  }

  // Calculate subtotal
  const subtotal = items.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0,
  );

  // Create order
  const order = await Order.create({
    userId: new mongoose.Types.ObjectId(userId),
    items,
    shippingAddress,
    subtotal,
    shippingCost: shippingCost || 0,
    tax: tax || 0,
    discount: discount || 0,
    notes,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
  });

  await new OrderCreatedPublisher(rabbitWrapper.channel).publish({
    id: order.id,
    userId: order.userId.toString(),
    orderNumber: order.orderNumber,
    items: order.items,
    shippingAddress: order.shippingAddress,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    tax: order.tax,
    discount: order.discount,
  });

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        items: order.items,
        shippingAddress: order.shippingAddress,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        discount: order.discount,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        expiresAt: order.expiresAt,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    },
  });
};
