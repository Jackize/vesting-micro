import { Channel } from "amqplib";
interface Event {
  queueName: string;
  data: any;
}

export abstract class BasePublisher<T extends Event> {
  private channel: Channel;
  abstract queueName: T["queueName"];

  constructor(channel: Channel) {
    this.channel = channel;
  }

  async assertQueue(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.channel
        .assertQueue(this.queueName, {
          durable: true,
        })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          console.error(`❌ Error asserting queue ${this.queueName}:`, err);
          reject(err);
        });
    });
  }

  async publish(event: T["data"]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.assertQueue()
        .then(() => {
          const message = JSON.stringify(event);
          this.channel.sendToQueue(this.queueName, Buffer.from(message), {
            persistent: true,
          });
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
