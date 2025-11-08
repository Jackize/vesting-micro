export enum OrderStatus {
  /**
   * The order is pending payment
   */
  PENDING = "pending",
  /**
   * The order is confirmed and payment is received
   */
  CONFIRMED = "confirmed",
  /**
   * The order is being processed
   */
  PROCESSING = "processing",
  /**
   * The order is shipped
   */
  SHIPPED = "shipped",
  /**
   * The order is delivered
   */
  DELIVERED = "delivered",
  /**
   * The order is cancelled
   */
  CANCELLED = "cancelled",
  /**
   * The order is expired
   */
  EXPIRED = "expired",
}
