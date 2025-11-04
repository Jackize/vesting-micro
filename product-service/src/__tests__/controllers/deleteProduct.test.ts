import request from "supertest";
import app from "../../app";
import Product from "../../models/Product";
import {
  createTestProduct,
  getAdminToken,
  getUserToken,
  validObjectId,
} from "../helpers/testHelpers";

describe("deleteProduct Controller", () => {
  describe("DELETE /api/products/:id (Admin)", () => {
    it("should delete product with admin token", async () => {
      const token = getAdminToken();
      const product = await createTestProduct();

      const response = await request(app)
        .delete(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Product deleted successfully");

      // Verify product is deleted
      const deletedProduct = await Product.findById(product.id);
      expect(deletedProduct).toBeNull();
    });

    it("should return 404 for non-existent product", async () => {
      const token = getAdminToken();
      const fakeId = validObjectId();

      const response = await request(app)
        .delete(`/api/products/${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it("should not delete product without token", async () => {
      const product = await createTestProduct();

      const response = await request(app)
        .delete(`/api/products/${product.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should not delete product with user token (non-admin)", async () => {
      const token = getUserToken();
      const product = await createTestProduct();

      const response = await request(app)
        .delete(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
