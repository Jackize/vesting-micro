import Redis from "ioredis";

/**
 * Redis connection for token blacklist and caching
 */
export const redisClient = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectTimeout: 10000,
  retryStrategy: (times: number) => {
    if (times > 10) {
      console.error("❌ Redis connection failed after 10 retries");
      return null;
    }
    const delay = Math.min(times * 100, 3000);
    console.log(
      `🔄 Retrying Redis connection (attempt ${times}) in ${delay}ms`,
    );
    return delay;
  },
});

redisClient.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

redisClient.on("connect", () => {
  console.log("🔄 Connecting to Redis...");
});

redisClient.on("ready", () => {
  console.log("✅ Redis connection established and ready");
});

/**
 * Wait for Redis to be ready
 */
export async function waitForRedis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (redisClient.status === "ready") {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      redisClient.removeAllListeners("ready");
      redisClient.removeAllListeners("error");
      reject(new Error("Redis connection timeout after 30 seconds"));
    }, 30000);

    const onReady = () => {
      clearTimeout(timeout);
      redisClient.removeListener("error", onError);
      console.log("✅ Redis connection established and ready");
      resolve();
    };

    const onError = (err: Error) => {
      clearTimeout(timeout);
      redisClient.removeListener("ready", onReady);
      reject(err);
    };

    redisClient.once("ready", onReady);
    redisClient.once("error", onError);

    if (redisClient.status === "end") {
      redisClient.connect().catch(() => {
        // Connection will be handled by error handler
      });
    }
  });
}

// Graceful shutdown handler
process.on("SIGTERM", () => {
  redisClient.quit();
});

process.on("SIGINT", () => {
  redisClient.quit();
});
