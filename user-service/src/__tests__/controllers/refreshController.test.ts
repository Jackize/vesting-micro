import request from "supertest";
import app from "../../app";
import User from "../../models/User";
import { createTestUser } from "../helpers/testHelpers";

jest.mock("../../middleware/captcha");
describe("Refresh Controller", () => {
  describe("POST /api/users/refresh", () => {
    let user: any;
    beforeEach(async () => {
      process.env.SKIP_CAPTCHA = "true";
      user = await createTestUser({
        email: "refreshuser@example.com",
        password: "password123",
      });
    });
    it("should refresh access token with valid refresh token", async () => {
      const loginResponse = await request(app)
        .post("/api/users/login")
        .send({
          email: user.email,
          password: "password123",
          captchaToken: "1234567890",
        })
        .expect(200);

      const response = await request(app)
        .post("/api/users/refresh")
        .send({ refreshToken: loginResponse.body.data.refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Token refreshed successfully");
      expect(response.body.data).toHaveProperty("accessToken");
    });

    it("should not refresh access token with invalid refresh token", async () => {
      const response = await request(app)
        .post("/api/users/refresh")
        .send({ refreshToken: "invalid-refresh-token" })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid refresh token");
    });

    it("should not refresh access token with expired refresh token", async () => {
      process.env.JWT_REFRESH_EXPIRES_IN = "-1s";
      const loginResponse = await request(app)
        .post("/api/users/login")
        .send({
          email: user.email,
          password: "password123",
          captchaToken: "1234567890",
        })
        .expect(200);
      const response = await request(app)
        .post("/api/users/refresh")
        .send({ refreshToken: loginResponse.body.data.refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Refresh token has expired");
      process.env.JWT_REFRESH_EXPIRES_IN = "30d";
    });

    it("should not refresh access token with invalid user", async () => {
      const loginResponse = await request(app)
        .post("/api/users/login")
        .send({
          email: user.email,
          password: "password123",
          captchaToken: "1234567890",
        })
        .expect(200);
      await User.deleteOne({ _id: user._id });
      const response = await request(app)
        .post("/api/users/refresh")
        .send({ refreshToken: loginResponse.body.data.refreshToken })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("User not found");
    });

    it("should not refresh access token with inactive user", async () => {
      const loginResponse = await request(app)
        .post("/api/users/login")
        .send({
          email: user.email,
          password: "password123",
          captchaToken: "1234567890",
        })
        .expect(200);
      await User.updateOne({ _id: user._id }, { isActive: false });
      const response = await request(app)
        .post("/api/users/refresh")
        .send({ refreshToken: loginResponse.body.data.refreshToken })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Account has been deactivated");
    });
  });
});
