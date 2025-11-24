import {
  BaseListener,
  Exchanges,
  OrderCreatedEvent,
  OrderStatus,
  Subjects,
} from "@vestify/shared";
import Order from "../../models/Order";

export class OrderCreatedListener extends BaseListener<OrderCreatedEvent> {
  routingKey: Subjects.OrderCreated = Subjects.OrderCreated;
  exchangeName: Exchanges.Order = Exchanges.Order;

  async handle(event: OrderCreatedEvent["data"]): Promise<void> {
    try {
      const order = await Order.create({
        _id: event.id,
        userId: event.userId,
        currency: "usd",
        paymentMethod: "stripe",
        price: event.subtotal,
        status: OrderStatus.PENDING,
      });
      await order.save();
    } catch (error) {
      throw error;
    }
  }
}
