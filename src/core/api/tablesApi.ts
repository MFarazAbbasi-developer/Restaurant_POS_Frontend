import { apiClient } from './client';
import {
  ApiResponse,
  CreateTableInput,
  CreateZoneInput,
  ListTablesQueryParams,
  TableRecord,
  ZoneRecord,
} from '@/types';

export class TablesApi {
  /**
   * GET /api/v1/zones
   */
  public static async listZones(): Promise<ZoneRecord[]> {
    const response = await apiClient.get<
      ApiResponse<{ zones: ZoneRecord[] } | ZoneRecord[]>
    >('/zones');
    if (Array.isArray(response.data)) return response.data;
    if (
      response.data &&
      'zones' in response.data &&
      Array.isArray(response.data.zones)
    ) {
      return response.data.zones;
    }
    return [];
  }

  /**
   * POST /api/v1/zones
   */
  public static async createZone(payload: CreateZoneInput): Promise<ZoneRecord> {
    const response = await apiClient.post<
      ApiResponse<{ zone: ZoneRecord } | ZoneRecord>,
      CreateZoneInput
    >('/zones', payload);
    if (response.data && 'zone' in response.data) {
      return response.data.zone;
    }
    return response.data as ZoneRecord;
  }

  /**
   * GET /api/v1/tables
   */
  public static async listTables(
    params?: ListTablesQueryParams
  ): Promise<TableRecord[]> {
    const query: Record<string, string | undefined> = {
      zoneId: params?.zoneId,
      status: params?.status,
      search: params?.search,
      isActive:
        params?.isActive === undefined
          ? undefined
          : params.isActive
            ? 'true'
            : 'false',
    };

    const response = await apiClient.get<
      ApiResponse<{ tables: TableRecord[] } | TableRecord[]>
    >('/tables', { params: query });
    if (Array.isArray(response.data)) return response.data;
    if (
      response.data &&
      'tables' in response.data &&
      Array.isArray(response.data.tables)
    ) {
      return response.data.tables;
    }
    return [];
  }

  /**
   * POST /api/v1/tables
   */
  public static async createTable(payload: CreateTableInput): Promise<TableRecord> {
    const response = await apiClient.post<
      ApiResponse<{ table: TableRecord } | TableRecord>,
      CreateTableInput
    >('/tables', payload);
    if (response.data && 'table' in response.data) {
      return response.data.table;
    }
    return response.data as TableRecord;
  }
}
