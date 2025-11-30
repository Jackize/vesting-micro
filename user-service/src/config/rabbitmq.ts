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
   */
  async connect(): Promise<void> {
    if (this._connection) return;

    const maxRetries = 5;
    for (let i = 1; i <= maxRetries; i++) {
      try {
        this._connection = await amqp.connect(process.env.RABBITMQ_URL!);
        this._channel = await this._connection.createChannel();
        console.log("RBMQ connected");
        this.setupHandlers();
        return;
      } catch (error) {
        if (i === maxRetries) {
          console.log("Failed to connect RBMQ after 5 tries: ", error);
          throw error;
        }
        await this.sleep(1000 * 5);
      }
    }
  }

  private setupHandlers() {
    if (!this._connection || !this._channel) return;

    this._connection.on("error", () => {
      this._connection = null;
      this._channel = null;
    });

    this._connection.on("close", () => {
      this._connection = null;
      this._channel = null;
    });

    this._channel.on("error", () => {
      this._channel = null;
    });

    this._channel.on("close", () => {
      this._channel = null;
    });
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
      }

      if (this._connection) {
        await this._connection.close();
        this._connection = null;
      }
    } catch (error) {
      console.error("❌ Error closing RabbitMQ connection:", error);
      throw error;
    }
  }
}

// Export singleton instance
export default RabbitWrapper.getInstance();
