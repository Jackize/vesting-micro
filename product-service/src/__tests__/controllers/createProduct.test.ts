import request from "supertest";
import app from "../../app";
import rabbitWrapper from "../../rabbitWrapper";
import { getAdminToken, getUserToken } from "../helpers/testHelpers";

jest.mock("../../rabbitWrapper");
describe("createProduct Controller", () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/products (Admin)", () => {
    it("should create product with admin token", async () => {
      const token = getAdminToken();
      const productData = {
        name: "New Test Product",
        slug: "new-test-product",
        description: "Test description",
        shortDescription: "Short description",
        sku: "TEST-001",
        category: "test-category",
        images: ["https://example.com/image.jpg"],
        basePrice: 99.99,
        stock: 100,
        status: "active",
        featured: false,
        tags: ["test"],
      };

      const response = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(productData.name);
      expect(response.body.data.product.slug).toBe(productData.slug);

      // Verify RabbitMQ publisher was called
      expect(rabbitWrapper.channel.assertQueue).toHaveBeenCalled();
      expect(rabbitWrapper.channel.sendToQueue).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Buffer),
        { persistent: true },
      );
    });

    it("should create product with variants", async () => {
      const token = getAdminToken();
      const productData = {
        name: "Product with Variants",
        slug: "product-with-variants",
        description: "Test description",
        sku: "VAR-001",
        category: "test-category",
        images: ["https://example.com/image.jpg"],
        basePrice: 99.99,
        stock: 0, // Will be calculated from variants
        variants: [
          {
            name: "Size",
            value: "Small",
            sku: "VAR-001-S",
            stock: 10,
            price: 99.99,
          },
          {
            name: "Size",
            value: "Large",
            sku: "VAR-001-L",
            stock: 20,
            price: 109.99,
          },
        ],
      };

      const response = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.variants.length).toBe(2);
      expect(response.body.data.product.stock).toBe(30); // Sum of variant stocks
    });

    it("should not create product without token", async () => {
      const response = await request(app)
        .post("/api/products")
        .send({ name: "Test" })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should not create product with user token (non-admin)", async () => {
      const token = getUserToken();
      const response = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Test" })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it("should validate required fields", async () => {
      const token = getAdminToken();
      const response = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Test" }) // Missing required fields
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should validate slug format", async () => {
      const token = getAdminToken();
      const response = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Test",
          slug: "Invalid Slug Format!", // Invalid slug
          description: "Test",
          sku: "TEST",
          category: "test",
          images: ["https://example.com/image.jpg"],
          basePrice: 100,
          stock: 10,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
