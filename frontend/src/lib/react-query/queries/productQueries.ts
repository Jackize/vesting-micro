import { productApi } from '@/lib/api/productApi';
import { ProductListParams } from '@/types/product';
import { useQuery } from '@tanstack/react-query';

// Query keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params?: ProductListParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  bySlug: (slug: string) => [...productKeys.details(), 'slug', slug] as const,
  byCategory: (category: string, params?: { page?: number; limit?: number }) =>
    [...productKeys.all, 'category', category, params] as const,
  search: (query: string, params?: { page?: number; limit?: number }) =>
    [...productKeys.all, 'search', query, params] as const,
  featured: (limit?: number) => [...productKeys.all, 'featured', limit] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
};

// Get all products
export const useProducts = (params?: ProductListParams) => {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productApi.getAllProducts(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Get product by ID
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productApi.getProductById(id),
    enabled: !!id,
  });
};

// Get product by slug
export const useProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: productKeys.bySlug(slug),
    queryFn: () => productApi.getProductBySlug(slug),
    enabled: !!slug,
  });
};

// Get products by category
export const useProductsByCategory = (
  category: string,
  params?: { page?: number; limit?: number }
) => {
  return useQuery({
    queryKey: productKeys.byCategory(category, params),
    queryFn: () => productApi.getProductsByCategory(category, params),
    enabled: !!category,
  });
};

// Search products
export const useSearchProducts = (query: string, params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: productKeys.search(query, params),
    queryFn: () => productApi.searchProducts(query, params),
    enabled: !!query && query.trim().length > 0,
  });
};

// Get featured products
export const useFeaturedProducts = (limit?: number) => {
  return useQuery({
    queryKey: productKeys.featured(limit),
    queryFn: () => productApi.getFeaturedProducts(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get all categories
export const useCategories = () => {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: () => productApi.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes (categories don't change often)
  });
};
