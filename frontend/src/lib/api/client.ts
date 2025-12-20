import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { userApi } from './userApi';

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
  (response) => {
    // Store request ID from gateway if present
    const requestId = response.headers['x-request-id'];
    if (requestId && typeof window !== 'undefined') {
      // Can be used for debugging/logging
      (response.config as any).requestId = requestId;
    }
    return response;
  },
  async (
    error: AxiosError<{ success?: boolean; message?: string; error?: string; code?: string }>
  ) => {
    const status = error.response?.status;
    // Handle rate limiting (429)
    if (status === 429) {
      return Promise.reject(
        new Error(error.response?.data?.message || 'Too many requests. Please try again later.')
      );
    }

    // Handle unauthorized (401)
    if (status === 401) {
      // debugger;
      // Try to refresh token
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        userApi
          .refreshToken(refreshToken)
          .then((res) => {
            Cookies.set('auth_token', res.accessToken, { expires: 7 });
          })
          .catch((err) => {
            console.log('err', err);
            if (typeof window !== 'undefined') {
              Cookies.remove('auth_token');
              Cookies.remove('refresh_token');
            }
          });
      } else {
        // If refresh token is not available, redirect to login
        if (typeof window !== 'undefined') {
          Cookies.remove('auth_token');
          Cookies.remove('refresh_token');
        }
      }
    }

    // Handle service unavailable (503)
    if (status === 503) {
      return Promise.reject(
        new Error(
          error.response?.data?.message ||
            'Service is temporarily unavailable. Please try again later.'
        )
      );
    }

    // Extract error message from response
    if (error.response?.data) {
      return Promise.reject(
        new Error(error.response.data.error || error.response.data.message || error.message)
      );
    }

    return Promise.reject(error);
  }
);

export default apiClient;
