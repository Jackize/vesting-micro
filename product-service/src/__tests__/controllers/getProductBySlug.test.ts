import request from "supertest";
import app from "../../app";
import { createTestProduct } from "../helpers/testHelpers";

describe("getProductBySlug Controller", () => {
  describe("GET /api/products/slug/:slug", () => {
    it("should get product by slug", async () => {
      const product = await createTestProduct({ slug: "test-product-slug" });

      const response = await request(app)
        .get("/api/products/slug/test-product-slug")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.slug).toBe("test-product-slug");
    });

    it("should return 404 for non-existent slug", async () => {
      const response = await request(app)
        .get("/api/products/slug/non-existent-slug")
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
