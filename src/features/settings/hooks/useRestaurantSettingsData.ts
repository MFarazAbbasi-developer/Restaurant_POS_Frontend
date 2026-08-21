import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RestaurantApi } from '@/core/api/restaurantApi';
import { ReceiptsApi } from '@/core/api/receiptsApi';
import { UpdateRestaurantInput } from '@/types';
import { useAuthStore } from '@/core/auth/authStore';

export const SETTINGS_QUERY_KEYS = {
  RESTAURANT: ['restaurant', 'settings'] as const,
  RECEIPT_PREVIEW: (paperWidth: string) => ['receipts', 'preview', paperWidth] as const,
};

export const useRestaurantConfigQuery = () => {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEYS.RESTAURANT,
    queryFn: () => RestaurantApi.getRestaurant(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateRestaurantConfigMutation = () => {
  const queryClient = useQueryClient();
  const fetchMe = useAuthStore.getState().fetchMe;

  return useMutation({
    mutationFn: (payload: UpdateRestaurantInput) =>
      RestaurantApi.updateRestaurant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SETTINGS_QUERY_KEYS.RESTAURANT,
      });
      queryClient.invalidateQueries({ queryKey: ['receipts', 'preview'] });
      // Refresh auth store user session
      fetchMe();
    },
  });
};

export const useReceiptPreviewQuery = (paperWidth: '80mm' | '58mm' = '80mm') => {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEYS.RECEIPT_PREVIEW(paperWidth),
    queryFn: () => ReceiptsApi.getPreviewReceipt(paperWidth),
    staleTime: 1000 * 30,
  });
};
