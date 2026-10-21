/**
 * Staff management types aligned with /api/v1/staff contracts.
 */

export interface StaffRoleSummary {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface StaffMemberRecord {
  id: string;
  restaurantId: string;
  name: string;
  username: string;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: StaffRoleSummary[];
}

export interface StaffRoleRecord {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  createdAt: string;
}

export interface StaffListPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedStaffData {
  items: StaffMemberRecord[];
  pagination: StaffListPagination;
}

export interface ListStaffQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'username' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateStaffInput {
  name: string;
  username: string;
  phone?: string;
  pin: string;
  password?: string;
  roleIds: string[];
}
