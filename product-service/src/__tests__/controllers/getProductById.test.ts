import request from "supertest";
import app from "../../app";
import { createTestProduct, validObjectId } from "../helpers/testHelpers";

describe("getProductById Controller", () => {
  describe("GET /api/products/:id", () => {
    it("should get product by id", async () => {
      const product = await createTestProduct();

      const response = await request(app)
        .get(`/api/products/${product.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(product.name);
      expect(response.body.data.product.id.toString()).toBe(
        product.id.toString(),
      );
    });

    it("should return 404 for non-existent product", async () => {
      const fakeId = validObjectId();

      const response = await request(app)
        .get(`/api/products/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not found");
    });

    it("should return 400 for invalid id format", async () => {
      const response = await request(app)
        .get("/api/products/invalid-id")
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
