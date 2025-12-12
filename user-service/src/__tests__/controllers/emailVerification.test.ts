import request from "supertest";
import app from "../../app";
import { redisClient } from "../../config/redis";
import EmailVerificationToken from "../../models/EmailVerificationToken";
import User from "../../models/User";
jest.mock("../../middleware/captcha");
describe("Email Verification", () => {
  const testEmail = "test@example.com";
  const resendVerificationEmailKey = `rate_limit:resend_verification_email:${testEmail}`;
  let user: any;
  beforeEach(async () => {
    await redisClient.set(resendVerificationEmailKey, "0");
    user = await request(app)
      .post("/api/users/register")
      .send({
        email: testEmail,
        password: "Password123",
        firstName: "Test",
        lastName: "User",
        captchaToken: "1234567890",
      })
      .expect(201);
    user = user.body.data.user;
  });
  describe("GET /api/users/verify-email", () => {
    it("should verify email successfully", async () => {
      // find verification token
      const verificationToken = await EmailVerificationToken.findOne({
        userId: user?.id,
      });
      expect(verificationToken).toBeDefined();
      expect(verificationToken?.token).toBeDefined();
      expect(verificationToken?.expiresAt).toBeDefined();
      // verify email
      const response = await request(app)
        .get(`/api/users/verify-email?token=${verificationToken?.token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Email verified successfully");
      // find updated user
      const updatedUser = await User.findOne({ email: testEmail });
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.isEmailVerified).toBe(true);
      // find updated verification token
      const updatedVerificationToken = await EmailVerificationToken.findOne({
        userId: user?.id,
      });
      // verify that verification token is deleted
      expect(updatedVerificationToken).toBeNull();
    });

    it("should not verify email with invalid token", async () => {
      const response = await request(app)
        .get("/api/users/verify-email?token=invalid-token")
        .expect(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid or expired verification token");
    });

    it("should not verify email with no token", async () => {
      const response = await request(app)
        .get("/api/users/verify-email")
        .expect(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Verification token is required");
    });

    it("should not verify email with expired token", async () => {
      // find verification token
      const verificationToken = await EmailVerificationToken.findOne({
        userId: user?.id,
      });
      expect(verificationToken).toBeDefined();
      //   set expiration to past
      verificationToken!.expiresAt = new Date(Date.now() - 1000);
      await verificationToken!.save();
      //   verify email
      const response = await request(app)
        .get(`/api/users/verify-email?token=${verificationToken?.token}`)
        .expect(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Verification token has expired");
    });

    it("Should not verify email with user not found", async () => {
      //   delete user
      await User.deleteOne({ _id: user?.id });
      //   find verification token
      const verificationToken = await EmailVerificationToken.findOne({
        userId: user?.id,
      });
      // assert that verification token is not deleted
      expect(verificationToken).toBeDefined();
      expect(verificationToken?.token).toBeDefined();
      expect(verificationToken?.expiresAt).toBeDefined();
      //   verify email
      const response = await request(app)
        .get(`/api/users/verify-email?token=${verificationToken?.token}`)
        .expect(404);
      //   assert that user is not found
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("User not found");
    });

    it("Should not verify email with already verified user", async () => {
      //   set user to verified
      const userSaved = await User.findOne({ email: testEmail });
      userSaved!.isEmailVerified = true;
      await userSaved!.save();
      //   find verification token
      const verificationToken = await EmailVerificationToken.findOne({
        userId: user?.id,
      });
      //   assert that verification token is not deleted
      expect(verificationToken).toBeDefined();
      expect(verificationToken?.token).toBeDefined();
      expect(verificationToken?.expiresAt).toBeDefined();
      //   verify email
      const response = await request(app)
        .get(`/api/users/verify-email?token=${verificationToken?.token}`)
        .expect(200);
      //   assert that user is verified
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Email is already verified");
    });
  });

  describe("POST /api/users/resend-verification", () => {
    it("Should resend verification email successfully", async () => {
      //   find verification token
      const verificationToken = await EmailVerificationToken.findOne({
        userId: user?.id,
      });
      expect(verificationToken).toBeDefined();
      expect(verificationToken?.token).toBeDefined();
      expect(verificationToken?.expiresAt).toBeDefined();
      //   set expiration to past
      verificationToken!.expiresAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      await verificationToken!.save();
      //   resend verification email
      const response = await request(app)
        .post("/api/users/resend-verification")
        .send({ email: testEmail });
      //   assert that verification email is sent successfully
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Verification email sent successfully",
      );
      //   verify that a new verification token was created
      const updatedVerificationTokens = await EmailVerificationToken.find({
        userId: user.id,
      });
      expect(updatedVerificationTokens).toHaveLength(1);
    });

    it("Should not resend verification email with not found user", async () => {
      const response = await request(app)
        .post("/api/users/resend-verification")
        .send({ email: "test1@example.com" })
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "If an account with that email exists, a verification email has been sent.",
      );
    });

    it("Should not resend verification email with already verified user", async () => {
      const userSaved = await User.findOne({ email: testEmail });
      userSaved!.isEmailVerified = true;
      await userSaved!.save();
      const response = await request(app)
        .post("/api/users/resend-verification")
        .send({ email: testEmail })
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Email is already verified");
    });

    it("Should not resend verification email with too many requests", async () => {
      await redisClient.set(resendVerificationEmailKey, "3");
      const response = await request(app)
        .post("/api/users/resend-verification")
        .send({ email: testEmail })
        .expect(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Too many requests");
    });

    it("Should not resend verification email with too soon since last send", async () => {
      await redisClient.set(resendVerificationEmailKey, "1");
      const response = await request(app)
        .post("/api/users/resend-verification")
        .send({ email: testEmail })
        .expect(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Please wait");
    });
  });
});
