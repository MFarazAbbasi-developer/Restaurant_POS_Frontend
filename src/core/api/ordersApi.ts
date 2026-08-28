import { apiClient } from './client';
import {
  ApiResponse,
  CreateOrderInput,
  CreatePaymentInput,
  OrderRecord,
  PaymentResponseData,
  PosFloorViewData,
  PosMenuData,
  ListOrdersQueryParams,
  ListOrdersResponseData,
} from '@/types';

export class OrdersApi {
  /**
   * GET /api/v1/orders
   * List orders with optional filtering and pagination
   */
  public static async listOrders(
    params?: ListOrdersQueryParams
  ): Promise<ListOrdersResponseData> {
    const response = await apiClient.get<ApiResponse<ListOrdersResponseData>>('/orders', {
      params,
    });
    return response.data;
  }
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

  /**
   * PATCH /api/v1/tables/:id/status
   * Update table operational status (AVAILABLE, OCCUPIED, BILL_PRINTED, RESERVED, CLEANING)
   */
  public static async updateTableStatus(
    tableId: string,
    status: string
  ): Promise<{ table: unknown }> {
    const response = await apiClient.patch<
      ApiResponse<{ table: unknown }>,
      { status: string }
    >(`/tables/${tableId}/status`, { status });
    return response.data;
  }

  /**
   * POST /api/v1/tables/:id/orders
   * Open a new dine-in sub-bill / table order context
   */
  public static async createTableOrder(
    tableId: string,
    payload: { subBillName?: string; guestCount?: number; notes?: string }
  ): Promise<{ order: unknown }> {
    const response = await apiClient.post<
      ApiResponse<{ order: unknown }>,
      typeof payload
    >(`/tables/${tableId}/orders`, payload);
    return response.data;
  }

  /**
   * POST /api/v1/tables/transfer
   * Transfer active table orders from one table to another
   */
  public static async transferTable(payload: {
    fromTableId: string;
    toTableId: string;
    targetStatus?: string;
  }): Promise<{ message: string }> {
    const response = await apiClient.post<
      ApiResponse<{ message: string }>,
      typeof payload
    >('/tables/transfer', payload);
    return response.data;
  }

  /**
   * POST /api/v1/orders/:id/discount
   * Apply manual order-level discount
   */
  public static async applyDiscount(
    orderId: string,
    payload: {
      discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
      discountValue: number;
      discountReason: string;
      managerPin?: string;
    }
  ): Promise<{ order: OrderRecord }> {
    const response = await apiClient.post<
      ApiResponse<{ order: OrderRecord }>,
      typeof payload
    >(`/orders/${orderId}/discount`, payload);
    return response.data;
  }
}
