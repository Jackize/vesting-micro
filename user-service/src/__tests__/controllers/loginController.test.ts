import request from "supertest";
import app from "../../app";
import LoginHistory from "../../models/LoginHistory";
import { createTestUser, loginUser } from "../helpers/testHelpers";
jest.mock("../../middleware/captcha");
describe("Login Controller", () => {
  describe("POST /api/users/login", () => {
    let user: any;

    beforeEach(async () => {
      user = await createTestUser({
        email: "loginuser@example.com",
        password: "password123",
      });
      user.isEmailVerified = true;
      user.isActive = true;
      await user.save();
    });

    it("should login user with valid credentials", async () => {
      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: "loginuser@example.com",
          password: "password123",
          captchaToken: "1234567890",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Login successful");
      expect(response.body.data.user.email).toBe("loginuser@example.com");
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");
      expect(response.body.data.user).not.toHaveProperty("password");
    });

    it("should lock account after too many failed login attempts", async () => {
      const res1 = await loginUser("loginuser@example.com", "wrongpassword");
      expect(res1.status).toBe(401);

      const res2 = await loginUser("loginuser@example.com", "wrongpassword");
      expect(res2.status).toBe(401);

      const res3 = await loginUser("loginuser@example.com", "wrongpassword");
      expect(res3.status).toBe(423);
      expect(res3.body.error).toContain("Too many failed login attempts");

      const res4 = await loginUser("loginuser@example.com", "password123");
      expect(res4.status).toBe(423);
      expect(res4.body.error).toContain("Account is temporarily locked.");
    });

    it("should send suspicious login alert if login is from different IP", async () => {
      const res1 = await loginUser(
        "loginuser@example.com",
        "password123",
        "1234567890",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "127.0.0.1",
      );
      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);

      const res2 = await loginUser(
        "loginuser@example.com",
        "password123",
        "1234567890",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "127.0.0.2",
      );
      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);

      const record = await LoginHistory.findOne({
        userId: user._id,
        ip: "127.0.0.2",
      });
      expect(record?.suspicious).toBe(true);
      expect(record?.suspiciousReasons).toContain("New IP address");
    });

    it("should send suspicious login alert if login is from different device", async () => {
      const res1 = await loginUser(
        "loginuser@example.com",
        "password123",
        "1234567890",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "127.0.0.1",
      );
      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);

      const res2 = await loginUser(
        "loginuser@example.com",
        "password123",
        "1234567890",
        "Google Chrome / mobile",
        "127.0.0.1",
      );
      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);

      const record = await LoginHistory.findOne({
        userId: user._id,
        deviceType: "mobile",
      });
      expect(record?.suspicious).toBe(true);
      expect(record?.suspiciousReasons).toContain("New device");
    });
    it("should not login with invalid email", async () => {
      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: "wrong@example.com",
          password: "password123",
          captchaToken: "1234567890",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid email or password");
    });

    it("should not login with invalid password", async () => {
      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: "loginuser@example.com",
          password: "wrongpassword",
          captchaToken: "1234567890",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid email or password");
    });

    it("should not login inactive user", async () => {
      user.isActive = false;
      await user.save();

      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: "loginuser@example.com",
          password: "password123",
          captchaToken: "1234567890",
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("deactivated");
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: "loginuser@example.com",
          captchaToken: "1234567890",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should validate email format", async () => {
      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: "invalid-email",
          password: "password123",
          captchaToken: "1234567890",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
