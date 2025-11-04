import request from "supertest";
import app from "../../app";
import {
  createFeaturedProduct,
  createTestProduct,
} from "../helpers/testHelpers";

describe("getAllProducts Controller", () => {
  describe("GET /api/products", () => {
    it("should get all active products", async () => {
      await createTestProduct({ status: "active" });
      await createTestProduct({ status: "active" });
      await createTestProduct({ status: "draft" }); // Should not appear

      const response = await request(app).get("/api/products").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeInstanceOf(Array);
      expect(response.body.data.products.length).toBe(2); // Only active products
      expect(response.body.data.pagination).toHaveProperty("page");
      expect(response.body.data.pagination).toHaveProperty("limit");
      expect(response.body.data.pagination).toHaveProperty("total");
      expect(response.body.data.pagination).toHaveProperty("pages");
    });

    it("should paginate products", async () => {
      // Create 15 products
      for (let i = 0; i < 15; i++) {
        await createTestProduct({ status: "active" });
      }

      const response = await request(app)
        .get("/api/products?page=1&limit=10")
        .expect(200);

      expect(response.body.data.products.length).toBeLessThanOrEqual(10);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(response.body.data.pagination.total).toBe(15);
    });

    it("should filter products by category", async () => {
      await createTestProduct({ category: "men-vests", status: "active" });
      await createTestProduct({ category: "women-vests", status: "active" });
      await createTestProduct({ category: "men-vests", status: "active" });

      const response = await request(app)
        .get("/api/products?category=men-vests")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBe(2);
      response.body.data.products.forEach((product: any) => {
        expect(product.category).toBe("men-vests");
      });
    });

    it("should filter featured products", async () => {
      await createFeaturedProduct();
      await createTestProduct({ featured: false, status: "active" });
      await createFeaturedProduct();

      const response = await request(app)
        .get("/api/products?featured=true")
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.products.forEach((product: any) => {
        expect(product.featured).toBe(true);
      });
    });

    it("should filter products by status", async () => {
      await createTestProduct({ status: "draft" });
      await createTestProduct({ status: "active" });

      const response = await request(app)
        .get("/api/products?status=draft")
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.products.forEach((product: any) => {
        expect(product.status).toBe("draft");
      });
    });

    it("should filter products by price range", async () => {
      await createTestProduct({ basePrice: 50, status: "active" });
      await createTestProduct({ basePrice: 100, status: "active" });
      await createTestProduct({ basePrice: 150, status: "active" });
      await createTestProduct({ basePrice: 200, status: "active" });

      const response = await request(app)
        .get("/api/products?minPrice=75&maxPrice=175")
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.products.forEach((product: any) => {
        expect(product.basePrice).toBeGreaterThanOrEqual(75);
        expect(product.basePrice).toBeLessThanOrEqual(175);
      });
    });

    it("should sort products by price ascending", async () => {
      await createTestProduct({ basePrice: 200, status: "active" });
      await createTestProduct({ basePrice: 50, status: "active" });
      await createTestProduct({ basePrice: 150, status: "active" });

      const response = await request(app)
        .get("/api/products?sort=price_asc")
        .expect(200);

      expect(response.body.success).toBe(true);
      const prices = response.body.data.products.map((p: any) => p.basePrice);
      expect(prices).toEqual([50, 150, 200]);
    });

    it("should sort products by price descending", async () => {
      await createTestProduct({ basePrice: 200, status: "active" });
      await createTestProduct({ basePrice: 50, status: "active" });
      await createTestProduct({ basePrice: 150, status: "active" });

      const response = await request(app)
        .get("/api/products?sort=price_desc")
        .expect(200);

      expect(response.body.success).toBe(true);
      const prices = response.body.data.products.map((p: any) => p.basePrice);
      expect(prices).toEqual([200, 150, 50]);
    });
  });
});
