import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DeliveryApi } from '@/core/api/deliveryApi';
import {
  UpdateDeliveryStatusInput,
  AssignRiderInput,
  CancelDeliveryOrderInput,
} from '@/types';

export const DELIVERY_QUERY_KEYS = {
  DISPATCHER: ['delivery', 'dispatcher'] as const,
  RIDERS: ['delivery', 'riders'] as const,
  ZONES: ['delivery', 'zones'] as const,
  ORDER: (id: string) => ['delivery', 'order', id] as const,
};

/**
 * Hook to retrieve and live-poll the dispatcher delivery queue
 */
export const useDeliveryQueueQuery = () => {
  return useQuery({
    queryKey: DELIVERY_QUERY_KEYS.DISPATCHER,
    queryFn: () => DeliveryApi.getDispatcherQueue(),
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 15,
  });
};

/**
 * Hook to retrieve eligible active delivery riders
 */
export const useDeliveryRidersQuery = () => {
  return useQuery({
    queryKey: DELIVERY_QUERY_KEYS.RIDERS,
    queryFn: () => DeliveryApi.listRiders(),
    staleTime: 1000 * 60,
  });
};

/**
 * Hook to retrieve configured delivery zones
 */
export const useDeliveryZonesQuery = () => {
  return useQuery({
    queryKey: DELIVERY_QUERY_KEYS.ZONES,
    queryFn: () => DeliveryApi.listZones(),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Mutation hook to advance delivery order status
 */
export const useUpdateDeliveryStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: UpdateDeliveryStatusInput;
    }) => DeliveryApi.updateStatus(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DELIVERY_QUERY_KEYS.DISPATCHER,
      });
    },
  });
};

/**
 * Mutation hook to assign or reassign a rider
 */
export const useAssignRiderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: AssignRiderInput }) =>
      DeliveryApi.assignRider(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DELIVERY_QUERY_KEYS.DISPATCHER,
      });
    },
  });
};

/**
 * Mutation hook to cancel a delivery order
 */
export const useCancelDeliveryOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: CancelDeliveryOrderInput;
    }) => DeliveryApi.cancelOrder(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DELIVERY_QUERY_KEYS.DISPATCHER,
      });
    },
  });
};
