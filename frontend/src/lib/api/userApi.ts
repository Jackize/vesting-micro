import apiClient from './client';
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  User,
  UserListResponse,
} from '@/types/user';

export const userApi = {
  // Register
  register: async (data: RegisterInput): Promise<{ user: User; token: string }> => {
    const response = await apiClient.post('/users/register', data);
    return response.data.data;
  },

  // Login
  login: async (data: LoginInput): Promise<{ user: User; token: string }> => {
    const response = await apiClient.post('/users/login', data);
    return response.data.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/users/me');
    return response.data.data.user;
  },

  // Update profile
  updateProfile: async (data: UpdateProfileInput): Promise<User> => {
    const response = await apiClient.put('/users/me', data);
    return response.data.data.user;
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.data.user;
  },

  // Get all users (admin)
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
  }): Promise<UserListResponse> => {
    const response = await apiClient.get('/users', { params });
    return response.data.data;
  },

  // Delete user (admin)
  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
