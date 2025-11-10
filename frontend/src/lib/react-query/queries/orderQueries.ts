import { orderApi } from '@/lib/api/orderApi';
import { CreateOrderInput } from '@/types/order';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

// Query keys
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  userOrders: (params?: any) => [...orderKeys.all, 'user', params] as const,
};

// Get order by ID
export const useOrder = (id: string) => {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => orderApi.getOrderById(id),
    enabled: !!id,
  });
};

// Get user's orders
export const useUserOrders = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
}) => {
  return useQuery({
    queryKey: orderKeys.userOrders(params),
    queryFn: () => orderApi.getUserOrders(params),
  });
};

// Create order mutation
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateOrderInput) => orderApi.createOrder(data),
    onSuccess: (order) => {
      // Invalidate user orders to refetch
      queryClient.invalidateQueries({ queryKey: orderKeys.userOrders() });
      // Optionally redirect to order confirmation page
      // router.push(`/orders/${order.id}`);
    },
    onError: (error: any) => {
      // Error handling is done in the API client interceptor
      // If 401, it will automatically redirect to login
      console.error('Failed to create order:', error);
    },
  });
};

// Cancel order mutation
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => orderApi.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
};
