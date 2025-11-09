import request from "supertest";
import app from "../../app";
import rabbitWrapper from "../../rabbitWrapper";
import { getAuthToken } from "../helpers/testHelpers";

// Use the shared mock from __mocks__ folder
jest.mock("../../rabbitWrapper");

describe("Create Order Controller", () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/orders", () => {
    it("should create order with valid data", async () => {
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
  });
});
