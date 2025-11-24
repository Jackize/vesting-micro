import mongoose from "mongoose";

class Database {
  private static instance: Database;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private retryCount = 0;
  private readonly maxRetries = 5;
  private isConnecting = false;

  public async connect(): Promise<void> {
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
      this.handleReconnection();
    });

    mongoose.connection.on("error", (err: Error) => {
      console.error("❌ MongoDB connection error:", err);
    });

    await this.connectWithRetry();
  }

  private async handleReconnection(): Promise<void> {
    if (!this.isConnecting) {
      this.retryCount = 0;
      await this.connectWithRetry();
    }
  }

  private async connectWithRetry(): Promise<void> {
    this.isConnecting = true;

    while (this.retryCount < this.maxRetries) {
      try {
        const options: mongoose.ConnectOptions = {
          dbName: process.env.MONGODB_DB_NAME,
        };

        await mongoose.connect(process.env.MONGODB_URI!, options);

        console.log(`✅ MongoDB connected: ${process.env.MONGODB_DB_NAME}`);

        this.retryCount = 0;
        this.isConnecting = false;
        return;
      } catch (error) {
        this.retryCount++;

        if (this.retryCount >= this.maxRetries) {
          console.error("❌ Max retries reached. Exiting server...");
          process.exit(1);
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    } catch (error) {
      console.error("Error closing MongoDB connection:", error);
    }
  }
}

export default Database.getInstance();
