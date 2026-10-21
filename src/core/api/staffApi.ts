import { apiClient } from './client';
import {
  ApiResponse,
  CreateStaffInput,
  ListStaffQueryParams,
  PaginatedStaffData,
  StaffMemberRecord,
  StaffRoleRecord,
} from '@/types';

export class StaffApi {
  /**
   * GET /api/v1/staff
   */
  public static async listStaff(
    params?: ListStaffQueryParams
  ): Promise<PaginatedStaffData> {
    const query: Record<string, string | number | undefined> = {
      page: params?.page,
      limit: params?.limit,
      search: params?.search,
      roleId: params?.roleId,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      isActive:
        params?.isActive === undefined
          ? undefined
          : params.isActive
            ? 'true'
            : 'false',
    };

    const response = await apiClient.get<ApiResponse<PaginatedStaffData>>('/staff', {
      params: query,
    });
    return response.data;
  }

  /**
   * GET /api/v1/staff/roles
   */
  public static async listRoles(): Promise<StaffRoleRecord[]> {
    const response = await apiClient.get<
      ApiResponse<StaffRoleRecord[] | { roles: StaffRoleRecord[] }>
    >('/staff/roles');
    if (Array.isArray(response.data)) return response.data;
    if (
      response.data &&
      'roles' in response.data &&
      Array.isArray(response.data.roles)
    ) {
      return response.data.roles;
    }
    return [];
  }

  /**
   * POST /api/v1/staff
   */
  public static async createStaff(payload: CreateStaffInput): Promise<StaffMemberRecord> {
    const response = await apiClient.post<
      ApiResponse<StaffMemberRecord | { staff: StaffMemberRecord }>,
      CreateStaffInput
    >('/staff', payload);
    if (response.data && 'staff' in response.data) {
      return response.data.staff;
    }
    return response.data as StaffMemberRecord;
  }
}
