/**
 * Admin zone / table records from GET/POST /api/v1/zones and /api/v1/tables.
 * POS floor view types remain in orders.ts (PosZone / PosTable).
 */

export interface ZoneRecord {
  id: string;
  restaurantId: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tables: number;
  };
}

export interface TableRecord {
  id: string;
  restaurantId: string;
  zoneId: string;
  name: string;
  capacity: number;
  sortOrder: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'BILL_PRINTED' | 'RESERVED' | 'CLEANING';
  mergedIntoTableId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  zone?: {
    id: string;
    name: string;
  };
}

/** POST /api/v1/zones — matches backend createZoneSchema */
export interface CreateZoneInput {
  name: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

/** POST /api/v1/tables — matches backend createTableSchema */
export interface CreateTableInput {
  zoneId: string;
  name: string;
  capacity?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ListTablesQueryParams {
  zoneId?: string;
  status?: TableRecord['status'];
  isActive?: boolean;
  search?: string;
}
