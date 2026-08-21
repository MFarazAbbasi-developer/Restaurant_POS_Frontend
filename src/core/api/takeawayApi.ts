import { apiClient } from './client';
import {
  ApiResponse,
  TakeawayQueueData,
  TakeawayOrderRecord,
  UpdateTakeawayStatusInput,
  CancelTakeawayOrderInput,
} from '@/types';

export class TakeawayApi {
  /**
   * GET /api/v1/takeaway/queue
   * Retrieve active takeaway orders queue (PENDING, PREPARING, READY)
   */
  public static async getActiveQueue(): Promise<TakeawayQueueData> {
    const response =
      await apiClient.get<ApiResponse<TakeawayQueueData>>('/takeaway/queue');
    return response.data;
  }

  /**
   * GET /api/v1/takeaway/orders/:id
   * Retrieve single takeaway order details
   */
  public static async getOrderById(id: string): Promise<{ order: TakeawayOrderRecord }> {
    const response = await apiClient.get<ApiResponse<{ order: TakeawayOrderRecord }>>(
      `/takeaway/orders/${id}`
    );
    return response.data;
  }

  /**
   * PATCH /api/v1/takeaway/orders/:id/status
   * Update takeaway order status (PREPARING, READY, COMPLETED)
   */
  public static async updateStatus(
    id: string,
    payload: UpdateTakeawayStatusInput
  ): Promise<{ order: TakeawayOrderRecord }> {
    const response = await apiClient.patch<
      ApiResponse<{ order: TakeawayOrderRecord }>,
      UpdateTakeawayStatusInput
    >(`/takeaway/orders/${id}/status`, payload);
    return response.data;
  }

  /**
   * POST /api/v1/takeaway/orders/:id/cancel
   * Cancel takeaway order with mandatory reason
   */
  public static async cancelOrder(
    id: string,
    payload: CancelTakeawayOrderInput
  ): Promise<{ message: string }> {
    const response = await apiClient.post<
      ApiResponse<{ message: string }>,
      CancelTakeawayOrderInput
    >(`/takeaway/orders/${id}/cancel`, payload);
    return response.data;
  }
}
