import { CreateOrderInput, CreateOrderResponse, Order } from '@/types/order';
import apiClient from './client';

export const orderApi = {
  // Create a new order
  createOrder: async (data: CreateOrderInput): Promise<Order> => {
    const response = await apiClient.post<{ success: true; data: CreateOrderResponse }>(
      '/orders',
      data
    );
    return response.data.data.order;
  },

  // Get order by ID
  getOrderById: async (id: string): Promise<Order> => {
    const response = await apiClient.get<{ success: true; data: { order: Order } }>(
      `/orders/${id}`
    );
    return response.data.data.order;
  },

  // Get user's orders
  getUserOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
  }): Promise<{ orders: Order[]; pagination: any }> => {
    const response = await apiClient.get<{
      success: true;
      data: { orders: Order[]; pagination: any };
    }>('/orders', { params });
    return response.data.data;
  },

  // Cancel order
  cancelOrder: async (id: string): Promise<Order> => {
    const response = await apiClient.patch<{ success: true; data: { order: Order } }>(
      `/orders/${id}/cancel`
    );
    return response.data.data.order;
  },
};
