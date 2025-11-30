import app from "./app";
import database from "./config/database";
import rabbitWrapper from "./config/rabbitmq";
import { redisClient, waitForRedis } from "./config/redis";
import { seedDefaultAdmin } from "./scripts/seedDefaultAdmin";

// Connect to database and start server
const startServer = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set");
    }
    if (!process.env.MONGODB_DB_NAME) {
      throw new Error("MONGODB_DB_NAME is not set");
    }
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set");
    }
    if (!process.env.JWT_EXPIRES_IN) {
      throw new Error("JWT_EXPIRES_IN is not set");
    }
    if (!process.env.PORT) {
      throw new Error("PORT is not set");
    }
    if (!process.env.NODE_ENV) {
      throw new Error("NODE_ENV is not set");
    }
    if (!process.env.RABBITMQ_URL) {
      throw new Error("RABBITMQ_URL is not set");
    }
    // Connect to MongoDB
    await database.connect();

    // Connect to Redis (optional, for token blacklist)
    await waitForRedis();

    // Connect to RabbitMQ
    await rabbitWrapper.connect();

    // Seed default admin user if no admin users exist
    await seedDefaultAdmin();

    // Start server
    const server = app.listen(process.env.PORT, () => {
      console.log(`
        🚀 User Service is running!
        📍 Port: ${process.env.PORT}
        🌍 Environment: ${process.env.NODE_ENV}
        🕐 Time: ${new Date().toISOString()}
      `);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async () => {
      server.close(async () => {
        console.log("✅ HTTP server closed");

        try {
          // Close database connection
          await database.disconnect();
          console.log("✅ Database connection closed");

          // Close Redis connection
          await redisClient.quit();
          console.log("✅ Redis connection closed");

          // Close RabbitMQ connection
          await rabbitWrapper.disconnect();
          console.log("✅ RabbitMQ connection closed");

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
    process.on("SIGTERM", () => gracefulShutdown());
    process.on("SIGINT", () => gracefulShutdown());

    // Handle uncaught exceptions
    process.on("uncaughtException", (err: Error) => {
      console.error("❌ Uncaught Exception:", err);
      gracefulShutdown();
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err: Error) => {
      console.error("❌ Unhandled Rejection:", err);
      gracefulShutdown();
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
