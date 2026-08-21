import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrdersApi } from '@/core/api/ordersApi';
import { CreateOrderInput, CreatePaymentInput } from '@/types';

export const POS_QUERY_KEYS = {
  MENU: ['pos', 'menu'] as const,
  TABLES: ['pos', 'tables'] as const,
  ORDER: (id: string) => ['pos', 'order', id] as const,
};

/**
 * Hook to retrieve the active pre-sorted POS Menu catalog
 */
export const usePosMenuQuery = () => {
  return useQuery({
    queryKey: POS_QUERY_KEYS.MENU,
    queryFn: () => OrdersApi.getPosMenu(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to retrieve active floor seating zones and table statuses
 */
export const usePosTablesQuery = () => {
  return useQuery({
    queryKey: POS_QUERY_KEYS.TABLES,
    queryFn: () => OrdersApi.getPosTables(),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30,
  });
};

/**
 * Mutation hook to create and calculate an order
 */
export const useCreateOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => OrdersApi.createOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_QUERY_KEYS.TABLES });
    },
  });
};

/**
 * Mutation hook to process customer payment tender
 */
export const useProcessPaymentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePaymentInput) => OrdersApi.processPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_QUERY_KEYS.TABLES });
    },
  });
};

/**
 * Mutation hook to update a table's operational status
 */
export const useUpdateTableStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableId, status }: { tableId: string; status: string }) =>
      OrdersApi.updateTableStatus(tableId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_QUERY_KEYS.TABLES });
    },
  });
};

/**
 * Mutation hook to open a new sub-bill / table order context
 */
export const useCreateTableOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tableId,
      payload,
    }: {
      tableId: string;
      payload: { subBillName?: string; guestCount?: number; notes?: string };
    }) => OrdersApi.createTableOrder(tableId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_QUERY_KEYS.TABLES });
    },
  });
};

/**
 * Mutation hook to transfer table orders
 */
export const useTransferTableMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      fromTableId: string;
      toTableId: string;
      targetStatus?: string;
    }) => OrdersApi.transferTable(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_QUERY_KEYS.TABLES });
    },
  });
};
