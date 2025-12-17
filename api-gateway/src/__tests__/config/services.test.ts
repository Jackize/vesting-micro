import { getServiceByRoute, services } from "../../config/services";

describe("Service Configuration", () => {
  describe("getServiceByRoute", () => {
    it("should return user service for /api/users route", () => {
      const service = getServiceByRoute("/api/users/login");
      expect(service).toBeDefined();
      expect(service?.name).toBe("user-service");
    });

    it("should return product service for /api/products route", () => {
      const service = getServiceByRoute("/api/products/123");
      expect(service).toBeDefined();
      expect(service?.name).toBe("product-service");
    });

    it("should return order service for /api/orders route", () => {
      const service = getServiceByRoute("/api/orders");
      expect(service).toBeDefined();
      expect(service?.name).toBe("order-service");
    });

    it("should return payment service for /api/payments route", () => {
      const service = getServiceByRoute("/api/payments/checkout");
      expect(service).toBeDefined();
      expect(service?.name).toBe("payment-service");
    });

    it("should return null for unknown route", () => {
      const service = getServiceByRoute("/api/unknown");
      expect(service).toBeNull();
    });
  });

  describe("services configuration", () => {
    it("should have all required services", () => {
      expect(services.users).toBeDefined();
      expect(services.products).toBeDefined();
      expect(services.orders).toBeDefined();
      expect(services.payments).toBeDefined();
    });

    it("should have URLs for all services", () => {
      expect(services.users.url).toBeDefined();
      expect(services.products.url).toBeDefined();
      expect(services.orders.url).toBeDefined();
      expect(services.payments.url).toBeDefined();
    });
  });
});
