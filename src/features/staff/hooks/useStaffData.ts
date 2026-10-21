import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StaffApi } from '@/core/api/staffApi';
import { CreateStaffInput, ListStaffQueryParams } from '@/types';

export const STAFF_QUERY_KEYS = {
  LIST: (params?: ListStaffQueryParams) => ['staff', 'list', params] as const,
  ROLES: ['staff', 'roles'] as const,
};

export const useStaffListQuery = (params?: ListStaffQueryParams) => {
  return useQuery({
    queryKey: STAFF_QUERY_KEYS.LIST(params),
    queryFn: () => StaffApi.listStaff(params),
    staleTime: 1000 * 30,
  });
};

export const useStaffRolesQuery = (enabled = true) => {
  return useQuery({
    queryKey: STAFF_QUERY_KEYS.ROLES,
    queryFn: () => StaffApi.listRoles(),
    staleTime: 1000 * 60 * 5,
    enabled,
  });
};

export const useCreateStaffMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStaffInput) => StaffApi.createStaff(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'list'] });
    },
  });
};
