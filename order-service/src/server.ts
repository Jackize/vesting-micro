import app from "./app";
import database from "./config/database";
import { OrderExpireListener } from "./events/listeners/order-expired-listener";
import { ProductCreatedListener } from "./events/listeners/product-created-listener";
import { ProductUpdatedListener } from "./events/listeners/product-updated-listener";
import rabbitWrapper from "./rabbitWrapper";

// Connect to database and start server
const startServer = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set");
    }
    if (!process.env.MONGODB_DB_NAME) {
      throw new Error("MONGODB_DB_NAME is not set");
    }
    if (!process.env.PORT) {
      throw new Error("PORT is not set");
    }
    if (!process.env.NODE_ENV) {
      throw new Error("NODE_ENV is not set");
    }
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set");
    }
    if (!process.env.JWT_EXPIRES_IN) {
      throw new Error("JWT_EXPIRES_IN is not set");
    }
    if (!process.env.CORS_ORIGIN) {
      throw new Error("CORS_ORIGIN is not set");
    }
    if (!process.env.RABBITMQ_URL) {
      throw new Error("RABBITMQ_URL is not set");
    }

    // Connect to MongoDB
    await database.connect();

    // Connect to RabbitMQ
    await rabbitWrapper.connect(process.env.RABBITMQ_URL);

    // Start server
    const server = app.listen(process.env.PORT, () => {
      console.log(`
        🚀 Order Service is running!
        📍 Port: ${process.env.PORT}
        🌍 Environment: ${process.env.NODE_ENV}
        🕐 Time: ${new Date().toISOString()}
      `);
    });

    // Listen for product created events
    await new ProductCreatedListener(rabbitWrapper.channel).listen(
      "order-svc.product.created",
    );

    // Listen for product updated events
    await new ProductUpdatedListener(rabbitWrapper.channel).listen(
      "order-svc.product.updated",
    );

    // Listen for order expired events
    await new OrderExpireListener(rabbitWrapper.channel).listen(
      "order-svc.order.expired",
    );

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n⚠️ ${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log("✅ HTTP server closed");

        try {
          // Close RabbitMQ connection
          if (rabbitWrapper.isConnected()) {
            await rabbitWrapper.disconnect();
            console.log("✅ RabbitMQ connection closed");
          }

          // Close database connection
          await database.disconnect();
          console.log("✅ Database connection closed");

          process.exit(0);
        } catch (error) {
          console.error("❌ Error during shutdown:", error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error(
          "❌ Could not close connections in time, forcefully shutting down",
        );
        process.exit(1);
      }, 10000);
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
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
