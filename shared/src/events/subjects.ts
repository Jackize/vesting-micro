export enum Subjects {
  /**
   * The order is created
   */
  OrderCreated = "order:created",
  /**
   * The order is cancelled
   */
  OrderCancelled = "order:cancelled",
  /**
   * The order is shipped
   */
  OrderShipped = "order:shipped",
  /**
   * The order is delivered
   */
  OrderDelivered = "order:delivered",
  /**
   * The order is expired
   */
  OrderExpired = "order:expired",
  /**
   * The payment is failed
   */
  PaymentFailed = "payment:failed",
  /**
   * The payment is successful
   */
  PaymentSuccess = "payment:success",
  /**
   * The payment is refunded
   */
  PaymentRefunded = "payment:refunded",
  /**
   * A product is created
   */
  ProductCreated = "product:created",
  /**
   * A product is updated
   */
  ProductUpdated = "product:updated",
}
