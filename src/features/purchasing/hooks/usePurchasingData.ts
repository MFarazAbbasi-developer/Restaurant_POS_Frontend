import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PurchasingApi } from '@/core/api/purchasingApi';
import {
  CreateSupplierInput,
  UpdateSupplierInput,
  CreatePurchasingOrderInput,
  UpdatePurchasingOrderInput,
  ReceivePurchasingGoodsInput,
  CreatePurchasingReturnInput,
  ListSuppliersQueryParams,
  ListPurchasingOrdersQueryParams,
} from '@/types';

export const PURCHASING_QUERY_KEYS = {
  SUPPLIERS: (params?: ListSuppliersQueryParams) =>
    ['purchasing', 'suppliers', params] as const,
  SUPPLIER_DETAIL: (id: string) => ['purchasing', 'suppliers', 'detail', id] as const,
  SUPPLIER_HISTORY: (id: string) => ['purchasing', 'suppliers', 'history', id] as const,
  ORDERS: (params?: ListPurchasingOrdersQueryParams) =>
    ['purchasing', 'orders', params] as const,
  ORDER_DETAIL: (id: string) => ['purchasing', 'orders', 'detail', id] as const,
  SUMMARY: (params?: { startDate?: string; endDate?: string }) =>
    ['purchasing', 'summary', params] as const,
};

// -----------------------------------------------------------------------------
// Supplier Hooks
// -----------------------------------------------------------------------------

export const useSuppliersQuery = (params?: ListSuppliersQueryParams) => {
  return useQuery({
    queryKey: PURCHASING_QUERY_KEYS.SUPPLIERS(params),
    queryFn: () => PurchasingApi.listSuppliers(params),
    staleTime: 1000 * 30,
  });
};

export const useSupplierQuery = (id: string | null) => {
  return useQuery({
    queryKey: PURCHASING_QUERY_KEYS.SUPPLIER_DETAIL(id || ''),
    queryFn: () => PurchasingApi.getSupplierById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
};

export const useSupplierHistoryQuery = (id: string | null) => {
  return useQuery({
    queryKey: PURCHASING_QUERY_KEYS.SUPPLIER_HISTORY(id || ''),
    queryFn: () => PurchasingApi.getSupplierHistory(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
};

export const useCreateSupplierMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSupplierInput) => PurchasingApi.createSupplier(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing', 'suppliers'] });
    },
  });
};

export const useUpdateSupplierMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSupplierInput }) =>
      PurchasingApi.updateSupplier(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing', 'suppliers'] });
    },
  });
};

export const useDeleteSupplierMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => PurchasingApi.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing', 'suppliers'] });
    },
  });
};

// -----------------------------------------------------------------------------
// Purchase Orders Hooks
// -----------------------------------------------------------------------------

export const usePurchasingOrdersQuery = (params?: ListPurchasingOrdersQueryParams) => {
  return useQuery({
    queryKey: PURCHASING_QUERY_KEYS.ORDERS(params),
    queryFn: () => PurchasingApi.listOrders(params),
    staleTime: 1000 * 15,
  });
};

export const usePurchasingOrderQuery = (id: string | null) => {
  return useQuery({
    queryKey: PURCHASING_QUERY_KEYS.ORDER_DETAIL(id || ''),
    queryFn: () => PurchasingApi.getOrderById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 15,
  });
};

export const usePurchasingSummaryQuery = (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: PURCHASING_QUERY_KEYS.SUMMARY(params),
    queryFn: () => PurchasingApi.getSummary(params),
    staleTime: 1000 * 60,
  });
};

export const useCreatePurchasingOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePurchasingOrderInput) =>
      PurchasingApi.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useUpdatePurchasingOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePurchasingOrderInput }) =>
      PurchasingApi.updateOrder(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchasing'] });
      queryClient.invalidateQueries({
        queryKey: PURCHASING_QUERY_KEYS.ORDER_DETAIL(variables.id),
      });
    },
  });
};

export const useOrderPurchasingOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => PurchasingApi.orderPurchaseOrder(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchasing'] });
      queryClient.invalidateQueries({
        queryKey: PURCHASING_QUERY_KEYS.ORDER_DETAIL(id),
      });
    },
  });
};

export const useReceivePurchasingGoodsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReceivePurchasingGoodsInput }) =>
      PurchasingApi.receiveGoods(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchasing'] });
      queryClient.invalidateQueries({
        queryKey: PURCHASING_QUERY_KEYS.ORDER_DETAIL(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useCreatePurchasingReturnMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreatePurchasingReturnInput }) =>
      PurchasingApi.createReturn(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchasing'] });
      queryClient.invalidateQueries({
        queryKey: PURCHASING_QUERY_KEYS.ORDER_DETAIL(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useCancelPurchasingOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => PurchasingApi.cancelOrder(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchasing'] });
      queryClient.invalidateQueries({
        queryKey: PURCHASING_QUERY_KEYS.ORDER_DETAIL(id),
      });
    },
  });
};
