export enum PaymentStatus {
  /**
   * The payment is pending
   */
  PENDING = "pending",
  /**
   * The payment is successful
   */
  PAID = "paid",
  /**
   * The payment is refunded
   */
  REFUNDED = "refunded",
  /**
   * The payment is failed
   */
  FAILED = "failed",
}
