import { Channel, Message } from "amqplib";
interface Event {
  queueName: string;
  data: any;
}

export abstract class BaseConsumer<T extends Event> {
  abstract queueName: T["queueName"];
  private channel: Channel;
  abstract handle(event: T["data"]): Promise<void>;

  constructor(channel: Channel) {
    this.channel = channel;
  }

  async listen(): Promise<void> {
    // Assert queue exists before consuming
    await this.channel.assertQueue(this.queueName, {
      durable: true,
    });
    console.log(`✅ Queue '${this.queueName}' asserted`);

    // Keep listening indefinitely - don't resolve the promise
    return new Promise((resolve) => {
      this.channel.consume(
        this.queueName,
        async (msg: Message | null) => {
          if (!msg) {
            console.log(
              `⚠️ Received null message from queue ${this.queueName}`
            );
            return;
          }
          try {
            const event: T["data"] = JSON.parse(msg.content.toString());
            await this.handle(event);
            this.channel.ack(msg);
          } catch (error) {
            console.error(`❌ Error processing message:`, error);
            this.channel.nack(msg, false, true);
            console.log(`🔄 Message requeued`);
          }
        },
        {
          noAck: false,
        }
      );
    });
  }
}
