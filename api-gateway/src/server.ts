import app from "./app";
import { closeRedis, initRedis, waitForRedis } from "./config/redis";

// Connect to Redis and start server
const startServer = async (): Promise<void> => {
  try {
    // Validate required environment variables
    if (!process.env.PORT) {
      throw new Error("PORT is not set");
    }
    if (!process.env.NODE_ENV) {
      throw new Error("NODE_ENV is not set");
    }

    // Initialize Redis connection (non-blocking)
    // Server will start even if Redis is unavailable
    try {
      initRedis();
      // Don't wait for Redis - let it connect in background
      // Rate limiting will work once Redis is available
      waitForRedis().catch((error) => {
        console.warn(
          "⚠️ Redis connection failed, rate limiting may not work:",
          error,
        );
      });
    } catch (error) {
      console.warn(
        "⚠️ Redis initialization failed, rate limiting may not work:",
        error,
      );
    }

    // Start server - listen on all interfaces (0.0.0.0) for Docker/Kubernetes
    const port = parseInt(process.env.PORT || "3000", 10);
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`
        🚀 API Gateway is running!
        📍 Port: ${port}
        🌍 Environment: ${process.env.NODE_ENV}
        🕐 Time: ${new Date().toISOString()}
      `);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async () => {
      server.close(async () => {
        console.log("✅ HTTP server closed");

        try {
          // Close Redis connection
          await closeRedis();
          console.log("✅ Redis connection closed");

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
