import request from "supertest";
import app from "../../app";
import RefreshToken from "../../models/RefreshToken";
import { IUser } from "../../models/User";
import {
  createTestUser,
  getAuthToken,
  loginUser,
} from "../helpers/testHelpers";

describe("Logout Controller", () => {
  let user: IUser;
  let token: string;

  beforeEach(async () => {
    user = await createTestUser({
      email: "test@example.com",
      password: "Password@123",
    });
    token = await getAuthToken(user);
  });

  it("should logout user successfully", async () => {
    const loginRes = await loginUser("test@example.com", "Password@123");
    expect(loginRes.status).toBe(200);
    const { refreshToken } = loginRes.body.data;

    const response = await request(app)
      .post("/api/users/logout")
      .set("Authorization", `Bearer ${token}`)
      .send({ refreshToken })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Logged out successfully");

    const stored = await RefreshToken.findByToken(refreshToken);
    expect(stored).toBeNull();
  });

  it("should logout successfully even without a refresh token", async () => {
    const response = await request(app)
      .post("/api/users/logout")
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  it("should not logout without auth token", async () => {
    const response = await request(app)
      .post("/api/users/logout")
      .send({})
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  it("should not logout with invalid auth token", async () => {
    const response = await request(app)
      .post("/api/users/logout")
      .set("Authorization", "Bearer invalid-token")
      .send({})
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});
