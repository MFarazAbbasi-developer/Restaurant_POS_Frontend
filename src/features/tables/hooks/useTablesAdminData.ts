import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TablesApi } from '@/core/api/tablesApi';
import { CreateTableInput, CreateZoneInput, ListTablesQueryParams } from '@/types';
import { POS_QUERY_KEYS } from '@/features/orders/hooks/usePosData';

export const TABLES_ADMIN_QUERY_KEYS = {
  ZONES: ['tables', 'zones'] as const,
  TABLES: (params?: ListTablesQueryParams) => ['tables', 'list', params] as const,
};

function invalidateFloorQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: TABLES_ADMIN_QUERY_KEYS.ZONES });
  queryClient.invalidateQueries({ queryKey: ['tables', 'list'] });
  // POS Register + Floor page both read live seating from pos-view
  queryClient.invalidateQueries({ queryKey: POS_QUERY_KEYS.TABLES });
}

export const useZonesListQuery = (enabled = true) => {
  return useQuery({
    queryKey: TABLES_ADMIN_QUERY_KEYS.ZONES,
    queryFn: () => TablesApi.listZones(),
    staleTime: 1000 * 30,
    enabled,
  });
};

export const useTablesListQuery = (
  params?: ListTablesQueryParams,
  enabled = true
) => {
  return useQuery({
    queryKey: TABLES_ADMIN_QUERY_KEYS.TABLES(params),
    queryFn: () => TablesApi.listTables(params),
    staleTime: 1000 * 30,
    enabled,
  });
};

export const useCreateZoneMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateZoneInput) => TablesApi.createZone(payload),
    onSuccess: () => {
      invalidateFloorQueries(queryClient);
    },
  });
};

export const useCreateTableMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTableInput) => TablesApi.createTable(payload),
    onSuccess: () => {
      invalidateFloorQueries(queryClient);
    },
  });
};
