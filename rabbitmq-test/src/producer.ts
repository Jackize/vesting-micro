import amqp from "amqplib";
import { ProductCreatedPublisher } from "./events/product-created-publisher";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

interface Message {
  id: string;
  name: string;
  price: number;
}

async function produce() {
  let connection;
  try {
    console.log("🔌 Connecting to RabbitMQ...");
    connection = await amqp.connect(RABBITMQ_URL);
    console.log("✅ Connected to RabbitMQ");

    const channel = await connection.createChannel();
    console.log("✅ Channel created");

    // Create producer instance to get the queue name
    const producer = new ProductCreatedPublisher(channel);

    // Assert queue exists (work queue pattern - durable)
    // Use the queue name from the publisher (product.created)
    await channel.assertQueue(producer.queueName, {
      durable: true, // Queue survives broker restarts
    });
    console.log(`✅ Queue '${producer.queueName}' asserted`);

    // Produce messages
    const messages = [
      { name: "Task 1", price: 100 },
      { name: "Task 2", price: 200 },
      { name: "Task 3", price: 300 },
      { name: "Task 4", price: 400 },
      { name: "Task 5", price: 500 },
      { name: "Task 6", price: 600 },
      { name: "Task 7", price: 700 },
      { name: "Task 8", price: 800 },
      { name: "Task 9", price: 900 },
      { name: "Task 10", price: 1000 },
    ];

    console.log(`\n📤 Producing ${messages.length} messages...\n`);
    for (let i = 0; i < messages.length; i++) {
      const message: Message = {
        id: `msg-${i + 1}`,
        name: messages[i].name,
        price: messages[i].price,
      };

      producer.publish(message);
      // channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)), {
      //   persistent: true,
      // });

      console.log(
        `✅ [${i + 1}/${messages.length}] Sent: ${message.name} (ID: ${
          message.id
        })`
      );

      // Small delay to make it easier to see in console
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`\n✅ All ${messages.length} messages sent successfully!`);
    console.log("💡 Messages are now in the queue waiting for consumers.");
    console.log("💡 Run 'npm run consume' to start a consumer.\n");

    // Close channel and connection
    await channel.close();
    await connection.close();
    console.log("🔌 Connection closed");
  } catch (error) {
    console.error("❌ Error:", error);
    if (connection) {
      await connection.close();
    }
    process.exit(1);
  }
}

// Run producer
produce();
