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

  public async connect(): Promise<void> {
    try {
      const options: mongoose.ConnectOptions = {
        dbName: process.env.MONGODB_DB_NAME,
      };

      await mongoose.connect(process.env.MONGODB_URI!, options);

      console.log(`✅ MongoDB connected: ${process.env.MONGODB_DB_NAME}`);
      console.log(
        `📍 Connection URI: ${process.env.MONGODB_URI!.replace(/\/\/.*@/, "//***:***@")}`,
      );

      mongoose.connection.on("error", (err: Error) => {
        console.error("❌ MongoDB connection error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ MongoDB disconnected");
      });
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      process.exit(1);
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
