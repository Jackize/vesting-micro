import request from "supertest";
import app from "../../app";
import Order from "../../models/Order";
import {
  createTestOrder,
  getAdminToken,
  getAuthToken,
} from "../helpers/testHelpers";

describe("Delete Order Controller", () => {
  describe("DELETE /api/orders/:id", () => {
    it("should delete order for admin", async () => {
      const token = await getAdminToken();
      const orderToDelete = await createTestOrder();

      const response = await request(app)
        .delete(`/api/orders/${orderToDelete._id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Order deleted successfully");

      // Verify order is deleted
      const deletedOrder = await Order.findById(orderToDelete._id);
      expect(deletedOrder).toBeNull();
    });

    it("should not delete order for regular user", async () => {
      const order = await createTestOrder();
      const token = await getAuthToken(order.userId.toString());

      const response = await request(app)
        .delete(`/api/orders/${order._id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);

      // Verify order still exists
      const existingOrder = await Order.findById(order._id);
      expect(existingOrder).not.toBeNull();
    });

    it("should return 404 for non-existent order", async () => {
      const token = await getAdminToken();

      const response = await request(app)
        .delete("/api/orders/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it("should not allow access without token", async () => {
      const order = await createTestOrder();

      const response = await request(app)
        .delete(`/api/orders/${order._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
