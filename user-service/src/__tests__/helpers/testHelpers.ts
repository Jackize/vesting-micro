import mongoose from "mongoose";
import request from "supertest";
import app from "../../app";
import User, { IUser } from "../../models/User";
import { generateAccessToken } from "../../utils/jwt";

export const createTestUser = async (userData?: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: "user" | "admin" | "moderator";
}): Promise<IUser> => {
  const defaultUser = {
    email: `test${Math.random().toString(36).substring(7)}@example.com`,
    password: "Password@123",
    firstName: "Test",
    lastName: "User",
    role: "user" as const,
    isActive: true,
    isEmailVerified: true,
    ...userData,
  };

  const user = await User.create(defaultUser);
  return user;
};

export const createAdminUser = async (): Promise<IUser> => {
  return createTestUser({
    email: `admin${Math.random().toString(36).substring(7)}@example.com`,
    role: "admin",
  });
};

export const getAuthToken = async (user?: IUser): Promise<string> => {
  const testUser = user || (await createTestUser());
  return generateAccessToken(
    (testUser._id as mongoose.Types.ObjectId).toString(),
    testUser.role,
    testUser.isActive,
  );
};

export const getAdminToken = async (): Promise<string> => {
  const admin = await createAdminUser();
  return generateAccessToken(
    (admin._id as mongoose.Types.ObjectId).toString(),
    admin.role,
    admin.isActive,
  );
};

export const validObjectId = (): string => {
  return new mongoose.Types.ObjectId().toString();
};

export const invalidObjectId = (): string => {
  return "invalid-id";
};

export const loginUser = async (
  email: string,
  password: string,
): Promise<any> => {
  const response = await request(app)
    .post("/api/users/login")
    .send({ email, password });
  return response;
};
