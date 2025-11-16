import { Channel, Message } from "amqplib";
interface Event {
  routingKey: string;
  exchangeName: string;
  data: any;
}

export abstract class BaseListener<T extends Event> {
  abstract routingKey: T["routingKey"];
  abstract exchangeName: T["exchangeName"];

  private channel: Channel;
  abstract handle(event: T["data"]): Promise<void>;

  constructor(channel: Channel) {
    this.channel = channel;
  }

  async listen(queueName: string): Promise<void> {
    // Assert exchange
    await this.channel.assertExchange(this.exchangeName, "topic", {
      durable: true,
    });
    // Limit in-flight
    await this.channel.prefetch(1);

    // Assert queue (unique per service)
    await this.channel.assertQueue(queueName, {
      durable: true,
      exclusive: false,
      autoDelete: false,
    });

    // Bind queue to exchange with routing key
    await this.channel.bindQueue(queueName, this.exchangeName, this.routingKey);

    console.log(
      `👂 Listening for messages on queue ${queueName} to '${this.routingKey}'...`
    );

    // Start consuming messages - this runs indefinitely
    this.channel.consume(
      queueName,
      async (msg: Message | null) => {
        if (!msg) {
          console.log(`⚠️ Received null message from queue ${this.routingKey}`);
          return;
        }
        try {
          const event: T["data"] = JSON.parse(msg.content.toString());
          await this.handle(event);
          this.channel.ack(msg);
        } catch (error) {
          this.channel.nack(msg, false, true);
          console.log(
            `🔄 Message requeued queue: ${queueName}, routing key: ${this.routingKey}, error: ${error}`
          );
        }
      },
      {
        noAck: false,
      }
    );
  }
}
