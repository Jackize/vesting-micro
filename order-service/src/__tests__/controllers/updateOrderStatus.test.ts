import request from "supertest";
import app from "../../app";
import Order from "../../models/Order";
import {
  createTestOrder,
  getAdminToken,
  getAuthToken,
} from "../helpers/testHelpers";

describe("Update Order Status Controller", () => {
  describe("PATCH /api/orders/:id/status", () => {
    it("should update order status for admin", async () => {
      const token = await getAdminToken();
      const order = await createTestOrder({ status: "pending" });

      const response = await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "confirmed" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Order status updated successfully");
      expect(response.body.data.order.status).toBe("confirmed");

      // Verify in database
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder?.status).toBe("confirmed");
    });

    it("should mark payment as paid when order is delivered", async () => {
      const token = await getAdminToken();
      const order = await createTestOrder({
        status: "processing",
        paymentStatus: "pending",
      });

      const response = await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "delivered" })
        .expect(200);

      expect(response.body.data.order.status).toBe("delivered");
      expect(response.body.data.order.paymentStatus).toBe("paid");

      // Verify in database
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder?.paymentStatus).toBe("paid");
    });

    it("should mark payment as refunded when order is cancelled", async () => {
      const token = await getAdminToken();
      const order = await createTestOrder({
        status: "confirmed",
        paymentStatus: "paid",
      });

      const response = await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "cancelled" })
        .expect(200);

      expect(response.body.data.order.status).toBe("cancelled");
      expect(response.body.data.order.paymentStatus).toBe("refunded");

      // Verify in database
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder?.paymentStatus).toBe("refunded");
    });

    it("should not update with invalid status", async () => {
      const token = await getAdminToken();
      const order = await createTestOrder();

      const response = await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "invalid_status" })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existent order", async () => {
      const token = await getAdminToken();

      const response = await request(app)
        .patch("/api/orders/507f1f77bcf86cd799439011/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "confirmed" })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it("should not allow regular user to update order status", async () => {
      const order = await createTestOrder();
      const token = await getAuthToken(order.userId.toString());

      const response = await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "confirmed" })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it("should not allow access without token", async () => {
      const order = await createTestOrder();

      const response = await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .send({ status: "confirmed" })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
