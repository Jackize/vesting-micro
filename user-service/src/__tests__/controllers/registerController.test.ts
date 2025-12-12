import request from "supertest";
import app from "../../app";

jest.mock("../../middleware/captcha");
describe("Register Controller", () => {
  describe("POST /api/users/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        email: "newuser@example.com",
        password: "Password123",
        firstName: "John",
        lastName: "Doe",
        captchaToken: "1234567890",
      };

      const response = await request(app)
        .post("/api/users/register")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "User registered successfully. Please check your email to verify your account.",
      );
      expect(response.body.data.user).toHaveProperty("id");
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.firstName).toBe(userData.firstName);
      expect(response.body.data.user.lastName).toBe(userData.lastName);
      expect(response.body.data.user.role).toBe("user");
      expect(response.body.data.user.isEmailVerified).toBe(false);
      expect(response.body.data.user.isActive).toBe(false);
      expect(response.body.data.user).not.toHaveProperty("password");
    });

    it("should not register user with duplicate email", async () => {
      const userData = {
        email: "duplicate@example.com",
        password: "Password123",
        firstName: "John",
        lastName: "Doe",
      };

      // First registration
      await request(app).post("/api/users/register").send(userData).expect(201);

      // Second registration with same email
      const response = await request(app)
        .post("/api/users/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("already exists");
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/users/register")
        .send({
          email: "invalid-email",
          password: "123", // too short
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should validate email format", async () => {
      const response = await request(app)
        .post("/api/users/register")
        .send({
          email: "invalid-email",
          password: "password123",
          firstName: "John",
          lastName: "Doe",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should validate password length", async () => {
      const response = await request(app)
        .post("/api/users/register")
        .send({
          email: "test@example.com",
          password: "123",
          firstName: "John",
          lastName: "Doe",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should validate firstName and lastName", async () => {
      const response = await request(app)
        .post("/api/users/register")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
