import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TakeawayApi } from '@/core/api/takeawayApi';
import { UpdateTakeawayStatusInput, CancelTakeawayOrderInput } from '@/types';

export const TAKEAWAY_QUERY_KEYS = {
  QUEUE: ['takeaway', 'queue'] as const,
  ORDER: (id: string) => ['takeaway', 'order', id] as const,
};

/**
 * Hook to fetch and live-poll today's active takeaway queue
 */
export const useTakeawayQueueQuery = () => {
  return useQuery({
    queryKey: TAKEAWAY_QUERY_KEYS.QUEUE,
    queryFn: () => TakeawayApi.getActiveQueue(),
    staleTime: 1000 * 15, // 15s stale time
    refetchInterval: 1000 * 15, // Auto-poll every 15 seconds
  });
};

/**
 * Mutation hook to advance takeaway order status (PREPARING, READY, COMPLETED)
 */
export const useUpdateTakeawayStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: UpdateTakeawayStatusInput;
    }) => TakeawayApi.updateStatus(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAKEAWAY_QUERY_KEYS.QUEUE });
    },
  });
};

/**
 * Mutation hook to cancel a takeaway order
 */
export const useCancelTakeawayOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: CancelTakeawayOrderInput;
    }) => TakeawayApi.cancelOrder(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAKEAWAY_QUERY_KEYS.QUEUE });
    },
  });
};
