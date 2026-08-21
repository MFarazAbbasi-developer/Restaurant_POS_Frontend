import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReservationsApi } from '@/core/api/reservationsApi';
import {
  CreateReservationInput,
  UpdateReservationInput,
  UpdateReservationStatusInput,
  AssignReservationTableInput,
  CheckReservationAvailabilityQueryParams,
  ListReservationsQueryParams,
} from '@/types';

export const RESERVATION_QUERY_KEYS = {
  LIST: (params?: ListReservationsQueryParams) =>
    ['reservations', 'list', params] as const,
  DETAIL: (id: string) => ['reservations', 'detail', id] as const,
  AVAILABILITY: (params?: CheckReservationAvailabilityQueryParams) =>
    ['reservations', 'availability', params] as const,
};

export const useReservationsQuery = (params?: ListReservationsQueryParams) => {
  return useQuery({
    queryKey: RESERVATION_QUERY_KEYS.LIST(params),
    queryFn: () => ReservationsApi.listReservations(params),
    staleTime: 1000 * 15,
  });
};

export const useReservationQuery = (id: string | null) => {
  return useQuery({
    queryKey: RESERVATION_QUERY_KEYS.DETAIL(id || ''),
    queryFn: () => ReservationsApi.getReservationById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
};

export const useReservationAvailabilityQuery = (
  params?: CheckReservationAvailabilityQueryParams
) => {
  const isEnabled = Boolean(params?.reservationDate && params?.startTime);
  return useQuery({
    queryKey: RESERVATION_QUERY_KEYS.AVAILABILITY(params),
    queryFn: () => ReservationsApi.checkAvailability(params!),
    enabled: isEnabled,
    staleTime: 1000 * 10,
  });
};

export const useCreateReservationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReservationInput) =>
      ReservationsApi.createReservation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
};

export const useUpdateReservationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateReservationInput }) =>
      ReservationsApi.updateReservation(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({
        queryKey: RESERVATION_QUERY_KEYS.DETAIL(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
};

export const useAssignReservationTableMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignReservationTableInput }) =>
      ReservationsApi.assignTable(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({
        queryKey: RESERVATION_QUERY_KEYS.DETAIL(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
};

export const useUpdateReservationStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateReservationStatusInput;
    }) => ReservationsApi.updateStatus(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({
        queryKey: RESERVATION_QUERY_KEYS.DETAIL(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
};
