import { Channel } from "amqplib";
interface Event {
  queueName: string;
  data: any;
}

export abstract class BaseProducer<T extends Event> {
  private channel: Channel;
  abstract queueName: T["queueName"];

  constructor(channel: Channel) {
    this.channel = channel;
  }

  publish(event: T["data"]): void {
    const message = JSON.stringify(event);
    this.channel.sendToQueue(this.queueName, Buffer.from(message), {
      persistent: true,
    });
  }
}
