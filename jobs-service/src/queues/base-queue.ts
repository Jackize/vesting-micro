import { Queue, QueueOptions } from "bullmq";
import { redisConnection } from "../config/redis";

/**
 * Base queue configuration
 */
const baseQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
};

/**
 * Create a queue with base configuration
 */
export function createQueue(name: string, options?: Partial<QueueOptions>) {
  const queue = new Queue(name, {
    ...baseQueueOptions,
    ...options,
  });

  // Log queue events for monitoring
  queue.on("error", (error) => {
    console.error(`❌ Queue ${name} error:`, error);
  });

  queue.on("waiting", (job) => {
    console.log(`⏳ Job ${job?.id} is waiting in queue ${name}`);
  });

  return queue;
}
