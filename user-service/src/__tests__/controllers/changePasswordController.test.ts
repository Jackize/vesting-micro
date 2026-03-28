import request from "supertest";
import app from "../../app";
import RefreshToken from "../../models/RefreshToken";
import {
  createTestUser,
  getAuthToken,
  loginUser,
} from "../helpers/testHelpers";

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
    await user.deleteOne();
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
    await loginUser(user.email, "Password@123");
    const refreshTokensBefore = await RefreshToken.findByUserId(user.id);
    expect(refreshTokensBefore.length).toBe(1);

    const response = await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Password@123", newPassword: "NewPassword123" });
    expect(response.status).toBe(200);

    const refreshTokensAfter = await RefreshToken.findByUserId(user.id);
    expect(refreshTokensAfter.length).toBe(0);
  });
});
