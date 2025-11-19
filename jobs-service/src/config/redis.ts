import Redis from "ioredis";

/**
 * Shared Redis connection for BullMQ
 * This connection is used by all queues and workers
 */
export const redisConnection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false, // Required for BullMQ
  connectTimeout: 10000, // 10 seconds connection timeout
  lazyConnect: false, // Connect immediately
  retryStrategy: (times: number) => {
    if (times > 10) {
      console.error("❌ Redis connection failed after 10 retries");
      return null; // Stop retrying
    }
    const delay = Math.min(times * 100, 3000);
    console.log(
      `🔄 Retrying Redis connection (attempt ${times}) in ${delay}ms`,
    );
    return delay;
  },
});

redisConnection.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
  console.error(`   Host: ${process.env.REDIS_HOST || "localhost"}`);
  console.error(`   Port: ${process.env.REDIS_PORT || "6379"}`);
});

redisConnection.on("close", () => {
  console.warn("⚠️ Redis connection closed");
});

/**
 * Wait for Redis to be ready
 */
export async function waitForRedis(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already connected
    if (redisConnection.status === "ready") {
      // console.log("✅ Redis is already connected");
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      redisConnection.removeAllListeners("ready");
      redisConnection.removeAllListeners("error");
      reject(new Error("Redis connection timeout after 30 seconds"));
    }, 30000); // 30 seconds timeout

    const onReady = () => {
      clearTimeout(timeout);
      redisConnection.removeListener("error", onError);
      console.log("✅ Redis connection established and ready");
      resolve();
    };

    const onError = (err: Error) => {
      clearTimeout(timeout);
      redisConnection.removeListener("ready", onReady);
      reject(err);
    };

    redisConnection.once("ready", onReady);
    redisConnection.once("error", onError);

    // Try to connect if not already connecting
    if (redisConnection.status === "end") {
      redisConnection.connect().catch(() => {
        // Connection will be handled by error handler
      });
    }
  });
}

// Graceful shutdown handler
process.on("SIGTERM", async () => {
  console.log("⚠️ SIGTERM received, closing Redis connection...");
  await redisConnection.quit();
});

process.on("SIGINT", async () => {
  console.log("⚠️ SIGINT received, closing Redis connection...");
  await redisConnection.quit();
});
