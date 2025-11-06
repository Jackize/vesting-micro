import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order";

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

  // Calculate subtotal
  const subtotal = items.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0,
  );

  // Create order
  const order = await Order.create({
    userId: new mongoose.Types.ObjectId(userId),
    orderNumber: `ORD-${Date.now()}`,
    items,
    shippingAddress,
    subtotal,
    shippingCost: shippingCost || 0,
    tax: tax || 0,
    discount: discount || 0,
    total: subtotal + (shippingCost || 0) + (tax || 0) - (discount || 0),
    notes,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
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
