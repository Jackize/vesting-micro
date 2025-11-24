import { paymentApi } from '@/lib/api/paymentApi';
import { CreatePayment } from '@/types/payment';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderKeys } from './orderQueries';

// Query key
export const paymentKeys = {
  all: ['payments'],
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePayment) => paymentApi.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
};
