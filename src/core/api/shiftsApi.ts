import { apiClient } from './client';
import {
  ApiResponse,
  CashierShiftRecord,
  ShiftSummaryData,
  OpenShiftInput,
  CloseShiftInput,
  CashDropInput,
  CashAdjustmentInput,
  ListShiftsQueryParams,
  CreateRefundInput,
  ListPaymentsQueryParams,
  PaginatedPaymentsData,
  PaginatedShiftsData,
  PaymentRecord,
} from '@/types';

export class ShiftsApi {
  /**
   * GET /api/v1/shifts/current
   * Retrieve active open shift for currently logged-in cashier
   */
  public static async getCurrentShift(): Promise<CashierShiftRecord | null> {
    try {
      const response = await apiClient.get<ApiResponse<{ shift: CashierShiftRecord }>>(
        '/shifts/current'
      );
      return response.data?.shift ?? null;
    } catch (err: unknown) {
      // 404 means no active open shift
      if (
        typeof err === 'object' &&
        err !== null &&
        'statusCode' in err &&
        (err as { statusCode: number }).statusCode === 404
      ) {
        return null;
      }
      throw err;
    }
  }

  /**
   * POST /api/v1/shifts/open
   * Open a new register shift with opening cash float
   */
  public static async openShift(payload: OpenShiftInput): Promise<CashierShiftRecord> {
    const response = await apiClient.post<
      ApiResponse<{ shift: CashierShiftRecord }>,
      OpenShiftInput
    >('/shifts/open', payload);
    return response.data.shift;
  }

  /**
   * POST /api/v1/shifts/current/cash-drop
   * Record a cash drop / safe deposit
   */
  public static async recordCashDrop(
    payload: CashDropInput
  ): Promise<CashierShiftRecord> {
    const response = await apiClient.post<
      ApiResponse<{ shift: CashierShiftRecord }>,
      CashDropInput
    >('/shifts/current/cash-drop', payload);
    return response.data.shift;
  }

  /**
   * POST /api/v1/shifts/current/adjustment
   * Record cash adjustment (Pay In / Pay Out / Petty Cash)
   */
  public static async recordCashAdjustment(
    payload: CashAdjustmentInput
  ): Promise<CashierShiftRecord> {
    const response = await apiClient.post<
      ApiResponse<{ shift: CashierShiftRecord }>,
      CashAdjustmentInput
    >('/shifts/current/adjustment', payload);
    return response.data.shift;
  }

  /**
   * POST /api/v1/shifts/current/close
   * Close and reconcile active register shift
   */
  public static async closeShift(
    payload: CloseShiftInput
  ): Promise<{ shift: CashierShiftRecord; summary: ShiftSummaryData }> {
    const response = await apiClient.post<
      ApiResponse<{ shift: CashierShiftRecord; summary: ShiftSummaryData }>,
      CloseShiftInput
    >('/shifts/current/close', payload);
    return response.data;
  }

  /**
   * GET /api/v1/shifts/:id/summary
   * Get shift settlement summary breakdown
   */
  public static async getShiftSummary(id: string): Promise<ShiftSummaryData> {
    const response = await apiClient.get<ApiResponse<{ summary: ShiftSummaryData }>>(
      `/shifts/${id}/summary`
    );
    return response.data.summary;
  }

  /**
   * GET /api/v1/shifts/:id
   * Get shift details by ID
   */
  public static async getShiftById(id: string): Promise<CashierShiftRecord> {
    const response = await apiClient.get<ApiResponse<{ shift: CashierShiftRecord }>>(
      `/shifts/${id}`
    );
    return response.data.shift;
  }

  /**
   * GET /api/v1/shifts
   * List and filter past shifts with pagination
   */
  public static async listShifts(
    params?: ListShiftsQueryParams
  ): Promise<PaginatedShiftsData> {
    const response = await apiClient.get<ApiResponse<PaginatedShiftsData>>('/shifts', {
      params,
    });
    return response.data;
  }

  /**
   * GET /api/v1/payments
   * List and filter payment transactions with pagination
   */
  public static async listPayments(
    params?: ListPaymentsQueryParams
  ): Promise<PaginatedPaymentsData> {
    const response = await apiClient.get<ApiResponse<PaginatedPaymentsData>>(
      '/payments',
      { params }
    );
    return response.data;
  }

  /**
   * POST /api/v1/payments/:id/refund
   * Refund a payment (full or partial) with mandatory reason
   */
  public static async refundPayment(
    id: string,
    payload: CreateRefundInput
  ): Promise<{
    refund: Record<string, unknown>;
    payment: PaymentRecord;
    order: { id: string; orderCode: string; paidAmount: number; paymentStatus: string };
  }> {
    const response = await apiClient.post<
      ApiResponse<{
        refund: Record<string, unknown>;
        payment: PaymentRecord;
        order: {
          id: string;
          orderCode: string;
          paidAmount: number;
          paymentStatus: string;
        };
      }>,
      CreateRefundInput
    >(`/payments/${id}/refund`, payload);
    return response.data;
  }
}
