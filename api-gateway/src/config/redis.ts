import Redis from "ioredis";

let redisClient: Redis | null = null;

/**
 * Initialize Redis connection
 */
export const initRedis = (): Redis => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err: Error) => {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  });

  redisClient.on("connect", () => {
    console.log("✅ Redis connected");
  });

  redisClient.on("error", (err: Error) => {
    console.error("❌ Redis connection error:", err);
  });

  redisClient.on("close", () => {
    console.log("⚠️ Redis connection closed");
  });

  return redisClient;
};

/**
 * Get Redis client instance
 */
export const getRedisClient = (): Redis => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

/**
 * Wait for Redis to be ready
 */
export const waitForRedis = async (): Promise<void> => {
  const client = getRedisClient();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Redis connection timeout"));
    }, 10000);

    if (client.status === "ready") {
      clearTimeout(timeout);
      resolve();
      return;
    }

    client.once("ready", () => {
      clearTimeout(timeout);
      resolve();
    });

    client.once("error", (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};

/**
 * Close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};
