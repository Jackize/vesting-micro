import apiClient from './client';

export const paymentApi = {
  createPayment: async (data: { token: string; orderId: string }) => {
    const response = await apiClient.post('/payments/create-payment', data);
    return response.data;
  },
};
