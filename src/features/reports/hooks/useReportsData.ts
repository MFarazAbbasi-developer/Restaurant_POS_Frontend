import { useQuery } from '@tanstack/react-query';
import { ReportsApi } from '@/core/api/reportsApi';
import {
  BaseReportFilter,
  OrderTypeReportFilter,
  PaymentMethodReportFilter,
  ItemsRankingReportFilter,
} from '@/types';

export const REPORTS_QUERY_KEYS = {
  SALES_SUMMARY: (params?: BaseReportFilter) =>
    ['reports', 'sales-summary', params] as const,
  ORDER_TYPE: (params?: OrderTypeReportFilter) =>
    ['reports', 'by-order-type', params] as const,
  PAYMENT_METHOD: (params?: PaymentMethodReportFilter) =>
    ['reports', 'by-payment-method', params] as const,
  ITEMS_RANKING: (params?: ItemsRankingReportFilter) =>
    ['reports', 'items-ranking', params] as const,
  CATEGORY_SALES: (params?: BaseReportFilter) =>
    ['reports', 'by-category', params] as const,
  FINANCIAL_ADJUSTMENTS: (params?: BaseReportFilter) =>
    ['reports', 'financial-adjustments', params] as const,
  HOURLY_TRENDS: (params?: BaseReportFilter) =>
    ['reports', 'hourly-trends', params] as const,
  STAFF_PERFORMANCE: (params?: BaseReportFilter) =>
    ['reports', 'staff-performance', params] as const,
  SHIFTS_SUMMARY: (params?: BaseReportFilter) =>
    ['reports', 'shifts-summary', params] as const,
  OPERATIONS_PERFORMANCE: (params?: BaseReportFilter) =>
    ['reports', 'operations-performance', params] as const,
};

export const useSalesSummaryReportQuery = (params?: BaseReportFilter) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.SALES_SUMMARY(params),
    queryFn: () => ReportsApi.getSalesSummary(params),
    staleTime: 1000 * 60,
  });
};

export const useSalesByOrderTypeReportQuery = (params?: OrderTypeReportFilter) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.ORDER_TYPE(params),
    queryFn: () => ReportsApi.getSalesByOrderType(params),
    staleTime: 1000 * 60,
  });
};

export const useSalesByPaymentMethodReportQuery = (
  params?: PaymentMethodReportFilter
) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.PAYMENT_METHOD(params),
    queryFn: () => ReportsApi.getSalesByPaymentMethod(params),
    staleTime: 1000 * 60,
  });
};

export const useItemsRankingReportQuery = (params?: ItemsRankingReportFilter) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.ITEMS_RANKING(params),
    queryFn: () => ReportsApi.getItemsRanking(params),
    staleTime: 1000 * 60,
  });
};

export const useCategorySalesReportQuery = (params?: BaseReportFilter) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.CATEGORY_SALES(params),
    queryFn: () => ReportsApi.getCategorySales(params),
    staleTime: 1000 * 60,
  });
};

export const useFinancialAdjustmentsReportQuery = (params?: BaseReportFilter) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.FINANCIAL_ADJUSTMENTS(params),
    queryFn: () => ReportsApi.getFinancialAdjustments(params),
    staleTime: 1000 * 60,
  });
};

export const useHourlyTrendsReportQuery = (params?: BaseReportFilter) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.HOURLY_TRENDS(params),
    queryFn: () => ReportsApi.getHourlyTrends(params),
    staleTime: 1000 * 60,
  });
};

export const useStaffPerformanceReportQuery = (params?: BaseReportFilter) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.STAFF_PERFORMANCE(params),
    queryFn: () => ReportsApi.getStaffPerformance(params),
    staleTime: 1000 * 60,
  });
};

export const useShiftsSummaryReportQuery = (params?: BaseReportFilter) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.SHIFTS_SUMMARY(params),
    queryFn: () => ReportsApi.getShiftsSummary(params),
    staleTime: 1000 * 60,
  });
};

export const useOperationsPerformanceReportQuery = (params?: BaseReportFilter) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.OPERATIONS_PERFORMANCE(params),
    queryFn: () => ReportsApi.getOperationsPerformance(params),
    staleTime: 1000 * 60,
  });
};
