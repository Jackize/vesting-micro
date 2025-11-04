import app from "./app";
import database from "./config/database";
import { seedProductsIfEmpty } from "./scripts/autoSeed";

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
    // Connect to MongoDB
    await database.connect();

    // Auto-seed products in development mode if database is empty
    console.log("Seeding products...");
    if (process.env.NODE_ENV === "development") {
      await seedProductsIfEmpty();
    }

    // Start server
    const server = app.listen(process.env.PORT, () => {
      console.log(`
        🚀 Product Service is running!
        📍 Port: ${process.env.PORT}
        🌍 Environment: ${process.env.NODE_ENV}
        🕐 Time: ${new Date().toISOString()}
      `);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n⚠️ ${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log("✅ HTTP server closed");

        try {
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
