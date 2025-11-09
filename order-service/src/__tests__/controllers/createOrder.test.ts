import { ProductStatus } from "@vestify/shared";
import request from "supertest";
import app from "../../app";
import rabbitWrapper from "../../rabbitWrapper";
import { createTestProduct, getAuthToken } from "../helpers/testHelpers";

// Use the shared mock from __mocks__ folder
jest.mock("../../rabbitWrapper");

describe("Create Order Controller", () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/orders", () => {
    it("should create order with valid data", async () => {
      // Create test product first
      await createTestProduct({
        productId: "product123",
        name: "Test Product",
        stock: 100,
      });

      const token = await getAuthToken();

      const orderData = {
        items: [
          {
            productId: "product123",
            productName: "Test Product",
            quantity: 2,
            price: 100,
          },
        ],
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
        shippingCost: 10,
        tax: 5,
        discount: 0,
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Order created successfully");
      expect(response.body.data.order).toHaveProperty("orderNumber");
      expect(response.body.data.order.items).toHaveLength(1);
      expect(response.body.data.order.total).toBe(215); // 200 + 10 + 5
      expect(response.body.data.order.status).toBe("pending");
      expect(response.body.data.order.paymentStatus).toBe("pending");
      expect(response.body.data.order).toHaveProperty("expiresAt");

      // Verify RabbitMQ publisher was called
      expect(rabbitWrapper.channel.assertQueue).toHaveBeenCalled();
      expect(rabbitWrapper.channel.sendToQueue).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Buffer),
        { persistent: true },
      );
    });

    it("should set expiration time to 15 minutes from now", async () => {
      // Create test product first
      await createTestProduct({
        productId: "product123",
        name: "Test Product",
        stock: 100,
      });

      const token = await getAuthToken();
      const beforeCreate = new Date();

      const orderData = {
        items: [
          {
            productId: "product123",
            productName: "Test Product",
            quantity: 1,
            price: 100,
          },
        ],
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(201);

      const afterCreate = new Date();
      const expiresAt = new Date(response.body.data.order.expiresAt);
      const expectedMinExpiry = new Date(
        beforeCreate.getTime() + 14 * 60 * 1000,
      );
      const expectedMaxExpiry = new Date(
        afterCreate.getTime() + 16 * 60 * 1000,
      );

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
        expectedMinExpiry.getTime(),
      );
      expect(expiresAt.getTime()).toBeLessThanOrEqual(
        expectedMaxExpiry.getTime(),
      );
    });

    it("should not create order without authentication", async () => {
      const orderData = {
        items: [
          {
            productId: "product123",
            productName: "Test Product",
            quantity: 1,
            price: 100,
          },
        ],
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
      };

      const response = await request(app)
        .post("/api/orders")
        .send(orderData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should not create order without items", async () => {
      const token = await getAuthToken();

      const orderData = {
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should not create order without shipping address", async () => {
      const token = await getAuthToken();

      const orderData = {
        items: [
          {
            productId: "product123",
            productName: "Test Product",
            quantity: 1,
            price: 100,
          },
        ],
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should not create order when product is not found", async () => {
      const token = await getAuthToken();

      const orderData = {
        items: [
          {
            productId: "nonexistent-product",
            productName: "Non-existent Product",
            quantity: 1,
            price: 100,
          },
        ],
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not found");
    });

    it("should not create order when product status is draft", async () => {
      // Create product with draft status
      await createTestProduct({
        productId: "draft-product",
        name: "Draft Product",
        status: ProductStatus.DRAFT,
        stock: 100,
      });

      const token = await getAuthToken();

      const orderData = {
        items: [
          {
            productId: "draft-product",
            productName: "Draft Product",
            quantity: 1,
            price: 100,
          },
        ],
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not available");
      expect(response.body.error).toContain("draft");
    });

    it("should not create order when product status is archived", async () => {
      // Create product with archived status
      await createTestProduct({
        productId: "archived-product",
        name: "Archived Product",
        status: ProductStatus.ARCHIVED,
        stock: 100,
      });

      const token = await getAuthToken();

      const orderData = {
        items: [
          {
            productId: "archived-product",
            productName: "Archived Product",
            quantity: 1,
            price: 100,
          },
        ],
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not available");
      expect(response.body.error).toContain("archived");
    });

    it("should not create order when product status is out_of_stock", async () => {
      // Create product with out_of_stock status
      await createTestProduct({
        productId: "out-of-stock-status-product",
        name: "Out of Stock Status Product",
        status: ProductStatus.OUT_OF_STOCK,
        stock: 0,
      });

      const token = await getAuthToken();

      const orderData = {
        items: [
          {
            productId: "out-of-stock-status-product",
            productName: "Out of Stock Status Product",
            quantity: 1,
            price: 100,
          },
        ],
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not available");
      expect(response.body.error).toContain("out_of_stock");
    });

    it("should not create order when product is out of stock", async () => {
      // Create product with zero stock
      await createTestProduct({
        productId: "out-of-stock-product",
        name: "Out of Stock Product",
        stock: 0,
      });

      const token = await getAuthToken();

      const orderData = {
        items: [
          {
            productId: "out-of-stock-product",
            productName: "Out of Stock Product",
            quantity: 1,
            price: 100,
          },
        ],
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Insufficient stock");
    });

    it("should not create order when requested quantity exceeds available stock", async () => {
      // Create product with limited stock
      await createTestProduct({
        productId: "limited-stock-product",
        name: "Limited Stock Product",
        stock: 5,
      });

      const token = await getAuthToken();

      const orderData = {
        items: [
          {
            productId: "limited-stock-product",
            productName: "Limited Stock Product",
            quantity: 10, // Requesting more than available
            price: 100,
          },
        ],
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Insufficient stock");
      expect(response.body.error).toContain("Available: 5");
      expect(response.body.error).toContain("Requested: 10");
    });

    it("should not create order when product has variants but no variant specified", async () => {
      // Create product with variants
      await createTestProduct({
        productId: "variant-product",
        name: "Variant Product",
        stock: 100,
        variants: [
          {
            name: "Size",
            value: "Small",
            stock: 50,
            price: 100,
          },
          {
            name: "Size",
            value: "Large",
            stock: 50,
            price: 120,
          },
        ],
      });

      const token = await getAuthToken();

      const orderData = {
        items: [
          {
            productId: "variant-product",
            productName: "Variant Product",
            quantity: 1,
            price: 100,
            // No variantId specified
          },
        ],
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain(
        "has variants but no variant was specified",
      );
    });

    it("should not create order when variant index is invalid", async () => {
      // Create product with variants
      await createTestProduct({
        productId: "variant-product-2",
        name: "Variant Product 2",
        stock: 100,
        variants: [
          {
            name: "Size",
            value: "Small",
            stock: 50,
            price: 100,
          },
        ],
      });

      const token = await getAuthToken();

      const orderData = {
        items: [
          {
            productId: "variant-product-2",
            productName: "Variant Product 2",
            quantity: 1,
            price: 100,
            variantId: "999", // Invalid variant index
            variantName: "Size:Small",
          },
        ],
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid variant");
    });

    it("should not create order when variant stock is insufficient", async () => {
      // Create product with variants
      await createTestProduct({
        productId: "variant-product-3",
        name: "Variant Product 3",
        stock: 100,
        variants: [
          {
            name: "Size",
            value: "Small",
            stock: 5, // Limited stock
            price: 100,
          },
        ],
      });

      const token = await getAuthToken();

      const orderData = {
        items: [
          {
            productId: "variant-product-3",
            productName: "Variant Product 3",
            quantity: 10, // Requesting more than available
            price: 100,
            variantId: "0",
            variantName: "Size:Small",
          },
        ],
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Insufficient stock");
      expect(response.body.error).toContain("Available: 5");
      expect(response.body.error).toContain("Requested: 10");
    });

    it("should not create order when variant index is negative", async () => {
      // Create product with variants
      await createTestProduct({
        productId: "variant-product-4",
        name: "Variant Product 4",
        stock: 100,
        variants: [
          {
            name: "Size",
            value: "Small",
            stock: 50,
            price: 100,
          },
        ],
      });

      const token = await getAuthToken();

      const orderData = {
        items: [
          {
            productId: "variant-product-4",
            productName: "Variant Product 4",
            quantity: 1,
            price: 100,
            variantId: "-1", // Negative index
            variantName: "Size:Small",
          },
        ],
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid variant");
    });

    it("should not create order when variant index is NaN", async () => {
      // Create product with variants
      await createTestProduct({
        productId: "variant-product-5",
        name: "Variant Product 5",
        stock: 100,
        variants: [
          {
            name: "Size",
            value: "Small",
            stock: 50,
            price: 100,
          },
        ],
      });

      const token = await getAuthToken();

      const orderData = {
        items: [
          {
            productId: "variant-product-5",
            productName: "Variant Product 5",
            quantity: 1,
            price: 100,
            variantId: "invalid", // Not a number
            variantName: "Size:Small",
          },
        ],
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid variant");
    });

    it("should not create order when multiple products have validation errors", async () => {
      // Create one valid product
      await createTestProduct({
        productId: "valid-product",
        name: "Valid Product",
        stock: 100,
      });

      // Don't create the other products - they will be missing

      const token = await getAuthToken();

      const orderData = {
        items: [
          {
            productId: "valid-product",
            productName: "Valid Product",
            quantity: 1,
            price: 100,
          },
          {
            productId: "missing-product",
            productName: "Missing Product",
            quantity: 1,
            price: 100,
          },
          {
            productId: "another-missing-product",
            productName: "Another Missing Product",
            quantity: 1,
            price: 100,
          },
        ],
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not found");
      // Should contain multiple error messages joined by semicolon
      expect(response.body.error.split(";").length).toBeGreaterThan(1);
    });

    it("should create order with valid variant product", async () => {
      // Create product with variants
      await createTestProduct({
        productId: "valid-variant-product",
        name: "Valid Variant Product",
        stock: 100,
        variants: [
          {
            name: "Size",
            value: "Small",
            stock: 50,
            price: 100,
          },
          {
            name: "Size",
            value: "Large",
            stock: 50,
            price: 120,
          },
        ],
      });

      const token = await getAuthToken();

      const orderData = {
        items: [
          {
            productId: "valid-variant-product",
            productName: "Valid Variant Product",
            quantity: 2,
            price: 100,
            variantId: "0",
            variantName: "Size:Small",
          },
        ],
        shippingAddress: {
          fullName: "Test User",
          phone: "+1234567890",
          address: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Test Country",
        },
        shippingCost: 10,
        tax: 5,
        discount: 0,
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.items).toHaveLength(1);
      expect(response.body.data.order.items[0].variantId).toBe("0");
      expect(response.body.data.order.items[0].variantName).toBe("Size:Small");
    });
  });
});
