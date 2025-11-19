import {
  BaseListener,
  Exchanges,
  OrderCreatedEvent,
  Subjects,
} from "@vestify/shared";
import { expirationQueue } from "../../queues/expiration-queue";

export class OrderCreatedListener extends BaseListener<OrderCreatedEvent> {
  routingKey: Subjects.OrderCreated = Subjects.OrderCreated;
  exchangeName: Exchanges.Order = Exchanges.Order;

  async handle(data: OrderCreatedEvent["data"]): Promise<void> {
    console.log(
      `📦 Processing order expiration scheduling for order: ${data.orderNumber}`,
    );

    // Calculate expiration time from expiresAt field
    const expirationTime: Date = new Date(data.expiresAt);
    const delay = expirationTime.getTime() - Date.now();

    // Don't schedule if the expiration time has already passed
    if (delay <= 0) {
      console.warn(
        `   ⚠️ Order ${data.orderNumber} has already expired, processing immediately`,
      );
      return;
    }

    // Schedule the expiration job using BullMQ
    await expirationQueue.add(
      "order-expiration",
      {
        orderId: data.id,
        userId: data.userId,
        orderNumber: data.orderNumber,
      },
      {
        delay, // Delay in milliseconds
        jobId: `order-expiration-${data.id}`, // Unique job ID per order
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600,
        },
      },
    );

    console.log(`   ✅ Expiration job scheduled for order ${data.orderNumber}`);
  }
}
