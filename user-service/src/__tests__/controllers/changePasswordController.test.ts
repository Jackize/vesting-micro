import request from "supertest";
import app from "../../app";
import RefreshToken from "../../models/RefreshToken";
import User from "../../models/User";
import { createTestUser, getAuthToken } from "../helpers/testHelpers";
jest.mock("../../middleware/captcha");
describe("Change Password Controller", () => {
  it("should change password successfully", async () => {
    const user = await createTestUser();
    const token = await getAuthToken(user);
    const response = await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Password@123", newPassword: "NewPassword123" });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Password changed successfully. All sessions have been logged out.",
    );
  });

  it("should not change password with user not found", async () => {
    const user = await createTestUser();
    const token = await getAuthToken(user);
    await User.deleteOne({ _id: user._id });
    const response = await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Password@123", newPassword: "NewPassword123" });
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("User not found");
  });

  it("should not change password with invalid current password", async () => {
    const user = await createTestUser();
    const token = await getAuthToken(user);
    const response = await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "invalid", newPassword: "NewPassword123" });
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Invalid current password");
  });

  it("should not change password but lock account if too many failed attempts", async () => {
    const user = await createTestUser();
    const token = await getAuthToken(user);
    await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "invalid", newPassword: "NewPassword123" });
    await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "invalid", newPassword: "NewPassword123" });
    const responseTooThirdAttempt = await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "invalid", newPassword: "NewPassword123" });
    expect(responseTooThirdAttempt.status).toBe(423);
    expect(responseTooThirdAttempt.body.success).toBe(false);
    expect(responseTooThirdAttempt.body.error).toBe(
      "Too many failed change password attempts. Account locked for 60 second(s).",
    );
    const response = await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "invalid", newPassword: "NewPassword123" });
    expect(response.status).toBe(423);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe(
      "Account is temporarily locked. Please try again in 60 second(s).",
    );
  });

  it("should allow changing password if account is not locked", async () => {
    const user = await createTestUser();
    const token = await getAuthToken(user);
    await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "invalid", newPassword: "NewPassword123" });
    await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "invalid", newPassword: "NewPassword123" });
    const responseTooThirdAttempt = await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "invalid", newPassword: "NewPassword123" });
    expect(responseTooThirdAttempt.status).toBe(423);
    expect(responseTooThirdAttempt.body.success).toBe(false);
    expect(responseTooThirdAttempt.body.error).toBe(
      "Too many failed change password attempts. Account locked for 60 second(s).",
    );
    const userLock = await User.findById(user._id);
    userLock!.accountLockedUntil = new Date(Date.now() - 500); // Unlock account
    await userLock!.save();
    const response = await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Password@123", newPassword: "NewPassword123" });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    const userLockAfterChange = await User.findById(user._id);
    expect(userLockAfterChange?.accountLockedUntil).toBeNull();
    expect(userLockAfterChange?.failedLoginAttempts).toBe(0);
    expect(userLockAfterChange?.lockoutLevel).toBe(0);
  });

  it("should not change password if new password is same as current password", async () => {
    const user = await createTestUser();
    const token = await getAuthToken(user);
    const response = await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Password@123", newPassword: "Password@123" });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe(
      "New password must be different from current password",
    );
  });

  it("should delete all refresh tokens after changing password", async () => {
    const user = await createTestUser();
    const token = await getAuthToken(user);
    await request(app)
      .post("/api/users/login")
      .send({
        email: user.email,
        password: "Password@123",
        captchaToken: "1234567890",
      })
      .expect(200);
    const refreshTokens = await RefreshToken.findByUserId(user.id);
    expect(refreshTokens.length).toBe(1);
    const response = await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Password@123", newPassword: "NewPassword123" });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // check the old refresh tokens are available to be used
    const refreshTokenAfterChange = await RefreshToken.findByUserId(user.id);
    expect(refreshTokenAfterChange.length).toBe(0);
  });
});
