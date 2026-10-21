import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShiftsApi } from '@/core/api/shiftsApi';
import {
  OpenShiftInput,
  CloseShiftInput,
  CashDropInput,
  CashAdjustmentInput,
  ListShiftsQueryParams,
  ListPaymentsQueryParams,
  CreateRefundInput,
} from '@/types';

export const SHIFTS_QUERY_KEYS = {
  CURRENT: ['shifts', 'current'] as const,
  LIST: (params?: ListShiftsQueryParams) => ['shifts', 'list', params] as const,
  SUMMARY: (id: string) => ['shifts', 'summary', id] as const,
  PAYMENTS: (params?: ListPaymentsQueryParams) => ['payments', 'list', params] as const,
};

/**
 * Hook to retrieve and auto-poll the current active cashier shift
 */
export const useCurrentShiftQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: SHIFTS_QUERY_KEYS.CURRENT,
    queryFn: () => ShiftsApi.getCurrentShift(),
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 15,
    enabled: options?.enabled ?? true,
  });
};

/**
 * Hook to open a new register shift
 */
export const useOpenShiftMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OpenShiftInput) => ShiftsApi.openShift(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

/**
 * Hook to record a cash drop / safe deposit
 */
export const useCashDropMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CashDropInput) => ShiftsApi.recordCashDrop(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

/**
 * Hook to record a cash adjustment (Pay In / Pay Out)
 */
export const useCashAdjustmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CashAdjustmentInput) => ShiftsApi.recordCashAdjustment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

/**
 * Hook to close and reconcile active register shift
 */
export const useCloseShiftMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CloseShiftInput) => ShiftsApi.closeShift(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

/**
 * Hook to retrieve a single shift settlement summary report
 */
export const useShiftSummaryQuery = (id: string | null) => {
  return useQuery({
    queryKey: SHIFTS_QUERY_KEYS.SUMMARY(id || ''),
    queryFn: () => ShiftsApi.getShiftSummary(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to list past cashier shifts with filtering
 */
export const usePastShiftsQuery = (params?: ListShiftsQueryParams) => {
  return useQuery({
    queryKey: SHIFTS_QUERY_KEYS.LIST(params),
    queryFn: () => ShiftsApi.listShifts(params),
    staleTime: 1000 * 30,
  });
};

/**
 * Hook to list payment transactions with filtering
 */
export const usePaymentsListQuery = (
  params?: ListPaymentsQueryParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: SHIFTS_QUERY_KEYS.PAYMENTS(params),
    queryFn: () => ShiftsApi.listPayments(params),
    staleTime: 1000 * 15,
    enabled: options?.enabled ?? true,
  });
};

/**
 * Hook to refund a payment transaction
 */
export const useRefundPaymentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      payload,
    }: {
      paymentId: string;
      payload: CreateRefundInput;
    }) => ShiftsApi.refundPayment(paymentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};
