import { apiClient } from '@/core/api/client';
import { ApiResponse } from '@/types';

export interface SetupStatusData {
  setupRequired: boolean;
}

export interface CompleteSetupPayload {
  restaurant: {
    name: string;
    slug: string;
    legalName?: string;
    phone?: string;
    address?: string;
    currency?: string;
    timezone?: string;
    taxRate?: number;
  };
  owner: {
    name: string;
    username: string;
    phone?: string;
    pin: string;
    password: string;
  };
}

export interface CompleteSetupData {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    timezone: string;
  };
  owner: {
    id: string;
    name: string;
    username: string;
  };
}

export class SetupApi {
  /**
   * GET /api/v1/setup/status
   */
  public static async getStatus(): Promise<SetupStatusData> {
    const response = await apiClient.get<ApiResponse<SetupStatusData>>('/setup/status');
    return response.data;
  }

  /**
   * POST /api/v1/setup
   */
  public static async completeSetup(payload: CompleteSetupPayload): Promise<CompleteSetupData> {
    const response = await apiClient.post<ApiResponse<CompleteSetupData>>('/setup', payload);
    return response.data;
  }
}
