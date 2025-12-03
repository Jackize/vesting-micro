import request from "supertest";
import app from "../../app";
import EmailVerificationToken from "../../models/EmailVerificationToken";
import User from "../../models/User";
import { createTestUser, getAuthToken } from "../helpers/testHelpers";
jest.mock("../../middleware/captcha", () => ({
  verifyCaptcha: jest.fn().mockImplementation((req, res, next) => {
    next();
  }),
}));
describe("Email Verification", () => {
  describe("GET /api/users/verify-email", () => {
    it("should verify email successfully", async () => {
      // register user
      await request(app)
        .post("/api/users/register")
        .send({
          email: "test@example.com",
          password: "Password123",
          firstName: "Test",
          lastName: "User",
          captchaToken: "1234567890",
        })
        .expect(201);
      // find user
      const user = await User.findOne({ email: "test@example.com" });
      expect(user).toBeDefined();
      expect(user?.isEmailVerified).toBe(false);
      // find verification token
      const verificationToken = await EmailVerificationToken.findOne({
        userId: user?._id?.toString(),
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
      const updatedUser = await User.findOne({ email: "test@example.com" });
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.isEmailVerified).toBe(true);
      // find updated verification token
      const updatedVerificationToken = await EmailVerificationToken.findOne({
        userId: updatedUser?._id?.toString(),
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
      await request(app)
        .post("/api/users/register")
        .send({
          email: "test@example.com",
          password: "Password123",
          firstName: "Test",
          lastName: "User",
          captchaToken: "1234567890",
        })
        .expect(201);
      const user = await User.findOne({ email: "test@example.com" });
      const verificationToken = await EmailVerificationToken.findOne({
        userId: user?.id?.toString(),
      });
      expect(verificationToken).toBeDefined();
      verificationToken!.expiresAt = new Date(Date.now() - 1000);
      await verificationToken!.save();
      const response = await request(app)
        .get(`/api/users/verify-email?token=${verificationToken?.token}`)
        .expect(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Verification token has expired");
    });

    it("Should not verify email with user not found", async () => {
      await request(app)
        .post("/api/users/register")
        .send({
          email: "test@example.com",
          password: "Password123",
          firstName: "Test",
          lastName: "User",
          captchaToken: "1234567890",
        })
        .expect(201);
      const user = await User.findOne({ email: "test@example.com" });
      expect(user).toBeDefined();
      expect(user?.isEmailVerified).toBe(false);
      //   delete user
      await User.deleteOne({ _id: user?._id });
      const verificationToken = await EmailVerificationToken.findOne({
        userId: user?._id?.toString(),
      });
      expect(verificationToken).toBeDefined();
      expect(verificationToken?.token).toBeDefined();
      expect(verificationToken?.expiresAt).toBeDefined();
      const response = await request(app)
        .get(`/api/users/verify-email?token=${verificationToken?.token}`)
        .expect(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("User not found");
    });

    it("Should not verify email with already verified user", async () => {
      await request(app)
        .post("/api/users/register")
        .send({
          email: "test@example.com",
          password: "Password123",
          firstName: "Test",
          lastName: "User",
          captchaToken: "1234567890",
        })
        .expect(201);
      const user = await User.findOne({ email: "test@example.com" });
      expect(user).toBeDefined();
      user!.isEmailVerified = true;
      await user!.save();
      const verificationToken = await EmailVerificationToken.findOne({
        userId: user?._id?.toString(),
      });
      expect(verificationToken).toBeDefined();
      expect(verificationToken?.token).toBeDefined();
      expect(verificationToken?.expiresAt).toBeDefined();
      const response = await request(app)
        .get(`/api/users/verify-email?token=${verificationToken?.token}`)
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Email is already verified");
    });
  });

  describe("POST /api/users/resend-verification", () => {
    it("Should resend verification email successfully", async () => {
      // register user
      await request(app)
        .post("/api/users/register")
        .send({
          email: "test@example.com",
          password: "Password123",
          firstName: "Test",
          lastName: "User",
          captchaToken: "1234567890",
        })
        .expect(201);
      //   verify that user is not verified
      const user = await User.findOne({ email: "test@example.com" });
      expect(user).toBeDefined();
      expect(user?.isEmailVerified).toBe(false);
      //   find verification token
      const verificationToken = await EmailVerificationToken.findOne({
        userId: user?._id?.toString(),
      });
      expect(verificationToken).toBeDefined();
      expect(verificationToken?.token).toBeDefined();
      expect(verificationToken?.expiresAt).toBeDefined();
      //    login user
      const loginResponse = await request(app)
        .post("/api/users/login")
        .send({
          email: "test@example.com",
          password: "Password123",
        })
        .expect(200);
      const accessToken = loginResponse.body.data.accessToken;
      //   resend verification email
      const response = await request(app)
        .post("/api/users/resend-verification")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Verification email sent successfully",
      );
      //   verify that verification token is deleted
      const updatedVerificationTokens = await EmailVerificationToken.find({
        userId: user?._id?.toString(),
      });
      expect(updatedVerificationTokens).toHaveLength(1);
    });

    it("Should not resend verification email with not found user", async () => {
      const user = await createTestUser();
      const accessToken = await getAuthToken(user);
      await User.deleteOne({ _id: user._id });
      const response = await request(app)
        .post("/api/users/resend-verification")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("User not found");
    });

    it("Should not resend verification email with already verified user", async () => {
      const user = await createTestUser();
      user!.isEmailVerified = true;
      await user!.save();
      const accessToken = await getAuthToken(user);
      const response = await request(app)
        .post("/api/users/resend-verification")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Email is already verified");
    });
  });
});
