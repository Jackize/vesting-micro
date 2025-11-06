import mongoose from "mongoose";
import request from "supertest";
import app from "../../app";
import {
  createTestOrder,
  getAdminToken,
  getAuthToken,
} from "../helpers/testHelpers";

describe("Get Order By ID Controller", () => {
  describe("GET /api/orders/:id", () => {
    it("should get order by id with valid token", async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = await getAuthToken(userId.toString());
      const order = await createTestOrder({ userId });

      const response = await request(app)
        .get(`/api/orders/${order.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.id).toBe(order.id.toString());
      expect(response.body.data.order.orderNumber).toBe(order.orderNumber);
      expect(response.body.data.order).toHaveProperty("isExpired");
    });

    it("should not get order without token", async () => {
      const order = await createTestOrder();

      const response = await request(app)
        .get(`/api/orders/${order.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existent order", async () => {
      const token = await getAuthToken();

      const response = await request(app)
        .get("/api/orders/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it("should not allow user to access another user's order", async () => {
      const order = await createTestOrder({
        userId: new mongoose.Types.ObjectId(),
      });
      const token = await getAuthToken("user2");

      const response = await request(app)
        .get(`/api/orders/${order.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it("should allow admin to access any order", async () => {
      const order = await createTestOrder({
        userId: new mongoose.Types.ObjectId(),
      });
      const token = await getAdminToken();

      const response = await request(app)
        .get(`/api/orders/${order.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.id).toBe(order.id.toString());
    });
  });
});
