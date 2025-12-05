import { CustomError } from "@vestify/shared/dist/errors/CustomError";
import jwt from "jsonwebtoken";
import { redisClient } from "../config/redis";
const RATE_LIMIT_SEND_EMAIL = 3; // 3 times per hour
const WINDOW_IN_SECONDS = 60 * 60; // 1 hour
/**
 * Add token to blacklist
 * @param token - JWT token to blacklist
 * @param expiresIn - Token expiration time in seconds (optional, will extract from token if not provided)
 */
export async function addToBlacklist(
  token: string,
  expiresIn?: number,
): Promise<void> {
  try {
    // Extract expiration from token if not provided
    if (!expiresIn) {
      const decoded = jwt.decode(token) as jwt.JwtPayload | null;
      if (decoded && decoded.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        expiresIn = decoded.exp - currentTime;
      } else {
        // Default to 24 hours if no expiration found
        expiresIn = 24 * 60 * 60;
      }
    }

    // Only add if expiration is positive
    if (expiresIn > 0) {
      const key = `blacklist:${token}`;
      await redisClient.setex(key, expiresIn, "1");
    }
  } catch (error) {
    console.error("Error adding token to blacklist:", error);
    throw error;
  }
}

/**
 * Check if token is blacklisted
 * @param token - JWT token to check
 * @returns true if token is blacklisted, false otherwise
 */
export async function isBlacklisted(token: string): Promise<boolean> {
  try {
    const key = `blacklist:${token}`;
    const result = await redisClient.get(key);
    return result === "1";
  } catch (error) {
    console.error("Error checking token blacklist:", error);
    // On error, assume not blacklisted to avoid blocking legitimate requests
    return false;
  }
}

/**
 * Remove token from blacklist (useful for testing or admin operations)
 * @param token - JWT token to remove from blacklist
 */
export async function removeFromBlacklist(token: string): Promise<void> {
  try {
    const key = `blacklist:${token}`;
    await redisClient.del(key);
  } catch (error) {
    console.error("Error removing token from blacklist:", error);
    throw error;
  }
}

/**
 * Check rate limit for sending password reset email
 * @param email - Email to check rate limit for
 * @returns true if rate limit is exceeded, false otherwise
 */
export async function checkRateLimitSendPasswordResetEmail(
  email: string,
): Promise<void> {
  try {
    const key = `rate_limit:send_password_reset_email:${email}`;
    const result = await redisClient.get(key);
    if (result && parseInt(result) >= RATE_LIMIT_SEND_EMAIL) {
      throw new CustomError("Too many requests, please try again later", 429);
    }
    await redisClient.incr(key);
    await redisClient.expire(key, WINDOW_IN_SECONDS);
  } catch (error) {
    throw error;
  }
}

/**
 * Check rate limit for sending verification email
 * @param email - Email to check rate limit for
 * @returns true if rate limit is exceeded, false otherwise
 */
export async function checkRateLimitResendVerificationEmail(
  email: string,
): Promise<void> {
  try {
    const key = `rate_limit:resend_verification_email:${email}`;
    const result = await redisClient.get(key);
    console.log("result", result);
    if (result && parseInt(result) >= RATE_LIMIT_SEND_EMAIL) {
      throw new CustomError("Too many requests, please try again later", 429);
    }
    await redisClient.incr(key);
    await redisClient.expire(key, WINDOW_IN_SECONDS);
  } catch (error) {
    throw error;
  }
}
