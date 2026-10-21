/**
 * Authentication Credentials for Staff / Manager Login
 */
export interface LoginCredentials {
  username: string;
  pin?: string;
  password?: string;
  restaurantId?: string;
}

/**
 * Basic Authenticated User info returned immediately upon login
 */
export interface AuthUser {
  id: string;
  restaurantId: string;
  name: string;
  username: string;
  roles: string[];
  permissions: string[];
}

/**
 * Restaurant tenant details returned from /auth/me
 */
export interface RestaurantProfile {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  currency: string;
  timezone: string;
  taxRate?: number | null;
  taxInclusive?: boolean;
  serviceChargeRate?: number | null;
  serviceChargeEnabled?: boolean;
  isActive: boolean;
}

/**
 * Detailed role record with metadata
 */
export interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

/**
 * Full User Profile returned from /auth/me
 */
export interface FullUserProfile {
  id: string;
  name: string;
  username: string;
  isActive: boolean;
  lastLoginAt: string | null;
  restaurant: RestaurantProfile;
  roles: RoleRecord[];
  permissions: string[];
}

/**
 * Auth Token Pair and session metadata
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Response data payload for POST /auth/login
 */
export interface AuthLoginData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

/**
 * Response data payload for POST /auth/refresh
 */
export interface AuthRefreshData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Response data payload for POST /auth/logout-all
 */
export interface LogoutAllData {
  revokedCount: number;
}
