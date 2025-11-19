import { Job, Worker } from "bullmq";
import { redisConnection } from "../../config/redis";
import { OrderExpiredPublisher } from "../../events/publishers/order-expired-publisher";
import rabbitWrapper from "../../rabbitWrapper";

interface ExpirationJobData {
  orderId: string;
  userId: string;
  orderNumber: string;
}

/**
 * Worker that processes order expiration jobs
 */
export const expirationWorker = new Worker<ExpirationJobData>(
  "order-expiration",
  async (job: Job<ExpirationJobData>) => {
    const { orderId, userId, orderNumber } = job.data;

    console.log(`\n⏰ Processing order expiration for order: ${orderNumber}`);

    try {
      // Publish order.expired event to RabbitMQ
      const publisher = new OrderExpiredPublisher(rabbitWrapper.channel);

      const expiredAt = new Date();
      await publisher.publish({
        id: orderId,
        userId: userId,
        orderNumber: orderNumber,
        expiredAt: expiredAt.toISOString(),
      });

      console.log(
        `   ✅ Order expiration event published for order ${orderNumber}`,
      );
      console.log(`   📤 Event sent to RabbitMQ queue: order:expired`);

      return {
        success: true,
        orderId,
        orderNumber,
        expiredAt: expiredAt.toISOString(),
      };
    } catch (error) {
      console.error(
        `   ❌ Error processing expiration for order ${orderNumber}:`,
        error,
      );
      throw error; // Re-throw to trigger retry mechanism
    }
  },
  {
    connection: redisConnection,
    concurrency: 10, // Process up to 10 jobs concurrently
    limiter: {
      max: 100, // Max 100 jobs
      duration: 1000, // per second
    },
  },
);

// Worker event handlers
expirationWorker.on("completed", (job) => {
  console.log(`✅ Expiration job ${job.id} completed successfully`);
});

expirationWorker.on("failed", (job, err) => {
  console.error(`❌ Expiration job ${job?.id} failed:`, err);
  console.error(`   Order: ${job?.data.orderNumber}`);
  console.error(`   Error: ${err.message}`);
});

expirationWorker.on("error", (err) => {
  console.error("❌ Expiration worker error:", err);
});
