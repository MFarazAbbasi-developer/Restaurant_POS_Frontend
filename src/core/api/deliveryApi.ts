import { apiClient } from './client';
import {
  ApiResponse,
  DeliveryDispatcherData,
  DeliveryOrderRecord,
  DeliveryRiderRecord,
  DeliveryZoneRecord,
  UpdateDeliveryStatusInput,
  AssignRiderInput,
  CancelDeliveryOrderInput,
} from '@/types';

export class DeliveryApi {
  /**
   * GET /api/v1/delivery/dispatcher
   * Retrieve active dispatcher delivery queue (PENDING, PREPARING, READY, DISPATCHED)
   */
  public static async getDispatcherQueue(): Promise<DeliveryDispatcherData> {
    const response =
      await apiClient.get<ApiResponse<DeliveryDispatcherData>>('/delivery/dispatcher');
    return response.data;
  }

  /**
   * GET /api/v1/delivery/riders
   * Retrieve active eligible delivery riders
   */
  public static async listRiders(): Promise<DeliveryRiderRecord[]> {
    const response =
      await apiClient.get<
        ApiResponse<DeliveryRiderRecord[] | { riders: DeliveryRiderRecord[] }>
      >('/delivery/riders');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (
      response.data &&
      typeof response.data === 'object' &&
      'riders' in response.data &&
      Array.isArray(response.data.riders)
    ) {
      return response.data.riders;
    }
    return [];
  }

  /**
   * GET /api/v1/delivery/zones
   * Retrieve configured delivery zones and fees
   */
  public static async listZones(): Promise<DeliveryZoneRecord[]> {
    const response =
      await apiClient.get<
        ApiResponse<DeliveryZoneRecord[] | { zones: DeliveryZoneRecord[] }>
      >('/delivery/zones');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (
      response.data &&
      typeof response.data === 'object' &&
      'zones' in response.data &&
      Array.isArray(response.data.zones)
    ) {
      return response.data.zones;
    }
    return [];
  }

  /**
   * GET /api/v1/delivery/orders/:id
   * Retrieve single delivery order details
   */
  public static async getOrderById(id: string): Promise<{ order: DeliveryOrderRecord }> {
    const response = await apiClient.get<ApiResponse<{ order: DeliveryOrderRecord }>>(
      `/delivery/orders/${id}`
    );
    return response.data;
  }

  /**
   * PATCH /api/v1/delivery/orders/:id/status
   * Update delivery order status (PREPARING, READY, DISPATCHED, DELIVERED, FAILED)
   */
  public static async updateStatus(
    id: string,
    payload: UpdateDeliveryStatusInput
  ): Promise<{ order: DeliveryOrderRecord }> {
    const response = await apiClient.patch<
      ApiResponse<{ order: DeliveryOrderRecord }>,
      UpdateDeliveryStatusInput
    >(`/delivery/orders/${id}/status`, payload);
    return response.data;
  }

  /**
   * POST /api/v1/delivery/orders/:id/assign-rider
   * Assign or reassign a rider to a delivery order
   */
  public static async assignRider(
    id: string,
    payload: AssignRiderInput
  ): Promise<{ message: string }> {
    const response = await apiClient.post<
      ApiResponse<{ message: string }>,
      AssignRiderInput
    >(`/delivery/orders/${id}/assign-rider`, payload);
    return response.data;
  }

  /**
   * POST /api/v1/delivery/orders/:id/cancel
   * Cancel delivery order with mandatory reason
   */
  public static async cancelOrder(
    id: string,
    payload: CancelDeliveryOrderInput
  ): Promise<{ message: string }> {
    const response = await apiClient.post<
      ApiResponse<{ message: string }>,
      CancelDeliveryOrderInput
    >(`/delivery/orders/${id}/cancel`, payload);
    return response.data;
  }
}
