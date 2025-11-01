import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { IUser } from '../../models/User';

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'test-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId }, secret as string, { expiresIn: expiresIn as string } as jwt.SignOptions);
};

export const createTestUser = async (userData?: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: 'user' | 'admin' | 'moderator';
}): Promise<IUser> => {
  const defaultUser = {
    email: `test${Math.random().toString(36).substring(7)}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: 'user' as const,
    ...userData,
  };

  const user = await User.create(defaultUser);
  return user;
};

export const createAdminUser = async (): Promise<IUser> => {
  return createTestUser({
    email: `admin${Math.random().toString(36).substring(7)}@example.com`,
    role: 'admin',
  });
};

export const getAuthToken = async (user?: IUser): Promise<string> => {
  const testUser = user || (await createTestUser());
  return generateToken((testUser._id as mongoose.Types.ObjectId).toString());
};

export const getAdminToken = async (): Promise<string> => {
  const admin = await createAdminUser();
  return generateToken((admin._id as mongoose.Types.ObjectId).toString());
};

export const validObjectId = (): string => {
  return new mongoose.Types.ObjectId().toString();
};

export const invalidObjectId = (): string => {
  return 'invalid-id';
};

