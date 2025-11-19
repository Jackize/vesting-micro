import { createQueue } from "./base-queue";

/**
 * Queue for order expiration jobs
 */
export const expirationQueue = createQueue("order-expiration");
