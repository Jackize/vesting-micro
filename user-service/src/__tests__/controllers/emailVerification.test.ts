import request from "supertest";
import app from "../../app";
import EmailVerificationToken from "../../models/EmailVerificationToken";
import User from "../../models/User";

describe("Email Verification", () => {
  const testEmail = "test@example.com";
  let user: any;

  beforeEach(async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({
        email: testEmail,
        password: "Password123",
        firstName: "Test",
        lastName: "User",
      })
      .expect(201);
    user = res.body.data.user;
  });

  describe("GET /api/users/verify-email", () => {
    it("should verify email successfully", async () => {
      const verificationToken = await EmailVerificationToken.findOne({
        userId: user?.id,
      });
      expect(verificationToken).toBeDefined();

      const response = await request(app)
        .get(`/api/users/verify-email?token=${verificationToken?.token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Email verified successfully");

      const updatedUser = await User.findOne({ email: testEmail });
      expect(updatedUser?.isEmailVerified).toBe(true);

      const deletedToken = await EmailVerificationToken.findOne({
        userId: user?.id,
      });
      expect(deletedToken).toBeNull();
    });

    it("should not verify email with invalid token", async () => {
      const response = await request(app)
        .get("/api/users/verify-email?token=invalid-token")
        .expect(400);
      expect(response.body.error).toBe("Invalid or expired verification token");
    });

    it("should not verify email with no token", async () => {
      const response = await request(app)
        .get("/api/users/verify-email")
        .expect(400);
      expect(response.body.error).toBe("Verification token is required");
    });

    it("should not verify email with expired token", async () => {
      const verificationToken = await EmailVerificationToken.findOne({
        userId: user?.id,
      });
      verificationToken!.expiresAt = new Date(Date.now() - 1000);
      await verificationToken!.save();

      const response = await request(app)
        .get(`/api/users/verify-email?token=${verificationToken?.token}`)
        .expect(400);
      expect(response.body.error).toBe("Verification token has expired");
    });

    it("should not verify email when user is not found", async () => {
      await User.deleteOne({ _id: user?.id });
      const verificationToken = await EmailVerificationToken.findOne({
        userId: user?.id,
      });

      const response = await request(app)
        .get(`/api/users/verify-email?token=${verificationToken?.token}`)
        .expect(404);
      expect(response.body.error).toBe("User not found");
    });

    it("should return already verified if user is already verified", async () => {
      const userSaved = await User.findOne({ email: testEmail });
      userSaved!.isEmailVerified = true;
      await userSaved!.save();

      const verificationToken = await EmailVerificationToken.findOne({
        userId: user?.id,
      });
      const response = await request(app)
        .get(`/api/users/verify-email?token=${verificationToken?.token}`)
        .expect(200);
      expect(response.body.message).toBe("Email is already verified");
    });
  });

  describe("POST /api/users/resend-verification", () => {
    it("should resend verification email successfully when cooldown has passed", async () => {
      // Set the token's createdAt to 6 minutes ago so cooldown has elapsed
      const verificationToken = await EmailVerificationToken.findOne({
        userId: user?.id,
      });
      // Use raw collection to bypass Mongoose's immutable createdAt from timestamps
      await EmailVerificationToken.collection.updateOne(
        { _id: verificationToken!._id as any },
        { $set: { createdAt: new Date(Date.now() - 6 * 60 * 1000) } },
      );

      const response = await request(app)
        .post("/api/users/resend-verification")
        .send({ email: testEmail });

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Verification email sent successfully",
      );

      const tokens = await EmailVerificationToken.find({ userId: user.id });
      expect(tokens).toHaveLength(1);
    });

    it("should not resend verification email if sent too recently", async () => {
      // Token was just created (createdAt = now), so cooldown is active
      const response = await request(app)
        .post("/api/users/resend-verification")
        .send({ email: testEmail })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Please wait");
    });

    it("should return success for nonexistent user (no enumeration)", async () => {
      const response = await request(app)
        .post("/api/users/resend-verification")
        .send({ email: "nonexistent@example.com" })
        .expect(200);
      expect(response.body.success).toBe(true);
    });

    it("should return already verified for verified users", async () => {
      const userSaved = await User.findOne({ email: testEmail });
      userSaved!.isEmailVerified = true;
      await userSaved!.save();

      const response = await request(app)
        .post("/api/users/resend-verification")
        .send({ email: testEmail })
        .expect(200);
      expect(response.body.message).toBe("Email is already verified");
    });
  });
});
