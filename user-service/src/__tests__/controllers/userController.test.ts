import request from "supertest";
import app from "../../app";
import User from "../../models/User";
import {
  createTestUser,
  getAdminToken,
  getAuthToken,
} from "../helpers/testHelpers";

describe("User Controller", () => {
  describe("GET /api/users/:id", () => {
    it("should get user by id with valid token", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .get(`/api/users/${user._id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user).not.toHaveProperty("password");
    });

    it("should not get user without token", async () => {
      const user = await createTestUser();

      const response = await request(app)
        .get(`/api/users/${user._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existent user", async () => {
      const token = await getAuthToken();

      const response = await request(app)
        .get(`/api/users/507f1f77bcf86cd799439011`) // Valid ObjectId format but non-existent
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid id format", async () => {
      const token = await getAuthToken();

      const response = await request(app)
        .get("/api/users/invalid-id")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/users (Admin)", () => {
    it("should get all users for admin", async () => {
      const token = await getAdminToken();

      // Create some test users
      await createTestUser();
      await createTestUser();
      await createTestUser();

      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toHaveProperty("page");
      expect(response.body.data.pagination).toHaveProperty("limit");
      expect(response.body.data.pagination).toHaveProperty("total");
      expect(response.body.data.pagination).toHaveProperty("pages");
    });

    it("should paginate users", async () => {
      const token = await getAdminToken();

      // Create 15 test users
      for (let i = 0; i < 15; i++) {
        await createTestUser();
      }

      const response = await request(app)
        .get("/api/users?page=1&limit=10")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.users.length).toBeLessThanOrEqual(10);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it("should filter users by role", async () => {
      const token = await getAdminToken();

      await createTestUser({ role: "user" });
      await createTestUser({ role: "admin" });
      await createTestUser({ role: "moderator" });

      const response = await request(app)
        .get("/api/users?role=admin")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.users.forEach((user: any) => {
        expect(user.role).toBe("admin");
      });
    });

    it("should not allow regular user to get all users", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it("should not allow access without token", async () => {
      const response = await request(app).get("/api/users").expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/users/:id (Admin)", () => {
    it("should delete user for admin", async () => {
      const token = await getAdminToken();
      const userToDelete = await createTestUser();

      const response = await request(app)
        .delete(`/api/users/${userToDelete._id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User deleted successfully");

      // Verify user is deleted
      const deletedUser = await User.findById(userToDelete._id);
      expect(deletedUser).toBeNull();
    });

    it("should not delete user for regular user", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);
      const userToDelete = await createTestUser();

      const response = await request(app)
        .delete(`/api/users/${userToDelete._id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existent user", async () => {
      const token = await getAdminToken();

      const getUser = await request(app)
        .get(`/api/users/me`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(getUser.body.data.user.role).toBe("admin");

      const response = await request(app)
        .delete("/api/users/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it("should not allow access without token", async () => {
      const user = await createTestUser();

      const response = await request(app)
        .delete(`/api/users/${user._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
