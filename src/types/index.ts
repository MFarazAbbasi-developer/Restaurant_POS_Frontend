export * from './auth';
export * from './orders';

/**
 * Standard API response envelope from backend service
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

/**
 * Standard pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Common entity base
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * POS Terminal Session Information
 */
export interface TerminalSession {
  terminalId: string;
  terminalName: string;
  registerOpen: boolean;
  shiftId?: string;
  openedAt?: string;
}

/**
 * Socket Connection States
 */
export type SocketConnectionStatus =
  'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';
