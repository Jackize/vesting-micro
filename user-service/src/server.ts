import app from "./app";
import database from "./config/database";
import { seedDefaultAdmin } from "./scripts/seedDefaultAdmin";

const startServer = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
    if (!process.env.MONGODB_DB_NAME)
      throw new Error("MONGODB_DB_NAME is not set");
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
    if (!process.env.JWT_EXPIRES_IN)
      throw new Error("JWT_EXPIRES_IN is not set");
    if (!process.env.PORT) throw new Error("PORT is not set");
    if (!process.env.NODE_ENV) throw new Error("NODE_ENV is not set");

    await database.connect();

    await seedDefaultAdmin();

    const server = app.listen(process.env.PORT, () => {
      console.log(
        `User Service running on port ${process.env.PORT} [${process.env.NODE_ENV}]`,
      );
    });

    const gracefulShutdown = async () => {
      server.close(async () => {
        try {
          await database.disconnect();
          process.exit(0);
        } catch (error) {
          console.error("Error during shutdown:", error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error(
          "Could not close connections in time, forcefully shutting down",
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown());
    process.on("SIGINT", () => gracefulShutdown());
    process.on("uncaughtException", (err: Error) => {
      console.error("Uncaught Exception:", err);
      gracefulShutdown();
    });
    process.on("unhandledRejection", (err: Error) => {
      console.error("Unhandled Rejection:", err);
      gracefulShutdown();
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
