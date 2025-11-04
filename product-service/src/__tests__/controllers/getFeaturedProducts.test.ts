import request from "supertest";
import app from "../../app";
import {
  createFeaturedProduct,
  createTestProduct,
} from "../helpers/testHelpers";

describe("getFeaturedProducts Controller", () => {
  describe("GET /api/products/featured", () => {
    it("should get featured products", async () => {
      await createFeaturedProduct();
      await createFeaturedProduct();
      await createTestProduct({ featured: false, status: "active" });

      const response = await request(app)
        .get("/api/products/featured")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBe(2);
      response.body.data.products.forEach((product: any) => {
        expect(product.featured).toBe(true);
        expect(product.status).toBe("active");
      });
    });

    it("should limit featured products", async () => {
      // Create 15 featured products
      for (let i = 0; i < 15; i++) {
        await createFeaturedProduct();
      }

      const response = await request(app)
        .get("/api/products/featured?limit=10")
        .expect(200);

      expect(response.body.data.products.length).toBeLessThanOrEqual(10);
    });
  });
});
