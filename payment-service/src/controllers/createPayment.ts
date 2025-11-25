import { CustomError, OrderStatus, PaymentStatus } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";
import { stripe } from "../config/stripe";
import { PaymentSuccessPublisher } from "../events/publishers/payment-success-publisher";
import Order from "../models/Order";
import Payment from "../models/Payment";
import rabbitWrapper from "../rabbitWrapper";

export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { token, orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new CustomError("Order not found", 404);
  }

  if (order.userId !== req.currentUser!.userId) {
    throw new CustomError("Unauthorized", 401);
  }

  if (order.status !== OrderStatus.PENDING) {
    throw new CustomError("Order is not pending", 400);
  }

  const charge = await stripe.charges.create({
    currency: "usd",
    amount: order.price * 100,
    source: token,
  });

  const payment = await Payment.create({
    orderId: order.id,
    paymentIntentId: charge.id,
    status: PaymentStatus.PAID,
  });

  await Order.updateOne({ _id: orderId }, { status: OrderStatus.CONFIRMED });

  await payment.save();

  await new PaymentSuccessPublisher(rabbitWrapper.channel).publish({
    id: payment.id,
    orderId: payment.orderId,
    paymentIntentId: payment.paymentIntentId,
  });

  res.status(201).send({
    id: payment.id,
  });
};
