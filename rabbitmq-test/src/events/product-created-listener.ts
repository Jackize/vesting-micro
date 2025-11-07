import { BaseConsumer } from "./baseConsumer";
import { ProductCreatedEvent } from "./product-created-event";
import { Subject } from "./subject";

export class ProductCreatedListener extends BaseConsumer<ProductCreatedEvent> {
  queueName: Subject.PRODUCT_CREATED = Subject.PRODUCT_CREATED;

  async handle(event: ProductCreatedEvent["data"]): Promise<void> {
    const message: ProductCreatedEvent["data"] = event;
    const startTime = Date.now();

    console.log(`\n📨 Received message:`);
    console.log(`   ID: ${message.id}`);
    console.log(`   Name: ${message.name}`);
    console.log(`   Price: ${message.price}`);

    console.log(`⏳ Processing message (${message.name.length * 100}ms)...`);
    await new Promise((resolve) =>
      setTimeout(resolve, message.name.length * 100)
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ Completed message in ${duration}ms`);
    console.log(`✅ Message acknowledged\n`);
  }
}
