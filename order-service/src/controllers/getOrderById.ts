import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order";

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.currentUser?.userId;
  const userRole = req.currentUser?.role;

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new CustomError("Order not found", 404);
  }

  // Check if user owns the order or is admin/moderator
  const orderUserId = (order.userId as mongoose.Types.ObjectId).toString();
  if (
    orderUserId !== userId &&
    userRole !== "admin" &&
    userRole !== "moderator"
  ) {
    throw new CustomError("Not authorized to access this order", 403);
  }

  res.json({
    success: true,
    data: {
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        items: order.items,
        shippingAddress: order.shippingAddress,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        discount: order.discount,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        paymentIntentId: order.paymentIntentId,
        expiresAt: order.expiresAt,
        isExpired: order.isExpired(),
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    },
  });
};
