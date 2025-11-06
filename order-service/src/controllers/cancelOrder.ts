import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order";

// @desc    Cancel order
// @route   PATCH /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (
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
    throw new CustomError("Not authorized to cancel this order", 403);
  }

  // Check if order can be cancelled
  if (order.status === "cancelled") {
    throw new CustomError("Order is already cancelled", 400);
  }

  if (order.status === "delivered") {
    throw new CustomError("Cannot cancel a delivered order", 400);
  }

  if (order.status === "shipped") {
    throw new CustomError(
      "Cannot cancel a shipped order. Please contact support for a return.",
      400,
    );
  }

  // Cancel the order
  order.status = "cancelled";

  // If payment was made, mark for refund
  if (order.paymentStatus === "paid") {
    order.paymentStatus = "refunded";
  }

  await order.save();

  res.json({
    success: true,
    message: "Order cancelled successfully",
    data: {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        updatedAt: order.updatedAt,
      },
    },
  });
};
