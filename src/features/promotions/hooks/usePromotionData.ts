import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PromotionsApi } from '@/core/api/promotionsApi';
import {
  CreatePromotionInput,
  UpdatePromotionInput,
  ListPromotionsQueryParams,
} from '@/types';

export const PROMOTIONS_QUERY_KEYS = {
  LIST: (params?: ListPromotionsQueryParams) => ['promotions', 'list', params] as const,
  DETAIL: (id: string) => ['promotions', 'detail', id] as const,
  USAGES: (id: string) => ['promotions', 'usages', id] as const,
};

export const usePromotionsQuery = (params?: ListPromotionsQueryParams) => {
  return useQuery({
    queryKey: PROMOTIONS_QUERY_KEYS.LIST(params),
    queryFn: () => PromotionsApi.listPromotions(params),
    staleTime: 1000 * 30,
  });
};

export const usePromotionQuery = (id: string | null) => {
  return useQuery({
    queryKey: PROMOTIONS_QUERY_KEYS.DETAIL(id || ''),
    queryFn: () => PromotionsApi.getPromotionById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
};

export const usePromotionUsagesQuery = (id: string | null) => {
  return useQuery({
    queryKey: PROMOTIONS_QUERY_KEYS.USAGES(id || ''),
    queryFn: () => PromotionsApi.listUsages(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
};

export const useCreatePromotionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePromotionInput) => PromotionsApi.createPromotion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
};

export const useUpdatePromotionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePromotionInput }) =>
      PromotionsApi.updatePromotion(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({
        queryKey: PROMOTIONS_QUERY_KEYS.DETAIL(variables.id),
      });
    },
  });
};

export const useDeletePromotionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => PromotionsApi.deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
};

export const useTogglePromotionStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => PromotionsApi.toggleStatus(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({
        queryKey: PROMOTIONS_QUERY_KEYS.DETAIL(id),
      });
    },
  });
};
