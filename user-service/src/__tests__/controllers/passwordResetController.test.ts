import request from "supertest";
import app from "../../app";
import { redisClient } from "../../config/redis";
import PasswordResetToken from "../../models/PasswordResetToken";
import User from "../../models/User";
import { checkRateLimitSendPasswordResetEmail } from "../../utils/blacklist";
import { createTestUser } from "../helpers/testHelpers";
jest.mock("../../middleware/captcha");
describe("PasswordResetController", () => {
  const testEmail = "test@example.com";
  const key = `rate_limit:send_password_reset_email:${testEmail}`;
  let user: any;
  beforeEach(async () => {
    await redisClient.set(key, "0");
    user = await createTestUser({
      email: testEmail,
      password: "Password@123",
    });
    await user.save();
  });
  describe("POST /api/users/forgot-password", () => {
    it("should return success if user does not exist", async () => {
      const response = await request(app)
        .post("/api/users/forgot-password")
        .send({ email: "test@example.com", captchaToken: "1234567890" });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "If an account with that email exists, a password reset link has been sent.",
      );
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      expect(token).toBeDefined();
      expect(token?.token).toBeDefined();
      expect(token?.expiresAt).toBeDefined();
    });

    it("should return success if user is not found", async () => {
      const response = await request(app)
        .post("/api/users/forgot-password")
        .send({ email: "test1@example.com", captchaToken: "1234567890" });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "If an account with that email exists, a password reset link has been sent.",
      );
    });

    it("Allows first 3 reset requests per hour per email", async () => {
      await expect(
        checkRateLimitSendPasswordResetEmail(testEmail),
      ).resolves.toBeUndefined();
      await expect(
        checkRateLimitSendPasswordResetEmail(testEmail),
      ).resolves.toBeUndefined();
      await expect(
        checkRateLimitSendPasswordResetEmail(testEmail),
      ).resolves.toBeUndefined();
      await expect(
        checkRateLimitSendPasswordResetEmail(testEmail),
      ).rejects.toThrow("Too many requests, please try again later");
    });
  });

  describe("GET /api/users/reset-password/?token=xxx", () => {
    it("should return error if token is not provided", async () => {
      const response = await request(app).get("/api/users/reset-password");
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Reset token is required");
    });

    it("should return error if token is not a string", async () => {
      const response = await request(app).get(
        "/api/users/reset-password?token=[1234567890]",
      );
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid or expired reset token");
    });

    it("should return error if token is not found", async () => {
      const token = PasswordResetToken.generateToken();
      const response = await request(app).get(
        `/api/users/reset-password?token=${token}`,
      );
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid or expired reset token");
    });

    it("should return error if token is expired", async () => {
      await request(app)
        .post("/api/users/forgot-password")
        .send({ email: "test@example.com", captchaToken: "1234567890" });
      const token = await PasswordResetToken.findOne({
        userId: user?.id,
      });
      token!.expiresAt = new Date(Date.now() - 1000);
      await token!.save();
      const response = await request(app).get(
        `/api/users/reset-password?token=${token!.token}`,
      );
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Reset token has expired");
    });

    it("should return error if token is already used", async () => {
      await request(app)
        .post("/api/users/forgot-password")
        .send({ email: testEmail, captchaToken: "1234567890" });
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      token!.used = true;
      await token!.save();
      const response = await request(app).get(
        `/api/users/reset-password?token=${token!.token}`,
      );
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Reset token has already been used");
    });

    it("should return success if token is valid", async () => {
      await request(app)
        .post("/api/users/forgot-password")
        .send({ email: testEmail, captchaToken: "1234567890" });
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      const response = await request(app).get(
        `/api/users/reset-password?token=${token!.token}`,
      );
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Reset token verified successfully");
    });
  });

  describe("POST /api/users/reset-password", () => {
    it("should return error if token is not provided", async () => {
      const response = await request(app).post("/api/users/reset-password");
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Reset token is required");
    });

    it("should return error if new password is not provided", async () => {
      const response = await request(app)
        .post("/api/users/reset-password")
        .send({ token: "1234567890" });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Token and new password are required");
    });

    it("should return error if new password is not a string", async () => {
      const response = await request(app)
        .post("/api/users/reset-password")
        .send({ token: "1234567890", newPassword: [1234567890] });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        "New password must contain at least one uppercase letter, one lowercase letter, and one number",
      );
    });

    it("should return error if new password is less than 6 characters", async () => {
      const response = await request(app)
        .post("/api/users/reset-password")
        .send({ token: "1234567890", newPassword: "Pa@1" });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        "New password must be at least 6 characters long",
      );
    });

    it("should return error if token not found", async () => {
      const response = await request(app)
        .post("/api/users/reset-password")
        .send({ token: "1234567890", newPassword: "Password@123" });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid or expired reset token");
    });

    it("should return error if the token is expired", async () => {
      await request(app)
        .post("/api/users/forgot-password")
        .send({ email: testEmail, captchaToken: "1234567890" });
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      token!.expiresAt = new Date(Date.now() - 1000);
      await token!.save();
      const response = await request(app)
        .post("/api/users/reset-password")
        .send({ token: token!.token, newPassword: "Password@1234" });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Reset token has expired");
    });

    it("should return error if the token already been used", async () => {
      await request(app)
        .post("/api/users/forgot-password")
        .send({ email: testEmail, captchaToken: "1234567890" });
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      token!.used = true;
      await token!.save();
      const response = await request(app)
        .post("/api/users/reset-password")
        .send({ token: token!.token, newPassword: "Password@1234" });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Reset token has already been used");
    });

    it("should return error if user is not found", async () => {
      await request(app)
        .post("/api/users/forgot-password")
        .send({ email: testEmail, captchaToken: "1234567890" });
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      await User.deleteOne({ _id: user?._id });
      const response = await request(app)
        .post("/api/users/reset-password")
        .send({
          token: token!.token,
          newPassword: "Password@1234",
        });
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("User not found");
    });

    it("should return error if new password is same as current password", async () => {
      await request(app)
        .post("/api/users/forgot-password")
        .send({ email: testEmail, captchaToken: "1234567890" });
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      const response = await request(app)
        .post("/api/users/reset-password")
        .send({ token: token!.token, newPassword: "Password@123" });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        "New password must be different from current password",
      );
    });

    it("should return success if new password is different from current password", async () => {
      await request(app)
        .post("/api/users/forgot-password")
        .send({ email: testEmail, captchaToken: "1234567890" });
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      const response = await request(app)
        .post("/api/users/reset-password")
        .send({ token: token!.token, newPassword: "Password@1234" });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Password reset successfully");
    });
  });
});
