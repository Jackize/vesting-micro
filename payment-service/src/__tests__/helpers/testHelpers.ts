import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Helper to generate JWT token for testing
export const generateTestToken = (
  userId: string,
  role: string = "user",
  isActive: boolean = true,
): string => {
  const secret =
    process.env.JWT_SECRET || "test-super-secret-jwt-key-for-testing";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign({ userId, role, status: isActive }, secret, {
    expiresIn,
  } as jwt.SignOptions);
};

export const getAdminToken = (): string => {
  const userId = new mongoose.Types.ObjectId().toString();
  return generateTestToken(userId, "admin", true);
};

export const getUserToken = (userId?: string): string => {
  const id = userId || new mongoose.Types.ObjectId().toString();
  return generateTestToken(id, "user", true);
};

export const validObjectId = (): string => {
  return new mongoose.Types.ObjectId().toString();
};

export const invalidObjectId = (): string => {
  return "invalid-id";
};
