import { apiClient } from '@/core/api/client';
import {
  ApiResponse,
  AuthLoginData,
  AuthRefreshData,
  FullUserProfile,
  LoginCredentials,
  LogoutAllData,
} from '@/types';

export class AuthApi {
  /**
   * POST /api/v1/auth/login
   * Authenticate staff/manager via username and PIN or Password
   */
  public static async login(credentials: LoginCredentials): Promise<AuthLoginData> {
    const response = await apiClient.post<ApiResponse<AuthLoginData>>(
      '/auth/login',
      credentials
    );
    return response.data;
  }

  /**
   * POST /api/v1/auth/refresh
   * Rotate and refresh access/refresh token pair
   */
  public static async refresh(refreshToken: string): Promise<AuthRefreshData> {
    const response = await apiClient.post<ApiResponse<AuthRefreshData>>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }

  /**
   * POST /api/v1/auth/logout
   * Revoke current active session
   */
  public static async logout(refreshToken?: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/auth/logout', {
      refreshToken,
    });
  }

  /**
   * POST /api/v1/auth/logout-all
   * Revoke all active sessions for the current user
   */
  public static async logoutAll(): Promise<LogoutAllData> {
    const response = await apiClient.post<ApiResponse<LogoutAllData>>('/auth/logout-all');
    return response.data;
  }

  /**
   * GET /api/v1/auth/me
   * Retrieve currently authenticated user's complete profile with roles, permissions, and restaurant details
   */
  public static async getMe(): Promise<FullUserProfile> {
    const response =
      await apiClient.get<ApiResponse<{ user: FullUserProfile }>>('/auth/me');
    return response.data.user;
  }
}
