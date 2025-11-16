import { Channel } from "amqplib";
interface Event {
  routingKey: string;
  exchangeName: string;
  data: any;
}

export abstract class BasePublisher<T extends Event> {
  private channel: Channel;
  abstract exchangeName: T["exchangeName"];
  abstract routingKey: T["routingKey"];

  constructor(channel: Channel) {
    this.channel = channel;
  }

  async publish(event: T["data"]): Promise<void> {
    try {
      await this.channel.assertExchange(this.exchangeName, "topic", {
        durable: true,
      });
      const message = JSON.stringify(event);
      this.channel.publish(
        this.exchangeName,
        this.routingKey,
        Buffer.from(message),
        {
          persistent: true,
        }
      );
    } catch (error) {
      throw error;
    }
  }
}
