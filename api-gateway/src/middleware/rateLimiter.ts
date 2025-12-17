import { Request, Response } from "express";
import type { ClientRateLimitInfo, Store } from "express-rate-limit";
import rateLimit from "express-rate-limit";
import { getRedisClient } from "../config/redis";

/**
 * Redis store for rate limiting
 */
class RedisStore implements Store {
  private client = getRedisClient();

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const exists = await this.client.exists(key);

    if (!exists) {
      // Set expiration time (in seconds)
      const ttl = 60; // 1 minute default
      await this.client.setex(key, ttl, "1");
      return { totalHits: 1, resetTime: new Date(Date.now() + ttl * 1000) };
    }

    const hits = await this.client.incr(key);
    const ttl = await this.client.ttl(key);

    return { totalHits: hits, resetTime: new Date(Date.now() + ttl * 1000) };
  }

  async decrement(key: string): Promise<void> {
    await this.client.decr(key);
  }

  async resetKey(key: string): Promise<void> {
    await this.client.del(key);
  }

  async shutdown(): Promise<void> {
    await this.client.quit();
  }
}

/**
 * Create rate limiter middleware
 */
export const createRateLimiter = (options?: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per window
    message = "Too many requests from this IP, please try again later.",
    skipSuccessfulRequests = false,
  } = options || {};

  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    store: new RedisStore(),
    keyGenerator: (req: Request): string => {
      // Use user ID if authenticated, otherwise use IP
      const userId = (req as any).currentUser?.id;
      return userId ? `rate-limit:user:${userId}` : `rate-limit:ip:${req.ip}`;
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message,
        code: "RATE_LIMIT_EXCEEDED",
      });
    },
  });
};

/**
 * General API rate limiter (100 requests per 15 minutes)
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many API requests, please try again later.",
});

/**
 * Strict rate limiter for authentication endpoints (5 requests per 15 minutes)
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many authentication attempts, please try again later.",
});

/**
 * Payment rate limiter (10 requests per minute)
 */
export const paymentRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many payment requests, please try again later.",
});
