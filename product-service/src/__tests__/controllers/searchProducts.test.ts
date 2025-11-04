import request from "supertest";
import app from "../../app";
import { createTestProduct } from "../helpers/testHelpers";

describe("searchProducts Controller", () => {
  describe("GET /api/products/search", () => {
    it("should search products by query", async () => {
      await createTestProduct({
        name: "Leather Vest Black",
        description: "Premium leather vest",
        status: "active",
      });
      await createTestProduct({
        name: "Cotton Vest White",
        description: "Soft cotton vest",
        status: "active",
      });

      const response = await request(app)
        .get("/api/products/search?q=leather")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThan(0);
      expect(response.body.data.query).toBe("leather");
    });

    it("should return 400 for missing search query", async () => {
      const response = await request(app)
        .get("/api/products/search")
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for empty search query", async () => {
      const response = await request(app)
        .get("/api/products/search?q=")
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
