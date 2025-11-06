import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order";

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const filter: any = {};

  // Filter by status if provided
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Filter by payment status if provided
  if (req.query.paymentStatus) {
    filter.paymentStatus = req.query.paymentStatus;
  }

  // Filter by user ID if provided
  if (req.query.userId) {
    filter.userId = new mongoose.Types.ObjectId(req.query.userId as string);
  }

  // Filter by date range if provided
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) {
      filter.createdAt.$gte = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filter.createdAt.$lte = new Date(req.query.endDate as string);
    }
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "email firstName lastName"),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      orders: orders.map((order) => ({
        id: order.id,
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
