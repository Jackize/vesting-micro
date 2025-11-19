import dotenv from "dotenv";
import { waitForRedis } from "./config/redis";
import { OrderCreatedListener } from "./events/listeners/order-created-listener";
import { expirationWorker } from "./jobs";
import rabbitWrapper from "./rabbitWrapper";

// Load environment variables
dotenv.config();

// Connect to RabbitMQ and start server
const startServer = async (): Promise<void> => {
  try {
    // Validate required environment variables
    if (!process.env.RABBITMQ_URL) {
      throw new Error("RABBITMQ_URL is not set");
    }
    if (!process.env.REDIS_HOST) {
      throw new Error("REDIS_HOST is not set");
    }
    if (!process.env.REDIS_PORT) {
      throw new Error("REDIS_PORT is not set");
    }
    if (!process.env.NODE_ENV) {
      throw new Error("NODE_ENV is not set");
    }

    // Wait for Redis to be ready
    console.log("🔌 Waiting for Redis connection...");
    try {
      await waitForRedis();
    } catch (error) {
      console.error("❌ Failed to connect to Redis:", error);
      console.error("   Please ensure Redis is running and accessible");
      throw error;
    }

    // Connect to RabbitMQ
    await rabbitWrapper.connect(process.env.RABBITMQ_URL);
    console.log("✅ RabbitMQ connected");

    console.log(`
    🚀 Starting Jobs Service...
    🌍 Environment: ${process.env.NODE_ENV}
    🕐 Time: ${new Date().toISOString()}
    `);

    // Listen for order created events (for expiration jobs)
    console.log("👂 Setting up order created listener...");
    await new OrderCreatedListener(rabbitWrapper.channel).listen(
      "jobs-svc.order.created",
    );

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n⚠️ ${signal} received. Shutting down gracefully...`);

      try {
        // Close all workers
        console.log("🛑 Stopping workers...");
        await Promise.all([expirationWorker.close()]);
        console.log("✅ All workers closed");

        // Close RabbitMQ connection
        if (rabbitWrapper.isConnected()) {
          console.log("🛑 Closing RabbitMQ connection...");
          await rabbitWrapper.disconnect();
          console.log("✅ RabbitMQ connection closed");
        }

        process.exit(0);
      } catch (error) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (err: Error) => {
      console.error("❌ Uncaught Exception:", err);
      gracefulShutdown("uncaughtException");
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err: Error) => {
      console.error("❌ Unhandled Rejection:", err);
      gracefulShutdown("unhandledRejection");
    });
  } catch (error) {
    console.error("❌ Failed to start jobs service:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
