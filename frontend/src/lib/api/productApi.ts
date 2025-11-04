import { Product, ProductListParams, ProductListResponse } from '@/types/product';
import apiClient from './client';

export const productApi = {
  // Get all products
  getAllProducts: async (params?: ProductListParams): Promise<ProductListResponse> => {
    const response = await apiClient.get('/products', { params });
    return response.data.data;
  },

  // Get product by ID
  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data.data.product;
  },

  // Get product by slug
  getProductBySlug: async (slug: string): Promise<Product> => {
    const response = await apiClient.get(`/products/slug/${slug}`);
    return response.data.data.product;
  },

  // Get products by category
  getProductsByCategory: async (
    category: string,
    params?: { page?: number; limit?: number }
  ): Promise<ProductListResponse> => {
    const response = await apiClient.get(`/products/category/${category}`, { params });
    return response.data.data;
  },

  // Search products
  searchProducts: async (
    query: string,
    params?: { page?: number; limit?: number }
  ): Promise<ProductListResponse & { query: string }> => {
    const response = await apiClient.get('/products/search', {
      params: { q: query, ...params },
    });
    return response.data.data;
  },

  // Get featured products
  getFeaturedProducts: async (limit?: number): Promise<{ products: Product[] }> => {
    const response = await apiClient.get('/products/featured', {
      params: limit ? { limit } : undefined,
    });
    return response.data.data;
  },

  // Get all categories
  getCategories: async (): Promise<{ categories: string[] }> => {
    const response = await apiClient.get('/products/categories');
    return response.data.data;
  },
};
