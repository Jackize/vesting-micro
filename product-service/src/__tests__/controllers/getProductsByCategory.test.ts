import request from "supertest";
import app from "../../app";
import { createProductsByCategory } from "../helpers/testHelpers";

describe("getProductsByCategory Controller", () => {
  describe("GET /api/products/category/:category", () => {
    it("should get products by category", async () => {
      await createProductsByCategory("men-vests", 3);
      await createProductsByCategory("women-vests", 2);

      const response = await request(app)
        .get("/api/products/category/men-vests")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBe(3);
      response.body.data.products.forEach((product: any) => {
        expect(product.category).toBe("men-vests");
        expect(product.status).toBe("active");
      });
    });

    it("should paginate products by category", async () => {
      await createProductsByCategory("test-category", 15);

      const response = await request(app)
        .get("/api/products/category/test-category?page=1&limit=10")
        .expect(200);

      expect(response.body.data.products.length).toBeLessThanOrEqual(10);
      expect(response.body.data.pagination.total).toBe(15);
    });
  });
});
