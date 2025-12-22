import { userApi } from '@/lib/api/userApi';
import { useAuthStore } from '@/lib/store/authStore';
import { ChangePasswordInput, LoginInput, RegisterInput, UpdateProfileInput } from '@/types/user';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';

// Query keys
export const userKeys = {
  all: ['users'] as const,
  current: () => [...userKeys.all, 'current'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
  list: (filters?: Record<string, unknown>) => [...userKeys.all, 'list', filters] as const,
};

// Get current user
export const useCurrentUser = () => {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: userApi.getCurrentUser,
    enabled: !!Cookies.get('auth_token'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true, // Always refetch on mount to ensure fresh data
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};

// Get user by ID
export const useUser = (id: string) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userApi.getUserById(id),
    enabled: !!id,
  });
};

// Get all users (admin)
export const useUsers = (params?: {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
}) => {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userApi.getAllUsers(params),
  });
};

// Register mutation
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterInput) => userApi.register(data),
    onSuccess: async (data) => {
      // Save token to cookie
      Cookies.set('auth_token', data.accessToken, {
        expires: new Date(Date.now() + 15 * 60 * 1000),
      }); // 15 minutes
      Cookies.set('refresh_token', data.refreshToken, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }); // 7 days
      // Invalidate and refetch current user to get full data from API
      // This ensures we get all fields (phone, isActive, etc.)
      await queryClient.invalidateQueries({ queryKey: userKeys.current() });
      await queryClient.refetchQueries({ queryKey: userKeys.current() });
    },
  });
};

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  return useMutation({
    mutationFn: (data: LoginInput) => userApi.login(data),
    onSuccess: async (data) => {
      setUser(data.user);
      setToken(data.accessToken);
      // Save token to cookie
      Cookies.set('auth_token', data.accessToken, { expires: 7 }); // 7 days
      Cookies.set('refresh_token', data.refreshToken, { expires: 7 }); // 7 days
      // Invalidate and refetch current user to get full data from API
      // This ensures we get all fields (phone, isActive, etc.)
      await queryClient.invalidateQueries({ queryKey: userKeys.current() });
      await queryClient.refetchQueries({ queryKey: userKeys.current() });
    },
  });
};

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileInput) => userApi.updateProfile(data),
    onSuccess: (user) => {
      // Update current user in cache
      queryClient.setQueryData(userKeys.current(), user);
      // Invalidate user list to refresh
      queryClient.invalidateQueries({ queryKey: userKeys.list() });
    },
  });
};

// Delete user mutation (admin)
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userApi.deleteUser(id),
    onSuccess: () => {
      // Invalidate user list
      queryClient.invalidateQueries({ queryKey: userKeys.list() });
    },
  });
};

// Resend verification email mutation
export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: (email: string) => userApi.resendVerificationEmail(email),
  });
};

// Change password mutation
export const useChangePassword = () => {
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: (data: ChangePasswordInput) => userApi.changePassword(data),
    onSuccess: () => {
      // After password change, all sessions are logged out on backend
      // Clear tokens and logout user
      Cookies.remove('auth_token');
      Cookies.remove('refresh_token');
      logout();
    },
  });
};

// Forgot password mutation
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: { email: string; captchaToken: string }) => userApi.forgotPassword(data),
  });
};

// Verify token for reset password (query, not mutation)
export const useVerifyTokenResetPassword = (token: string | null) => {
  return useQuery({
    queryKey: ['reset-password-token', token],
    queryFn: () => userApi.verifyTokenResetPassword(token!),
    enabled: !!token && token.length === 64,
    retry: false,
  });
};

// Reset password mutation
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: { token: string; newPassword: string; captchaToken: string }) =>
      userApi.resetPassword(data),
  });
};
