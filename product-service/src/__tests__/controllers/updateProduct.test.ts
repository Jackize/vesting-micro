import request from "supertest";
import app from "../../app";
import {
  createTestProduct,
  getAdminToken,
  getUserToken,
  validObjectId,
} from "../helpers/testHelpers";

describe("updateProduct Controller", () => {
  describe("PUT /api/products/:id (Admin)", () => {
    it("should update product with admin token", async () => {
      const token = getAdminToken();
      const product = await createTestProduct();

      const updateData = {
        name: "Updated Product Name",
        basePrice: 149.99,
      };

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(updateData.name);
      expect(response.body.data.product.basePrice).toBe(updateData.basePrice);
    });

    it("should return 404 for non-existent product", async () => {
      const token = getAdminToken();
      const fakeId = validObjectId();

      const response = await request(app)
        .put(`/api/products/${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated" })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it("should not update product without token", async () => {
      const product = await createTestProduct();

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({ name: "Updated" })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should not update product with user token (non-admin)", async () => {
      const token = getUserToken();
      const product = await createTestProduct();

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated" })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
