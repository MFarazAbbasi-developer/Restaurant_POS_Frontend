import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KitchenApi } from '@/core/api/kitchenApi';
import {
  KitchenQueueQueryParams,
  UpdateOrderKitchenStatusInput,
  UpdateItemKitchenStatusInput,
  RecallKitchenInput,
} from '@/types';

export const KITCHEN_QUERY_KEYS = {
  QUEUE: (params?: KitchenQueueQueryParams) => ['kitchen', 'queue', params] as const,
  STATIONS: ['kitchen', 'stations'] as const,
  PERFORMANCE: ['kitchen', 'performance'] as const,
  ORDER: (id: string) => ['kitchen', 'order', id] as const,
};

/**
 * Hook to retrieve and auto-poll active kitchen queue tickets
 */
export const useKitchenQueueQuery = (params?: KitchenQueueQueryParams) => {
  return useQuery({
    queryKey: KITCHEN_QUERY_KEYS.QUEUE(params),
    queryFn: () => KitchenApi.getKitchenQueue(params),
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 10, // Poll every 10 seconds for real-time kitchen responsiveness
  });
};

/**
 * Hook to retrieve all configured kitchen stations
 */
export const useKitchenStationsQuery = () => {
  return useQuery({
    queryKey: KITCHEN_QUERY_KEYS.STATIONS,
    queryFn: () => KitchenApi.listStations(),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to retrieve kitchen performance analytics
 */
export const useKitchenPerformanceQuery = () => {
  return useQuery({
    queryKey: KITCHEN_QUERY_KEYS.PERFORMANCE,
    queryFn: () => KitchenApi.getPerformance(),
    staleTime: 1000 * 20,
    refetchInterval: 1000 * 20,
  });
};

/**
 * Mutation hook to bump whole ticket order status (PREPARING -> READY -> SERVED)
 */
export const useUpdateOrderKitchenStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: UpdateOrderKitchenStatusInput;
    }) => KitchenApi.updateOrderStatus(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'tables'] });
      queryClient.invalidateQueries({ queryKey: ['takeaway'] });
      queryClient.invalidateQueries({ queryKey: ['delivery'] });
    },
  });
};

/**
 * Mutation hook to bump individual item kitchen status
 */
export const useUpdateItemKitchenStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      itemId,
      payload,
    }: {
      orderId: string;
      itemId: string;
      payload: UpdateItemKitchenStatusInput;
    }) => KitchenApi.updateItemStatus(orderId, itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'tables'] });
      queryClient.invalidateQueries({ queryKey: ['takeaway'] });
      queryClient.invalidateQueries({ queryKey: ['delivery'] });
    },
  });
};

/**
 * Mutation hook to recall a bumped order back to PREPARING
 */
export const useRecallKitchenOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload?: RecallKitchenInput;
    }) => KitchenApi.recallOrder(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'tables'] });
      queryClient.invalidateQueries({ queryKey: ['takeaway'] });
      queryClient.invalidateQueries({ queryKey: ['delivery'] });
    },
  });
};

/**
 * Mutation hook to recall an individual bumped item back to PREPARING
 */
export const useRecallKitchenItemMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      itemId,
      payload,
    }: {
      orderId: string;
      itemId: string;
      payload?: RecallKitchenInput;
    }) => KitchenApi.recallItem(orderId, itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'tables'] });
      queryClient.invalidateQueries({ queryKey: ['takeaway'] });
      queryClient.invalidateQueries({ queryKey: ['delivery'] });
    },
  });
};
