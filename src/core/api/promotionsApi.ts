import { apiClient } from './client';
import {
  ApiResponse,
  PromotionRecord,
  PaginatedPromotionsData,
  PromotionUsageRecord,
  CreatePromotionInput,
  UpdatePromotionInput,
  ListPromotionsQueryParams,
  ValidatePromoCodeInput,
} from '@/types';

export class PromotionsApi {
  /**
   * GET /api/v1/promotions
   * List promotional campaigns with filters and pagination
   */
  public static async listPromotions(
    params?: ListPromotionsQueryParams
  ): Promise<PaginatedPromotionsData> {
    const response = await apiClient.get<ApiResponse<PaginatedPromotionsData>>(
      '/promotions',
      { params }
    );
    return response.data;
  }

  /**
   * GET /api/v1/promotions/:id
   * Get single promotion details
   */
  public static async getPromotionById(id: string): Promise<PromotionRecord> {
    const response = await apiClient.get<ApiResponse<PromotionRecord>>(
      `/promotions/${id}`
    );
    return response.data;
  }

  /**
   * POST /api/v1/promotions
   * Create a new discount or promotional campaign
   */
  public static async createPromotion(
    payload: CreatePromotionInput
  ): Promise<PromotionRecord> {
    const response = await apiClient.post<
      ApiResponse<PromotionRecord>,
      CreatePromotionInput
    >('/promotions', payload);
    return response.data;
  }

  /**
   * PUT /api/v1/promotions/:id
   * Update promotion configuration and rules
   */
  public static async updatePromotion(
    id: string,
    payload: UpdatePromotionInput
  ): Promise<PromotionRecord> {
    const response = await apiClient.put<
      ApiResponse<PromotionRecord>,
      UpdatePromotionInput
    >(`/promotions/${id}`, payload);
    return response.data;
  }

  /**
   * DELETE /api/v1/promotions/:id
   * Delete promotion campaign
   */
  public static async deletePromotion(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/promotions/${id}`
    );
    return response.data;
  }

  /**
   * PATCH /api/v1/promotions/:id/toggle-status
   * Toggle active/inactive status of promotion
   */
  public static async toggleStatus(id: string): Promise<PromotionRecord> {
    const response = await apiClient.patch<ApiResponse<PromotionRecord>>(
      `/promotions/${id}/toggle-status`
    );
    return response.data;
  }

  /**
   * GET /api/v1/promotions/:id/usages
   * List redemption history for a promotion
   */
  public static async listUsages(
    id: string
  ): Promise<{ usages: PromotionUsageRecord[] }> {
    const response = await apiClient.get<ApiResponse<{ usages: PromotionUsageRecord[] }>>(
      `/promotions/${id}/usages`
    );
    return response.data;
  }

  /**
   * POST /api/v1/promotions/validate-code
   * Validate promo code against order cart
   */
  public static async validateCode(payload: ValidatePromoCodeInput): Promise<{
    valid: boolean;
    promotion?: PromotionRecord;
    discountAmount?: number;
    message?: string;
  }> {
    const response = await apiClient.post<
      ApiResponse<{
        valid: boolean;
        promotion?: PromotionRecord;
        discountAmount?: number;
        message?: string;
      }>,
      ValidatePromoCodeInput
    >('/promotions/validate-code', payload);
    return response.data;
  }
}
