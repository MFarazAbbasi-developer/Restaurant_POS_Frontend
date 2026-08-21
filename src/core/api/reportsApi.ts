import { apiClient } from './client';
import {
  ApiResponse,
  BaseReportFilter,
  OrderTypeReportFilter,
  PaymentMethodReportFilter,
  ItemsRankingReportFilter,
  SalesSummaryReportData,
  SalesByOrderTypeReportData,
  SalesByPaymentMethodReportData,
  ItemsRankingReportData,
  CategorySalesReportData,
  FinancialAdjustmentsReportData,
  HourlyTrendsReportData,
  StaffPerformanceReportData,
  ShiftsSummaryReportData,
  OperationsPerformanceReportData,
} from '@/types';

export class ReportsApi {
  /**
   * 1. Executive Sales Summary
   */
  public static async getSalesSummary(
    params?: BaseReportFilter
  ): Promise<SalesSummaryReportData> {
    const response = await apiClient.get<ApiResponse<SalesSummaryReportData>>(
      '/reports/sales-summary',
      { params }
    );
    return response.data;
  }

  /**
   * 2. Sales by Order Type (Channel Breakdown)
   */
  public static async getSalesByOrderType(
    params?: OrderTypeReportFilter
  ): Promise<SalesByOrderTypeReportData> {
    const response = await apiClient.get<ApiResponse<SalesByOrderTypeReportData>>(
      '/reports/by-order-type',
      { params }
    );
    return response.data;
  }

  /**
   * 3. Sales by Payment Method
   */
  public static async getSalesByPaymentMethod(
    params?: PaymentMethodReportFilter
  ): Promise<SalesByPaymentMethodReportData> {
    const response = await apiClient.get<ApiResponse<SalesByPaymentMethodReportData>>(
      '/reports/by-payment-method',
      { params }
    );
    return response.data;
  }

  /**
   * 4. Product / Item Sales Ranking
   */
  public static async getItemsRanking(
    params?: ItemsRankingReportFilter
  ): Promise<ItemsRankingReportData> {
    const response = await apiClient.get<ApiResponse<ItemsRankingReportData>>(
      '/reports/items-ranking',
      { params }
    );
    return response.data;
  }

  /**
   * 5. Category Sales Summary
   */
  public static async getCategorySales(
    params?: BaseReportFilter
  ): Promise<CategorySalesReportData> {
    const response = await apiClient.get<ApiResponse<CategorySalesReportData>>(
      '/reports/by-category',
      { params }
    );
    return response.data;
  }

  /**
   * 6. Financial Adjustments, Taxes, Discounts & Voids
   */
  public static async getFinancialAdjustments(
    params?: BaseReportFilter
  ): Promise<FinancialAdjustmentsReportData> {
    const response = await apiClient.get<ApiResponse<FinancialAdjustmentsReportData>>(
      '/reports/financial-adjustments',
      { params }
    );
    return response.data;
  }

  /**
   * 7. Hourly Sales & Traffic Trends
   */
  public static async getHourlyTrends(
    params?: BaseReportFilter
  ): Promise<HourlyTrendsReportData> {
    const response = await apiClient.get<ApiResponse<HourlyTrendsReportData>>(
      '/reports/hourly-trends',
      { params }
    );
    return response.data;
  }

  /**
   * 8. Staff & Cashier Performance
   */
  public static async getStaffPerformance(
    params?: BaseReportFilter
  ): Promise<StaffPerformanceReportData> {
    const response = await apiClient.get<ApiResponse<StaffPerformanceReportData>>(
      '/reports/staff-performance',
      { params }
    );
    return response.data;
  }

  /**
   * 9. Shift Settlement Summary
   */
  public static async getShiftsSummary(
    params?: BaseReportFilter
  ): Promise<ShiftsSummaryReportData> {
    const response = await apiClient.get<ApiResponse<ShiftsSummaryReportData>>(
      '/reports/shifts-summary',
      { params }
    );
    return response.data;
  }

  /**
   * 10. Operations & Fulfillment Performance
   */
  public static async getOperationsPerformance(
    params?: BaseReportFilter
  ): Promise<OperationsPerformanceReportData> {
    const response = await apiClient.get<ApiResponse<OperationsPerformanceReportData>>(
      '/reports/operations-performance',
      { params }
    );
    return response.data;
  }
}
