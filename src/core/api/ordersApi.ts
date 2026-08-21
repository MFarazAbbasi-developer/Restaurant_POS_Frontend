import { apiClient } from './client';
import {
  ApiResponse,
  CreateOrderInput,
  CreatePaymentInput,
  OrderRecord,
  PaymentResponseData,
  PosFloorViewData,
  PosMenuData,
} from '@/types';

export class OrdersApi {
  /**
   * GET /api/v1/menu/pos
   * Retrieve active pre-sorted menu catalog with portion variants and modifier groups
   */
  public static async getPosMenu(): Promise<PosMenuData> {
    const response = await apiClient.get<ApiResponse<PosMenuData>>('/menu/pos');
    return response.data;
  }

  /**
   * GET /api/v1/tables/pos-view
   * Retrieve floor seating zones, tables, occupancy states, and active sub-bills
   */
  public static async getPosTables(): Promise<PosFloorViewData> {
    const response =
      await apiClient.get<ApiResponse<PosFloorViewData>>('/tables/pos-view');
    return response.data;
  }

  /**
   * POST /api/v1/orders
   * Create and calculate a new order in backend
   */
  public static async createOrder(
    input: CreateOrderInput
  ): Promise<{ order: OrderRecord }> {
    const response = await apiClient.post<
      ApiResponse<{ order: OrderRecord }>,
      CreateOrderInput
    >('/orders', input);
    return response.data;
  }

  /**
   * GET /api/v1/orders/:id
   * Retrieve single order details with item breakdown and payment records
   */
  public static async getOrder(id: string): Promise<{ order: OrderRecord }> {
    const response = await apiClient.get<ApiResponse<{ order: OrderRecord }>>(
      `/orders/${id}`
    );
    return response.data;
  }

  /**
   * POST /api/v1/payments
   * Process payment against an active order
   */
  public static async processPayment(
    input: CreatePaymentInput
  ): Promise<PaymentResponseData> {
    const response = await apiClient.post<
      ApiResponse<PaymentResponseData>,
      CreatePaymentInput
    >('/payments', input);
    return response.data;
  }
}
