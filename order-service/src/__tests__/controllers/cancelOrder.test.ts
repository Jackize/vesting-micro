import mongoose from "mongoose";
import request from "supertest";
import app from "../../app";
import Order from "../../models/Order";
import {
  createTestOrder,
  getAdminToken,
  getAuthToken,
} from "../helpers/testHelpers";

describe("Cancel Order Controller", () => {
  describe("PATCH /api/orders/:id/cancel", () => {
    it("should cancel order for owner", async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = await getAuthToken(userId.toString());
      const order = await createTestOrder({ userId, status: "pending" });

      const response = await request(app)
        .patch(`/api/orders/${order._id}/cancel`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Order cancelled successfully");
      expect(response.body.data.order.status).toBe("cancelled");

      // Verify in database
      const cancelledOrder = await Order.findById(order._id);
      expect(cancelledOrder?.status).toBe("cancelled");
    });

    it("should mark payment as refunded when cancelling paid order", async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = await getAuthToken(userId.toString());
      const order = await createTestOrder({
        userId,
        status: "pending",
        paymentStatus: "paid",
      });

      const response = await request(app)
        .patch(`/api/orders/${order._id}/cancel`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.order.status).toBe("cancelled");
      expect(response.body.data.order.paymentStatus).toBe("refunded");

      // Verify in database
      const cancelledOrder = await Order.findById(order._id);
      expect(cancelledOrder?.paymentStatus).toBe("refunded");
    });

    it("should not cancel already cancelled order", async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = await getAuthToken(userId.toString());
      const order = await createTestOrder({
        userId,
        status: "cancelled",
      });

      const response = await request(app)
        .patch(`/api/orders/${order._id}/cancel`)
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("already cancelled");
    });

    it("should not cancel delivered order", async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = await getAuthToken(userId.toString());
      const order = await createTestOrder({
        userId,
        status: "delivered",
      });

      const response = await request(app)
        .patch(`/api/orders/${order._id}/cancel`)
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Cannot cancel a delivered order");
    });

    it("should not cancel shipped order", async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = await getAuthToken(userId.toString());
      const order = await createTestOrder({
        userId,
        status: "shipped",
      });

      const response = await request(app)
        .patch(`/api/orders/${order._id}/cancel`)
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Cannot cancel a shipped order");
    });

    it("should allow admin to cancel any order", async () => {
      const order = await createTestOrder({
        userId: new mongoose.Types.ObjectId(),
        status: "pending",
      });
      const token = await getAdminToken();

      const response = await request(app)
        .patch(`/api/orders/${order._id}/cancel`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe("cancelled");
    });

    it("should not allow user to cancel another user's order", async () => {
      const order = await createTestOrder({
        userId: new mongoose.Types.ObjectId(),
      });
      const token = await getAuthToken(
        new mongoose.Types.ObjectId().toString(),
      );

      const response = await request(app)
        .patch(`/api/orders/${order._id}/cancel`)
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existent order", async () => {
      const token = await getAuthToken();

      const response = await request(app)
        .patch("/api/orders/507f1f77bcf86cd799439011/cancel")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it("should not allow access without token", async () => {
      const order = await createTestOrder();

      const response = await request(app)
        .patch(`/api/orders/${order._id}/cancel`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
