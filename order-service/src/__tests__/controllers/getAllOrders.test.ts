import mongoose from "mongoose";
import request from "supertest";
import app from "../../app";
import {
  createTestOrder,
  getAdminToken,
  getAuthToken,
} from "../helpers/testHelpers";

describe("Get All Orders Controller", () => {
  describe("GET /api/orders/admin/all", () => {
    it("should get all orders for admin", async () => {
      const token = await getAdminToken();

      // Create some test orders
      await createTestOrder();
      await createTestOrder();
      await createTestOrder();

      const response = await request(app)
        .get("/api/orders/admin/all")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toHaveProperty("page");
      expect(response.body.data.pagination).toHaveProperty("limit");
      expect(response.body.data.pagination).toHaveProperty("total");
      expect(response.body.data.pagination).toHaveProperty("pages");
    });

    it("should paginate orders", async () => {
      const token = await getAdminToken();

      // Create 15 orders
      for (let i = 0; i < 15; i++) {
        await createTestOrder();
      }

      const response = await request(app)
        .get("/api/orders/admin/all?page=1&limit=10")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.orders.length).toBeLessThanOrEqual(10);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it("should filter orders by status", async () => {
      const token = await getAdminToken();

      await createTestOrder({ status: "pending" });
      await createTestOrder({ status: "confirmed" });
      await createTestOrder({ status: "delivered" });

      const response = await request(app)
        .get("/api/orders/admin/all?status=confirmed")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.orders.forEach((order: any) => {
        expect(order.status).toBe("confirmed");
      });
    });

    it("should filter orders by userId", async () => {
      const token = await getAdminToken();
      const userId = new mongoose.Types.ObjectId();

      await createTestOrder({ userId });
      await createTestOrder({ userId });
      await createTestOrder({ userId: new mongoose.Types.ObjectId() });

      const response = await request(app)
        .get(`/api/orders/admin/all?userId=${userId.toString()}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.orders.forEach((order: any) => {
        expect(order.userId.toString()).toBe(userId.toString());
      });
    });

    it("should not allow regular user to get all orders", async () => {
      const user = await createTestOrder();
      const token = await getAuthToken(user.userId.toString());

      const response = await request(app)
        .get("/api/orders/admin/all")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it("should not allow access without token", async () => {
      const response = await request(app)
        .get("/api/orders/admin/all")
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
