import request from "supertest";
import app from "../../app";
import PasswordResetToken from "../../models/PasswordResetToken";
import User from "../../models/User";
import { createTestUser } from "../helpers/testHelpers";

describe("PasswordResetController", () => {
  const testEmail = "test@example.com";
  let user: any;

  beforeEach(async () => {
    user = await createTestUser({ email: testEmail, password: "Password@123" });
  });

  describe("POST /api/users/forgot-password", () => {
    it("should create reset token if user exists", async () => {
      const response = await request(app)
        .post("/api/users/forgot-password")
        .send({ email: testEmail });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      expect(token).toBeDefined();
      expect(token?.token).toBeDefined();
    });

    it("should return success if user is not found (no enumeration)", async () => {
      const response = await request(app)
        .post("/api/users/forgot-password")
        .send({ email: "nonexistent@example.com" });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /api/users/reset-password/?token=xxx", () => {
    it("should return error if token is not provided", async () => {
      const response = await request(app).get("/api/users/reset-password");
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Reset token is required");
    });

    it("should return error if token has wrong length", async () => {
      const response = await request(app).get(
        "/api/users/reset-password?token=[1234567890]",
      );
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid or expired reset token");
    });

    it("should return error if token is not found", async () => {
      const token = PasswordResetToken.generateToken();
      const response = await request(app).get(
        `/api/users/reset-password?token=${token}`,
      );
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid or expired reset token");
    });

    it("should return error if token is expired", async () => {
      await request(app)
        .post("/api/users/forgot-password")
        .send({ email: testEmail });
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      token!.expiresAt = new Date(Date.now() - 1000);
      await token!.save();
      const response = await request(app).get(
        `/api/users/reset-password?token=${token!.token}`,
      );
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Reset token has expired");
    });

    it("should return error if token is already used", async () => {
      await request(app)
        .post("/api/users/forgot-password")
        .send({ email: testEmail });
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      token!.used = true;
      await token!.save();
      const response = await request(app).get(
        `/api/users/reset-password?token=${token!.token}`,
      );
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Reset token has already been used");
    });

    it("should return success if token is valid", async () => {
      await request(app)
        .post("/api/users/forgot-password")
        .send({ email: testEmail });
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      const response = await request(app).get(
        `/api/users/reset-password?token=${token!.token}`,
      );
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Reset token verified successfully");
    });
  });

  describe("POST /api/users/reset-password", () => {
    it("should return error if token is not provided", async () => {
      const response = await request(app).post("/api/users/reset-password");
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Reset token is required");
    });

    it("should return error if token is not found", async () => {
      const response = await request(app)
        .post("/api/users/reset-password")
        .send({ token: "1234567890", newPassword: "Password@123" });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid or expired reset token");
    });

    it("should return error if the token is expired", async () => {
      await request(app)
        .post("/api/users/forgot-password")
        .send({ email: testEmail });
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      token!.expiresAt = new Date(Date.now() - 1000);
      await token!.save();
      const response = await request(app)
        .post("/api/users/reset-password")
        .send({ token: token!.token, newPassword: "Password@1234" });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Reset token has expired");
    });

    it("should return error if the token already been used", async () => {
      await request(app)
        .post("/api/users/forgot-password")
        .send({ email: testEmail });
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      token!.used = true;
      await token!.save();
      const response = await request(app)
        .post("/api/users/reset-password")
        .send({ token: token!.token, newPassword: "Password@1234" });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Reset token has already been used");
    });

    it("should return error if user is not found", async () => {
      await request(app)
        .post("/api/users/forgot-password")
        .send({ email: testEmail });
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      await User.deleteOne({ _id: user?._id });
      const response = await request(app)
        .post("/api/users/reset-password")
        .send({ token: token!.token, newPassword: "Password@1234" });
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User not found");
    });

    it("should return error if new password is same as current password", async () => {
      await request(app)
        .post("/api/users/forgot-password")
        .send({ email: testEmail });
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      const response = await request(app)
        .post("/api/users/reset-password")
        .send({ token: token!.token, newPassword: "Password@123" });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "New password must be different from current password",
      );
    });

    it("should reset password successfully", async () => {
      await request(app)
        .post("/api/users/forgot-password")
        .send({ email: testEmail });
      const token = await PasswordResetToken.findOne({ userId: user?.id });
      const response = await request(app)
        .post("/api/users/reset-password")
        .send({ token: token!.token, newPassword: "Password@1234" });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Password reset successfully");
    });
  });
});
