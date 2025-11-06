import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import Order from "../models/Order";

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new CustomError("Order not found", 404);
  }

  await Order.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Order deleted successfully",
  });
};
