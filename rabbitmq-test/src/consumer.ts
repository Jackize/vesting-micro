import amqp from "amqplib";
import { ProductCreatedListener } from "./events/product-created-listener";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

// Get worker name from command line argument or use default
const workerName = process.argv[2] || `worker-${Date.now()}`;

interface Message {
  id: string;
  name: string;
  price: number;
}

async function consume() {
  let connection;
  try {
    console.log(`🔌 [${workerName}] Connecting to RabbitMQ...`);
    connection = await amqp.connect(RABBITMQ_URL);
    console.log(`✅ [${workerName}] Connected to RabbitMQ`);

    const channel = await connection.createChannel();
    console.log(`✅ [${workerName}] Channel created`);

    // IMPORTANT: Prefetch count = 1 ensures fair dispatch
    // This means each consumer will only get one unacknowledged message at a time
    // This enables work queue pattern - messages are distributed evenly
    await channel.prefetch(1);
    console.log(
      `⚙️  [${workerName}] Prefetch set to 1 (fair dispatch enabled)`
    );

    console.log(`\n👂 [${workerName}] Waiting for messages...`);
    console.log(`💡 Press Ctrl+C to stop\n`);

    const listener = new ProductCreatedListener(channel);
    await listener.listen();
  } catch (error) {
    console.error(`❌ [${workerName}] Error:`, error);
    if (connection) {
      await connection.close();
    }
    process.exit(1);
  }

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log(`\n⚠️  [${workerName}] SIGINT received. Closing connection...`);
    if (connection) {
      await connection.close();
    }
    console.log(`✅ [${workerName}] Connection closed. Goodbye!`);
    process.exit(0);
  });
}

// Run consumer
consume();
