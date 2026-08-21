import { apiClient } from './client';
import {
  ApiResponse,
  KitchenQueueData,
  KitchenPerformanceData,
  KitchenStationRecord,
  KitchenTicket,
  KitchenQueueQueryParams,
  UpdateOrderKitchenStatusInput,
  UpdateItemKitchenStatusInput,
  RecallKitchenInput,
} from '@/types';

export class KitchenApi {
  /**
   * GET /api/v1/kitchen/queue
   * Retrieve active kitchen queue tickets with station/status filters
   */
  public static async getKitchenQueue(
    params?: KitchenQueueQueryParams
  ): Promise<KitchenQueueData> {
    const response = await apiClient.get<ApiResponse<KitchenQueueData>>(
      '/kitchen/queue',
      { params }
    );
    return response.data;
  }

  /**
   * GET /api/v1/kitchen/stations
   * Retrieve all configured kitchen stations
   */
  public static async listStations(): Promise<KitchenStationRecord[]> {
    const response =
      await apiClient.get<ApiResponse<KitchenStationRecord[]>>('/kitchen/stations');
    return response.data;
  }

  /**
   * GET /api/v1/kitchen/performance
   * Retrieve real-time kitchen analytics and prep time averages
   */
  public static async getPerformance(): Promise<KitchenPerformanceData> {
    const response =
      await apiClient.get<ApiResponse<KitchenPerformanceData>>('/kitchen/performance');
    return response.data;
  }

  /**
   * GET /api/v1/kitchen/orders/:id
   * Retrieve single kitchen ticket details
   */
  public static async getKitchenOrderById(id: string): Promise<KitchenTicket> {
    const response = await apiClient.get<ApiResponse<KitchenTicket>>(
      `/kitchen/orders/${id}`
    );
    return response.data;
  }

  /**
   * PATCH /api/v1/kitchen/orders/:id/status
   * Bump whole ticket order status (PREPARING, READY, SERVED)
   */
  public static async updateOrderStatus(
    id: string,
    payload: UpdateOrderKitchenStatusInput
  ): Promise<KitchenTicket> {
    const response = await apiClient.patch<
      ApiResponse<KitchenTicket>,
      UpdateOrderKitchenStatusInput
    >(`/kitchen/orders/${id}/status`, payload);
    return response.data;
  }

  /**
   * PATCH /api/v1/kitchen/orders/:orderId/items/:itemId/status
   * Bump individual item status on ticket (PENDING, PREPARING, READY, SERVED)
   */
  public static async updateItemStatus(
    orderId: string,
    itemId: string,
    payload: UpdateItemKitchenStatusInput
  ): Promise<KitchenTicket> {
    const response = await apiClient.patch<
      ApiResponse<KitchenTicket>,
      UpdateItemKitchenStatusInput
    >(`/kitchen/orders/${orderId}/items/${itemId}/status`, payload);
    return response.data;
  }

  /**
   * POST /api/v1/kitchen/orders/:id/recall
   * Recall bumped order back to PREPARING
   */
  public static async recallOrder(
    id: string,
    payload?: RecallKitchenInput
  ): Promise<KitchenTicket> {
    const response = await apiClient.post<
      ApiResponse<KitchenTicket>,
      RecallKitchenInput | undefined
    >(`/kitchen/orders/${id}/recall`, payload);
    return response.data;
  }

  /**
   * POST /api/v1/kitchen/orders/:orderId/items/:itemId/recall
   * Recall individual bumped item back to PREPARING
   */
  public static async recallItem(
    orderId: string,
    itemId: string,
    payload?: RecallKitchenInput
  ): Promise<KitchenTicket> {
    const response = await apiClient.post<
      ApiResponse<KitchenTicket>,
      RecallKitchenInput | undefined
    >(`/kitchen/orders/${orderId}/items/${itemId}/recall`, payload);
    return response.data;
  }
}
