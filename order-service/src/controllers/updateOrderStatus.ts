import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import Order from "../models/Order";

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new CustomError("Order not found", 404);
  }

  // Update status
  order.status = status as any;

  // If status is delivered, mark payment as paid if it was pending
  if (status === "delivered" && order.paymentStatus === "pending") {
    order.paymentStatus = "paid";
  }

  // If status is cancelled, mark payment as refunded if it was paid
  if (status === "cancelled" && order.paymentStatus === "paid") {
    order.paymentStatus = "refunded";
  }

  await order.save();

  res.json({
    success: true,
    message: "Order status updated successfully",
    data: {
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        updatedAt: order.updatedAt,
      },
    },
  });
};
