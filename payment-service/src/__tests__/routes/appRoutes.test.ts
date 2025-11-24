import request from "supertest";
import app from "../../app";

jest.mock("../../config/stripe", () => ({
  stripe: {
    charges: {
      create: jest.fn().mockResolvedValue({ id: "ch_test_charge_id" }),
    },
  },
}));
describe("App Routes", () => {
  describe("GET /health", () => {
    it("should return health check status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Payment Service is running");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("environment");
    });
  });

  describe("GET /", () => {
    it("should return API information", async () => {
      const response = await request(app).get("/").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Payment Service API");
      expect(response.body.version).toBe("1.0.0");
      expect(response.body.endpoints).toHaveProperty("health");
      expect(response.body.endpoints).toHaveProperty("payments");
    });
  });

  describe("404 Not Found", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await request(app)
        .get("/non-existent-route")
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not found");
    });
  });
});
