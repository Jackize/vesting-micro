import amqp, { Channel, ChannelModel } from "amqplib";

class RabbitWrapper {
  private _connection: ChannelModel | null = null;
  private _channel: Channel | null = null;
  private static instance: RabbitWrapper;

  /**
   * Get singleton instance of RabbitWrapper
   */
  public static getInstance(): RabbitWrapper {
    if (!RabbitWrapper.instance) {
      RabbitWrapper.instance = new RabbitWrapper();
    }
    return RabbitWrapper.instance;
  }

  /**
   * Connect to RabbitMQ server
   * @param url RabbitMQ connection URL
   */
  async connect(url: string): Promise<void> {
    try {
      if (this._connection) {
        console.log("✅ RabbitMQ connection already exists");
        return;
      }

      console.log("🔌 Connecting to RabbitMQ...");
      this._connection = await amqp.connect(url);
      console.log("✅ Connected to RabbitMQ");

      // Setup connection error handler
      this._connection.on("error", (err: Error) => {
        console.error("❌ RabbitMQ connection error:", err);
        this._connection = null;
        this._channel = null;
      });

      // Setup connection close handler
      this._connection.on("close", () => {
        console.warn("⚠️ RabbitMQ connection closed");
        this._connection = null;
        this._channel = null;
      });

      // Create channel
      this._channel = await this._connection.createChannel();
      console.log("✅ RabbitMQ channel created");

      // Setup channel error handler
      this._channel.on("error", (err: Error) => {
        console.error("❌ RabbitMQ channel error:", err);
      });

      // Setup channel close handler
      this._channel.on("close", () => {
        console.warn("⚠️ RabbitMQ channel closed");
        this._channel = null;
      });
    } catch (error) {
      console.error("❌ Failed to connect to RabbitMQ:", error);
      this._connection = null;
      this._channel = null;
      throw error;
    }
  }

  /**
   * Get the RabbitMQ channel
   * @throws Error if not connected
   */
  get channel(): Channel {
    if (!this._channel) {
      throw new Error("RabbitMQ channel not available. Call connect() first.");
    }
    return this._channel;
  }

  /**
   * Get the RabbitMQ connection
   * @throws Error if not connected
   */
  get connection(): ChannelModel {
    if (!this._connection) {
      throw new Error(
        "RabbitMQ connection not available. Call connect() first.",
      );
    }
    return this._connection;
  }

  /**
   * Check if connected to RabbitMQ
   */
  isConnected(): boolean {
    return this._connection !== null && this._channel !== null;
  }

  /**
   * Close RabbitMQ connection and channel
   */
  async disconnect(): Promise<void> {
    try {
      if (this._channel) {
        await this._channel.close();
        this._channel = null;
        console.log("✅ RabbitMQ channel closed");
      }

      if (this._connection) {
        await this._connection.close();
        this._connection = null;
        console.log("✅ RabbitMQ connection closed");
      }
    } catch (error) {
      console.error("❌ Error closing RabbitMQ connection:", error);
      throw error;
    }
  }
}

// Export singleton instance
export default RabbitWrapper.getInstance();
