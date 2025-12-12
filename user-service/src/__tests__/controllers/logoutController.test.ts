import request from "supertest";
import app from "../../app";
import { redisClient } from "../../config/redis";
import RefreshToken from "../../models/RefreshToken";
import TokenBlacklist from "../../models/TokenBlacklist";
import { IUser } from "../../models/User";
import { generateAccessToken } from "../../utils/jwt";
import { createTestUser, getAuthToken } from "../helpers/testHelpers";

describe("Logout Controller", () => {
  let user: IUser;
  let token: string;
  beforeAll(async () => {
    user = await createTestUser({
      email: "test@example.com",
      password: "password",
    });
    token = await getAuthToken(user);
  });

  beforeEach(async () => {
    const blacklistKey: string = `blacklist:${token}`;
    await redisClient.set(blacklistKey, "0");
  });

  it("should logout user from all sessions", async () => {
    const response = await request(app)
      .post("/api/users/logout")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sessionId: "all",
      });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Logged out from all sessions successfully",
    );
    const refreshToken = await RefreshToken.findOne({ userId: user.id });
    expect(refreshToken).toBeNull();
    const tokenBlacklist = await TokenBlacklist.findOne({ userId: user.id });
    expect(tokenBlacklist).not.toBeNull();
  });

  it("should not logout user without token", async () => {
    const response = await request(app)
      .post("/api/users/logout")
      .send({
        sessionId: "all",
      })
      .expect(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe(
      "Not authorized, user not found in request",
    );
  });

  it("should not logout user with invalid token", async () => {
    const response = await request(app)
      .post("/api/users/logout")
      .set("Authorization", `Bearer invalid-token`)
      .send({
        sessionId: "all",
      })
      .expect(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Invalid token");
  });

  it("should not logout user with expired token", async () => {
    const expiredToken = generateAccessToken(user.id, user.role, true);
    await request(app)
      .post("/api/users/logout")
      .set("Authorization", `Bearer ${expiredToken}`)
      .send({
        sessionId: "all",
      })
      .expect(200);
    const key = `blacklist:${expiredToken}`;
    const result = await redisClient.get(key);
    expect(result).toBe("1");
    const response = await request(app)
      .post("/api/users/logout")
      .set("Authorization", `Bearer ${expiredToken}`)
      .send({
        sessionId: "all",
      })
      .expect(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Token has been revoked");
  });

  it("should not logout user with invalid sessionId", async () => {
    const response = await request(app)
      .post("/api/users/logout")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sessionId: "invalid",
      })
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Session not found");
  });

  it("should not logout user with invalid refresh token", async () => {
    const response = await request(app)
      .post("/api/users/logout")
      .set("Authorization", `Bearer ${token}`)
      .send({
        refreshToken: "invalid",
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Logged out successfully");
    const refreshToken = await RefreshToken.findOne({ userId: user.id });
    expect(refreshToken).toBeNull();
    const tokenBlacklist = await TokenBlacklist.findOne({ userId: user.id });
    expect(tokenBlacklist).not.toBeNull();
  });
});
