import request from "supertest";
import app from "../../app";
import {
  createProductWithVariants,
  createTestProduct,
  getAdminToken,
  getUserToken,
  validObjectId,
} from "../helpers/testHelpers";

describe("updateProductStock Controller", () => {
  describe("PATCH /api/products/:id/stock (Admin)", () => {
    it("should update total stock", async () => {
      const token = getAdminToken();
      const product = await createTestProduct({ stock: 100 });

      const response = await request(app)
        .patch(`/api/products/${product._id}/stock`)
        .set("Authorization", `Bearer ${token}`)
        .send({ stock: 150 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.stock).toBe(150);
    });

    it("should update variant stock", async () => {
      const token = getAdminToken();
      const product = await createProductWithVariants();

      const response = await request(app)
        .patch(`/api/products/${product._id}/stock`)
        .set("Authorization", `Bearer ${token}`)
        .send({ variantIndex: 0, quantity: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.variants[0].stock).toBe(15); // 10 + 5
    });

    it("should decrease variant stock", async () => {
      const token = getAdminToken();
      const product = await createProductWithVariants();

      const response = await request(app)
        .patch(`/api/products/${product._id}/stock`)
        .set("Authorization", `Bearer ${token}`)
        .send({ variantIndex: 0, quantity: -3 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.variants[0].stock).toBe(7); // 10 - 3
    });

    it("should prevent negative stock", async () => {
      const token = getAdminToken();
      const product = await createProductWithVariants();

      const response = await request(app)
        .patch(`/api/products/${product._id}/stock`)
        .set("Authorization", `Bearer ${token}`)
        .send({ variantIndex: 0, quantity: -50 }) // More than available
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.variants[0].stock).toBe(0); // Clamped to 0
    });

    it("should return 404 for non-existent product", async () => {
      const token = getAdminToken();
      const fakeId = validObjectId();

      const response = await request(app)
        .patch(`/api/products/${fakeId}/stock`)
        .set("Authorization", `Bearer ${token}`)
        .send({ stock: 100 })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid variant index", async () => {
      const token = getAdminToken();
      const product = await createProductWithVariants();

      const response = await request(app)
        .patch(`/api/products/${product._id}/stock`)
        .set("Authorization", `Bearer ${token}`)
        .send({ variantIndex: -1, quantity: 5 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should not update stock without token", async () => {
      const product = await createTestProduct();

      const response = await request(app)
        .patch(`/api/products/${product._id}/stock`)
        .send({ stock: 100 })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should not update stock with user token (non-admin)", async () => {
      const token = getUserToken();
      const product = await createTestProduct();

      const response = await request(app)
        .patch(`/api/products/${product._id}/stock`)
        .set("Authorization", `Bearer ${token}`)
        .send({ stock: 100 })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
