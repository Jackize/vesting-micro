import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order";

// @desc    Get current user's orders
// @route   GET /api/orders
// @access  Private
export const getUserOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.currentUser?.userId;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const filter: any = { userId: new mongoose.Types.ObjectId(userId) };

  // Filter by status if provided
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Filter by payment status if provided
  if (req.query.paymentStatus) {
    filter.paymentStatus = req.query.paymentStatus;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      orders: orders.map((order) => ({
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
        isExpired: order.isExpired(),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
};
