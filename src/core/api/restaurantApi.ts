import { apiClient } from './client';
import { ApiResponse, RestaurantConfiguration, UpdateRestaurantInput } from '@/types';

export class RestaurantApi {
  /**
   * GET /api/v1/restaurant
   * Retrieve current restaurant tenant configuration and POS parameters
   */
  public static async getRestaurant(): Promise<RestaurantConfiguration> {
    const response =
      await apiClient.get<ApiResponse<RestaurantConfiguration>>('/restaurant');
    return response.data;
  }

  /**
   * PATCH /api/v1/restaurant
   * Update restaurant profile, currency, tax rates, and channel settings
   */
  public static async updateRestaurant(
    payload: UpdateRestaurantInput
  ): Promise<RestaurantConfiguration> {
    const response = await apiClient.patch<
      ApiResponse<RestaurantConfiguration>,
      UpdateRestaurantInput
    >('/restaurant', payload);
    return response.data;
  }
}
