import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomersApi } from '@/core/api/customersApi';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  AddCustomerAddressInput,
  ListCustomersQueryParams,
  EnrollCustomerLoyaltyInput,
} from '@/types';

export const CUSTOMER_QUERY_KEYS = {
  LIST: (params?: ListCustomersQueryParams) => ['customers', 'list', params] as const,
  LOOKUP: (phone: string) => ['customers', 'lookup', phone] as const,
  LOYALTY: (customerId: string) => ['customers', 'loyalty', customerId] as const,
  ZONES: ['delivery', 'zones'] as const,
};

export const useCustomersQuery = (params?: ListCustomersQueryParams) => {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.LIST(params),
    queryFn: () => CustomersApi.listCustomers(params),
    staleTime: 1000 * 30,
  });
};

export const useCustomerLookupQuery = (phone: string | null) => {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.LOOKUP(phone || ''),
    queryFn: () => CustomersApi.lookupByPhone(phone!),
    enabled: Boolean(phone && phone.trim().length >= 3),
    staleTime: 1000 * 30,
  });
};

export const useCustomerLoyaltyQuery = (customerId: string | null) => {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.LOYALTY(customerId || ''),
    queryFn: () => CustomersApi.getLoyaltyAccount(customerId!),
    enabled: Boolean(customerId),
    staleTime: 1000 * 60,
  });
};

export const useDeliveryZonesQuery = () => {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.ZONES,
    queryFn: () => CustomersApi.listZones(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomerInput) => CustomersApi.createCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useUpdateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCustomerInput }) =>
      CustomersApi.updateCustomer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useAddCustomerAddressMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      customerId,
      payload,
    }: {
      customerId: string;
      payload: AddCustomerAddressInput;
    }) => CustomersApi.addAddress(customerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useEnrollCustomerLoyaltyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EnrollCustomerLoyaltyInput) =>
      CustomersApi.enrollLoyalty(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: CUSTOMER_QUERY_KEYS.LOYALTY(variables.customerId),
      });
      queryClient.invalidateQueries({ queryKey: ['loyalty'] });
    },
  });
};
