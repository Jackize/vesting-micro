import {
  BaseListener,
  Exchanges,
  OrderExpiredEvent,
  OrderStatus,
  PaymentStatus,
  Subjects,
} from "@vestify/shared";
import Order from "../../models/Order";

export class OrderExpireListener extends BaseListener<OrderExpiredEvent> {
  routingKey: Subjects.OrderExpired = Subjects.OrderExpired;
  exchangeName: Exchanges.Order = Exchanges.Order;

  async handle(event: OrderExpiredEvent["data"]): Promise<void> {
    try {
      const order = await Order.findById(event.id);
      if (!order) {
        console.log(`Order not found ${event.orderNumber}`);
        return;
      }

      if (order.status === OrderStatus.CONFIRMED) {
        return;
      }

      order.status = OrderStatus.EXPIRED;
      order.paymentStatus = PaymentStatus.FAILED;

      await order.save();
      console.log("Order updated status Expire");
    } catch (error) {
      throw error;
    }
  }
}
