import mongoose from "mongoose";
import request from "supertest";
import app from "../../app";
import { createTestOrder, getAuthToken } from "../helpers/testHelpers";

describe("Get User Orders Controller", () => {
  describe("GET /api/orders", () => {
    it("should get user's orders", async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = await getAuthToken(userId.toString());

      // Create multiple orders for the user
      await createTestOrder({ userId });
      await createTestOrder({ userId });
      await createTestOrder({
        userId: new mongoose.Types.ObjectId(),
      }); // Different user

      const response = await request(app)
        .get("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toBeInstanceOf(Array);
      expect(response.body.data.orders.length).toBe(2); // Only user's orders
      expect(response.body.data.pagination).toHaveProperty("page");
      expect(response.body.data.pagination).toHaveProperty("limit");
      expect(response.body.data.pagination).toHaveProperty("total");
      expect(response.body.data.pagination).toHaveProperty("pages");
    });

    it("should paginate user's orders", async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = await getAuthToken(userId.toString());

      // Create 15 orders
      for (let i = 0; i < 15; i++) {
        await createTestOrder({ userId });
      }

      const response = await request(app)
        .get("/api/orders?page=1&limit=10")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.orders.length).toBeLessThanOrEqual(10);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it("should filter orders by status", async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = await getAuthToken(userId.toString());

      await createTestOrder({ userId, status: "pending" });
      await createTestOrder({ userId, status: "confirmed" });
      await createTestOrder({ userId, status: "delivered" });

      const response = await request(app)
        .get("/api/orders?status=pending")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.orders.forEach((order: any) => {
        expect(order.status).toBe("pending");
      });
    });

    it("should filter orders by payment status", async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = await getAuthToken(userId.toString());

      await createTestOrder({ userId, paymentStatus: "pending" });
      await createTestOrder({ userId, paymentStatus: "paid" });

      const response = await request(app)
        .get("/api/orders?paymentStatus=paid")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.orders.forEach((order: any) => {
        expect(order.paymentStatus).toBe("paid");
      });
    });

    it("should not allow access without token", async () => {
      const response = await request(app).get("/api/orders").expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
