import request from "supertest";
import app from "../../app";

describe("App Routes", () => {
  describe("GET /health", () => {
    it("should return health check status", async () => {
      const response = await request(app).get("/api/users/health").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User Service is running");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("environment");
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
