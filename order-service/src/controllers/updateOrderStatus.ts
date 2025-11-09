import { CustomError, OrderStatus, PaymentStatus } from "@vestify/shared";
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
  if (
    status === OrderStatus.DELIVERED &&
    order.paymentStatus === PaymentStatus.PENDING
  ) {
    order.paymentStatus = PaymentStatus.PAID;
  }

  // If status is cancelled, mark payment as refunded if it was paid
  if (
    status === OrderStatus.CANCELLED &&
    order.paymentStatus === PaymentStatus.PAID
  ) {
    order.paymentStatus = PaymentStatus.REFUNDED;
  }

  await order.save();

  res.json({
    success: true,
    message: "Order status updated successfully",
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
