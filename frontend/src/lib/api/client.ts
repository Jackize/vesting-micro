import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ success?: boolean; error?: string }>) => {
    // Only redirect on 401 for protected routes, not for login/register
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint = requestUrl.includes('/login') || requestUrl.includes('/register');

      if (!isAuthEndpoint) {
        // Unauthorized on protected routes - clear token and redirect to login
        Cookies.remove('auth_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    // Extract error message from response
    if (error.response?.data) {
      const errorMessage =
        error.response.data.error || error.response.data.message || error.message;
      const customError = new Error(errorMessage);
      (customError as any).response = error.response;
      return Promise.reject(customError);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
