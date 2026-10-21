import React, { useState, useCallback } from 'react';
import {
  useSalesSummaryReportQuery,
  useSalesByOrderTypeReportQuery,
  useSalesByPaymentMethodReportQuery,
  useItemsRankingReportQuery,
  useCategorySalesReportQuery,
  useFinancialAdjustmentsReportQuery,
  useHourlyTrendsReportQuery,
  useStaffPerformanceReportQuery,
  useShiftsSummaryReportQuery,
  useOperationsPerformanceReportQuery,
} from '@/features/reports/hooks/useReportsData';
import { useCategoriesQuery } from '@/features/menu/hooks/useMenuData';
import { useAuthStore } from '@/core/auth/authStore';
import { usePermissions } from '@/core/auth/usePermissions';
import { formatPrice as centralizedFormatPrice } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  CreditCard,
  Layers,
  Clock,
  Users,
  Truck,
  RotateCw,
  Download,
  Printer,
  AlertTriangle,
  AlertCircle,
  Flame,
  Receipt,
  Tag,
  CheckCircle2,
  XCircle,
  Ban,
} from 'lucide-react';
import { cn } from '@/utils/cn';

type ReportTab =
  'summary' | 'channels' | 'items' | 'hourly' | 'staff_shifts' | 'operations';

type DatePreset = 'today' | 'yesterday' | '7days' | 'month' | 'custom';

/** Local calendar YYYY-MM-DD (avoids UTC day-shift from toISOString). */
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function ReportErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="py-16 flex flex-col items-center justify-center gap-3 text-xs">
      <AlertCircle size={32} className="text-pos-danger" />
      <p className="font-bold text-pos-text">Failed to load report</p>
      <p className="text-pos-text-muted max-w-sm text-center">{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export const ReportsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const canExport = hasPermission('reports.export');
  const currency =
    user && 'restaurant' in user && user.restaurant?.currency
      ? user.restaurant.currency
      : 'PKR';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<ReportTab>('summary');

  // Date filters (business-date based; defaults to local today)
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [startDate, setStartDate] = useState<string>(() => toLocalDateStr(new Date()));
  const [endDate, setEndDate] = useState<string>(() => toLocalDateStr(new Date()));

  // Item Ranking filters
  const [itemCategoryFilter, setItemCategoryFilter] = useState<string>('');
  const [itemSortBy, setItemSortBy] = useState<'revenue' | 'quantity'>('revenue');

  const { data: menuCategories = [] } = useCategoriesQuery();

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();

    if (preset === 'today') {
      const d = toLocalDateStr(today);
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const d = toLocalDateStr(y);
      setStartDate(d);
      setEndDate(d);
    } else if (preset === '7days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 6);
      setStartDate(toLocalDateStr(past));
      setEndDate(toLocalDateStr(today));
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(toLocalDateStr(firstDay));
      setEndDate(toLocalDateStr(today));
    }
  };

  const filterParams = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  // Queries for active tabs
  const summaryQuery = useSalesSummaryReportQuery(filterParams);
  const channelsQuery = useSalesByOrderTypeReportQuery(filterParams);
  const paymentsQuery = useSalesByPaymentMethodReportQuery(filterParams);
  const itemsRankingQuery = useItemsRankingReportQuery({
    ...filterParams,
    categoryId: itemCategoryFilter || undefined,
    sortBy: itemSortBy,
    limit: 50,
  });
  const categorySalesQuery = useCategorySalesReportQuery(filterParams);
  const financialAdjQuery = useFinancialAdjustmentsReportQuery(filterParams);
  const hourlyTrendsQuery = useHourlyTrendsReportQuery(filterParams);
  const staffQuery = useStaffPerformanceReportQuery(filterParams);
  const shiftsSummaryQuery = useShiftsSummaryReportQuery(filterParams);
  const operationsQuery = useOperationsPerformanceReportQuery(filterParams);

  const handleRefreshCurrent = () => {
    if (activeTab === 'summary') summaryQuery.refetch();
    if (activeTab === 'channels') {
      channelsQuery.refetch();
      paymentsQuery.refetch();
    }
    if (activeTab === 'items') {
      itemsRankingQuery.refetch();
      categorySalesQuery.refetch();
    }
    if (activeTab === 'hourly') hourlyTrendsQuery.refetch();
    if (activeTab === 'staff_shifts') {
      staffQuery.refetch();
      shiftsSummaryQuery.refetch();
      financialAdjQuery.refetch();
    }
    if (activeTab === 'operations') operationsQuery.refetch();
  };

  const formatPrice = useCallback((val: number | string | null | undefined) => {
    return centralizedFormatPrice(val, currency);
  }, [currency]);

  const totalRefundsCollected =
    paymentsQuery.data?.methods.reduce((acc, m) => acc + (m.refundAmount || 0), 0) ?? 0;

  // CSV Export utility — uses backend field names only
  const handleExportCSV = () => {
    if (!canExport) return;

    let rows: string[][] = [];
    const filename = `report_${activeTab}_${startDate}_to_${endDate}.csv`;

    if (activeTab === 'summary' && summaryQuery.data) {
      const s = summaryQuery.data.summary;
      const m = summaryQuery.data.ordersMetrics;
      rows = [
        ['Metric', 'Value'],
        ['Start Date', startDate],
        ['End Date', endDate],
        ['Gross Sales', s.grossSales.toString()],
        ['Total Discounts', s.totalDiscounts.toString()],
        ['Net Sales', s.netSales.toString()],
        ['Tax Collected', s.taxCollected.toString()],
        ['Service Charges', s.serviceCharges.toString()],
        ['Delivery Charges', s.deliveryCharges.toString()],
        ['Packaging Charges', s.packagingCharges.toString()],
        ['Grand Total', s.grandTotal.toString()],
        ['Total Payments Collected', s.totalPaymentsCollected.toString()],
        ['Refunds Issued', totalRefundsCollected.toString()],
        ['Outstanding Balance', s.outstandingBalance.toString()],
        ['Valid Orders', m.validOrdersCount.toString()],
        ['Completed Orders', m.completedOrdersCount.toString()],
        ['Cancelled Orders', m.cancelledOrdersCount.toString()],
        ['Voided Orders', m.voidedOrdersCount.toString()],
        ['Average Order Value', m.averageOrderValue.toString()],
      ];
    } else if (activeTab === 'items' && itemsRankingQuery.data) {
      rows = [
        [
          'Rank',
          'Item Name',
          'Item Code',
          'Category',
          'Quantity Sold',
          'Net Revenue',
          'Revenue Share %',
        ],
        ...itemsRankingQuery.data.items.map((it, idx) => [
          (idx + 1).toString(),
          it.name,
          it.itemCode,
          it.categoryName,
          it.quantitySold.toString(),
          it.netRevenue.toString(),
          it.revenueShare.toString(),
        ]),
      ];
    } else if (activeTab === 'channels' && channelsQuery.data) {
      rows = [
        [
          'Order Type',
          'Order Count',
          'Gross Sales',
          'Discounts',
          'Net Sales',
          'Grand Total',
          'Average Ticket',
          'Percentage of Total',
        ],
        ...channelsQuery.data.channels.map(b => [
          b.orderType,
          b.orderCount.toString(),
          b.grossSales.toString(),
          b.discounts.toString(),
          b.netSales.toString(),
          b.grandTotal.toString(),
          b.averageTicket.toString(),
          b.percentageOfTotal.toString(),
        ]),
      ];
      if (paymentsQuery.data) {
        rows.push([]);
        rows.push([
          'Payment Method',
          'Transactions',
          'Gross Collected',
          'Refunds',
          'Net Collected',
          '% of Gross',
        ]);
        for (const m of paymentsQuery.data.methods) {
          rows.push([
            m.paymentMethod,
            m.transactionCount.toString(),
            m.grossAmount.toString(),
            m.refundAmount.toString(),
            m.netAmount.toString(),
            m.percentageOfTotal.toString(),
          ]);
        }
      }
    } else if (activeTab === 'staff_shifts' && shiftsSummaryQuery.data) {
      rows = [
        [
          'Register',
          'Cashier',
          'Business Date',
          'Status',
          'Opening Cash',
          'Cash Sales',
          'Expected',
          'Counted',
          'Variance',
        ],
        ...shiftsSummaryQuery.data.shifts.map(s => [
          s.registerName,
          s.cashierName,
          s.businessDate,
          s.status,
          s.openingCash.toString(),
          s.cashSales.toString(),
          (s.expectedClosingCash ?? '').toString(),
          (s.actualClosingCash ?? '').toString(),
          (s.variance ?? '').toString(),
        ]),
      ];
    } else {
      rows = [
        ['Report Export', activeTab],
        ['Start Date', startDate],
        ['End Date', endDate],
      ];
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = summaryQuery.data?.summary;
  const metrics = summaryQuery.data?.ordersMetrics;

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden select-none -m-4 md:-m-6 p-3 sm:p-4 bg-pos-bg">
      <div className="flex-1 flex flex-col min-w-0 bg-pos-surface border border-pos-border rounded-lg overflow-hidden shadow-xs">
        {/* =========================================================================
            TOP HEADER BAR: Date Filters & Action CTAs
        ========================================================================= */}
        <div className="p-3 sm:p-3.5 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <BarChart3 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-pos-text">
                  Reports & Business Intelligence
                </h2>
                <Badge variant="default" size="sm" className="text-[10px] font-mono">
                  {startDate} → {endDate}
                </Badge>
              </div>
              <p className="text-[11px] text-pos-text-muted mt-0.5 font-medium">
                Sales breakdown, channel distribution, top products, shift settlement, and
                operational KPIs
              </p>
            </div>
          </div>

          {/* Date Filter Presets & Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Preset Buttons */}
            <div className="p-1 rounded-md bg-pos-surface-subtle border border-pos-border flex items-center gap-1">
              {(['today', 'yesterday', '7days', 'month', 'custom'] as DatePreset[]).map(
                p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleDatePresetChange(p)}
                    className={cn(
                      'px-2.5 py-1 rounded-md font-semibold transition-colors text-xs',
                      datePreset === p
                        ? 'bg-pos-primary text-white shadow-xs'
                        : 'text-pos-text-secondary hover:text-pos-text'
                    )}
                  >
                    {p === 'today'
                      ? 'Today'
                      : p === 'yesterday'
                        ? 'Yesterday'
                        : p === '7days'
                          ? 'Last 7D'
                          : p === 'month'
                            ? 'This Month'
                            : 'Custom'}
                  </button>
                )
              )}
            </div>

            {/* Custom Date Pickers */}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-1 bg-pos-surface-subtle p-1 rounded-md border border-pos-border">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="px-2 py-1 rounded-md bg-pos-surface border border-pos-border text-pos-text text-xs"
                />
                <span className="text-pos-text-muted">→</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="px-2 py-1 rounded-md bg-pos-surface border border-pos-border text-pos-text text-xs"
                />
              </div>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefreshCurrent}
              className="min-h-[34px] px-2.5 font-medium flex items-center gap-1"
            >
              <RotateCw size={13} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {canExport && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportCSV}
                className="min-h-[34px] px-2.5 font-medium flex items-center gap-1"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              className="min-h-[34px] px-2.5 font-medium flex items-center gap-1"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print</span>
            </Button>
          </div>
        </div>

        {/* =========================================================================
          SUMMARY METRICS TILES
      ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 p-3 border-b border-pos-border bg-pos-surface shrink-0">
          <div className="p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-primary block">
              Net Sales
            </span>
            <span className="text-base font-mono font-bold text-pos-primary mt-0.5 block">
              {formatPrice(summary?.netSales || 0)}
            </span>
            <span className="text-[10px] text-pos-text-muted">
              Gross {formatPrice(summary?.grossSales || 0)} · Disc{' '}
              {formatPrice(summary?.totalDiscounts || 0)}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary block">
              Orders
            </span>
            <span className="text-base font-mono font-bold text-pos-text mt-0.5 block">
              {metrics?.validOrdersCount || 0} Valid
            </span>
            <span className="text-[10px] text-pos-text-muted">
              Completed {metrics?.completedOrdersCount || 0} · Tax{' '}
              {formatPrice(summary?.taxCollected || 0)}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary block">
              AOV
            </span>
            <span className="text-base font-mono font-bold text-pos-text mt-0.5 block">
              {formatPrice(metrics?.averageOrderValue || 0)}
            </span>
            <span className="text-[10px] text-pos-text-muted">Per valid order</span>
          </div>

          <div className="p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-success block">
              Payments Collected
            </span>
            <span className="text-base font-mono font-bold text-pos-success mt-0.5 block">
              {formatPrice(summary?.totalPaymentsCollected || 0)}
            </span>
            <span className="text-[10px] text-pos-text-muted">
              {summary?.totalPaymentsCount || 0} tx · not voided
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-danger block">
              Refunds Issued
            </span>
            <span className="text-base font-mono font-bold text-pos-danger mt-0.5 block">
              {formatPrice(totalRefundsCollected)}
            </span>
            <span className="text-[10px] text-pos-text-muted">
              From payment-method report
            </span>
          </div>
        </div>

        {/* =========================================================================
          REPORT VIEW TABS
      ========================================================================= */}
        <div className="p-3 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="p-1 rounded-md bg-pos-surface-subtle border border-pos-border flex items-center gap-1 text-xs overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap',
                activeTab === 'summary'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              <TrendingUp size={13} />
              <span>Executive Sales</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('channels')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap',
                activeTab === 'channels'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              <CreditCard size={13} />
              <span>Channels & Payments</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap',
                activeTab === 'items'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              <Layers size={13} />
              <span>Products & Categories</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hourly')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap',
                activeTab === 'hourly'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              <Clock size={13} />
              <span>Hourly Trends</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('staff_shifts')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap',
                activeTab === 'staff_shifts'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              <Users size={13} />
              <span>Staff & Shifts Audit</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('operations')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap',
                activeTab === 'operations'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              <Truck size={13} />
              <span>Operations & Speed</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
          MAIN REPORT CONTENT CONTAINER
      ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-pos-bg">
          {/* VIEW 1: EXECUTIVE SALES SUMMARY */}
          {activeTab === 'summary' && (
            <div>
              {summaryQuery.isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                  <Spinner size="lg" />
                  <span>Generating Executive Sales Summary...</span>
                </div>
              ) : summaryQuery.isError ? (
                <ReportErrorState
                  message={
                    summaryQuery.error instanceof Error
                      ? summaryQuery.error.message
                      : 'Unable to load sales summary.'
                  }
                  onRetry={() => summaryQuery.refetch()}
                />
              ) : !summary ||
                ((metrics?.totalOrdersCount || 0) === 0 &&
                  (summary.totalPaymentsCount || 0) === 0) ? (
                <div className="py-24 text-center text-xs text-pos-text-muted">
                  No sales data recorded for {startDate}
                  {startDate !== endDate ? ` → ${endDate}` : ''}.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Financial Overview Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Revenue Breakdown */}
                    <div className="p-4 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                        <DollarSign size={14} className="text-pos-primary" />
                        <span>Sales & Revenue Statement</span>
                      </h4>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-md bg-pos-surface-subtle border border-pos-border">
                          <span className="font-semibold text-pos-text">
                            Gross Sales (Items Subtotal)
                          </span>
                          <span className="font-mono font-bold text-pos-text">
                            {formatPrice(summary.grossSales)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-md bg-pos-surface-subtle border border-pos-border text-pos-danger">
                          <span className="font-semibold">Total Discounts Given</span>
                          <span className="font-mono font-bold">
                            -{formatPrice(summary.totalDiscounts)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-md bg-pos-primary-soft border border-pos-primary/20 font-bold">
                          <span className="text-pos-primary font-bold">Net Sales</span>
                          <span className="font-mono text-base font-bold text-pos-primary">
                            {formatPrice(summary.netSales)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="p-2 rounded-md bg-pos-surface-subtle border border-pos-border text-[11px]">
                            <span className="text-pos-text-muted block">
                              Tax Collected:
                            </span>
                            <span className="font-mono font-bold text-pos-text">
                              {formatPrice(summary.taxCollected)}
                            </span>
                          </div>
                          <div className="p-2 rounded-md bg-pos-surface-subtle border border-pos-border text-[11px]">
                            <span className="text-pos-text-muted block">
                              Service Charges:
                            </span>
                            <span className="font-mono font-bold text-pos-text">
                              {formatPrice(summary.serviceCharges)}
                            </span>
                          </div>
                          <div className="p-2 rounded-md bg-pos-surface-subtle border border-pos-border text-[11px]">
                            <span className="text-pos-text-muted block">
                              Delivery Fees:
                            </span>
                            <span className="font-mono font-bold text-pos-text">
                              {formatPrice(summary.deliveryCharges)}
                            </span>
                          </div>
                          <div className="p-2 rounded-md bg-pos-surface-subtle border border-pos-border text-[11px]">
                            <span className="text-pos-text-muted block">
                              Packaging Fees:
                            </span>
                            <span className="font-mono font-bold text-pos-text">
                              {formatPrice(summary.packagingCharges)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-md bg-pos-surface border border-pos-border text-sm font-bold shadow-xs">
                          <span className="text-pos-text">Grand Total Billed</span>
                          <span className="font-mono text-pos-text">
                            {formatPrice(summary.grandTotal)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Volume & Fulfillment Health */}
                    <div className="p-4 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                        <Receipt size={14} className="text-pos-primary" />
                        <span>Order Fulfillment & Status Volume</span>
                      </h4>

                      <div className="space-y-2.5 text-xs">
                        <div className="p-3 rounded-md bg-pos-surface-subtle border border-pos-border flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-pos-success" />
                            <div>
                              <span className="font-bold text-pos-text block">
                                Completed Orders
                              </span>
                              <span className="text-[10px] text-pos-text-muted">
                                Successfully fulfilled and closed
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-sm text-pos-success">
                            {metrics?.completedOrdersCount || 0}
                          </span>
                        </div>

                        <div className="p-3 rounded-md bg-pos-surface-subtle border border-pos-border flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <XCircle size={16} className="text-pos-danger" />
                            <div>
                              <span className="font-bold text-pos-text block">
                                Cancelled Orders
                              </span>
                              <span className="text-[10px] text-pos-text-muted">
                                Lost revenue: {formatPrice(metrics?.cancelledValue || 0)}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-sm text-pos-danger">
                            {metrics?.cancelledOrdersCount || 0}
                          </span>
                        </div>

                        <div className="p-3 rounded-md bg-pos-surface-subtle border border-pos-border flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Ban size={16} className="text-pos-text-muted" />
                            <div>
                              <span className="font-bold text-pos-text block">
                                Voided Checks
                              </span>
                              <span className="text-[10px] text-pos-text-muted">
                                Voided value: {formatPrice(metrics?.voidedValue || 0)}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-sm text-pos-text-muted">
                            {metrics?.voidedOrdersCount || 0}
                          </span>
                        </div>

                        <div className="p-3 rounded-md bg-pos-surface border border-pos-border text-xs flex items-center justify-between shadow-xs">
                          <span className="text-pos-text-secondary font-medium">
                            Outstanding Unpaid Balance
                          </span>
                          <span className="font-mono font-bold text-pos-danger">
                            {formatPrice(summary.outstandingBalance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: CHANNELS & PAYMENTS */}
          {activeTab === 'channels' && (
            <div>
              {channelsQuery.isLoading || paymentsQuery.isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                  <Spinner size="lg" />
                  <span>Loading Channels & Payments Breakdown...</span>
                </div>
              ) : channelsQuery.isError || paymentsQuery.isError ? (
                <ReportErrorState
                  message={
                    (channelsQuery.error instanceof Error
                      ? channelsQuery.error.message
                      : null) ||
                    (paymentsQuery.error instanceof Error
                      ? paymentsQuery.error.message
                      : null) ||
                    'Unable to load channel/payment reports.'
                  }
                  onRetry={() => {
                    channelsQuery.refetch();
                    paymentsQuery.refetch();
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sales by Channel */}
                  <div className="p-4 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                      <Truck size={14} className="text-pos-primary" />
                      <span>Sales by Channel</span>
                    </h4>
                    {channelsQuery.data?.channels &&
                    channelsQuery.data.channels.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-[11px] text-pos-text-muted font-mono">
                          Channel revenue total:{' '}
                          {formatPrice(channelsQuery.data.totalRevenue)}
                        </p>
                        {channelsQuery.data.channels.map(ch => (
                          <div
                            key={ch.orderType}
                            className="p-3 rounded-md bg-pos-surface-subtle border border-pos-border space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-pos-text">
                                {ch.orderType.replace(/_/g, ' ')} ({ch.orderCount}{' '}
                                orders)
                              </span>
                              <span className="font-mono font-bold text-pos-primary text-sm">
                                {formatPrice(ch.grandTotal)} ({ch.percentageOfTotal}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-pos-surface rounded-full overflow-hidden border border-pos-border">
                              <div
                                className="h-full bg-pos-primary transition-all rounded-full"
                                style={{
                                  width: `${Math.min(100, ch.percentageOfTotal)}%`,
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-pos-text-muted pt-1">
                              <span>Net: {formatPrice(ch.netSales)}</span>
                              <span>Disc: {formatPrice(ch.discounts)}</span>
                              <span>AOV: {formatPrice(ch.averageTicket)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-pos-text-muted">
                        No channel sales data for this period.
                      </div>
                    )}
                  </div>

                  {/* Sales by Payment Method */}
                  <div className="p-4 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                      <CreditCard size={14} className="text-pos-primary" />
                      <span>Sales by Payment Method</span>
                    </h4>
                    {paymentsQuery.data?.methods &&
                    paymentsQuery.data.methods.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-[11px] text-pos-text-muted font-mono">
                          Gross collected:{' '}
                          {formatPrice(paymentsQuery.data.totalCollected)} · Refunds:{' '}
                          {formatPrice(totalRefundsCollected)}
                        </p>
                        {paymentsQuery.data.methods.map(pm => (
                          <div
                            key={pm.paymentMethod}
                            className="p-3 rounded-md bg-pos-surface-subtle border border-pos-border space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-pos-text">
                                {pm.paymentMethod} ({pm.transactionCount} tx)
                              </span>
                              <span className="font-mono font-bold text-pos-success text-sm">
                                Net {formatPrice(pm.netAmount)} ({pm.percentageOfTotal}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-pos-surface rounded-full overflow-hidden border border-pos-border">
                              <div
                                className="h-full bg-pos-success transition-all rounded-full"
                                style={{
                                  width: `${Math.min(100, pm.percentageOfTotal)}%`,
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-pos-text-muted pt-1">
                              <span>Gross: {formatPrice(pm.grossAmount)}</span>
                              <span className="text-pos-danger">
                                Refunds: {formatPrice(pm.refundAmount)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-pos-text-muted">
                        No payment transactions for this period.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: PRODUCT & CATEGORY SALES */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              {/* Toolbar for Product Ranking */}
              <div className="p-3 rounded-lg bg-pos-surface border border-pos-border flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-xs">
                <div className="flex items-center gap-2">
                  <select
                    value={itemCategoryFilter}
                    onChange={e => setItemCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                  >
                    <option value="">All Menu Categories</option>
                    {menuCategories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <div className="p-1 rounded-md bg-pos-surface-subtle border border-pos-border flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setItemSortBy('revenue')}
                      className={cn(
                        'px-2.5 py-1 rounded-md font-semibold transition-colors text-xs',
                        itemSortBy === 'revenue'
                          ? 'bg-pos-primary text-white shadow-xs'
                          : 'text-pos-text-secondary hover:text-pos-text'
                      )}
                    >
                      By Revenue
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemSortBy('quantity')}
                      className={cn(
                        'px-2.5 py-1 rounded-md font-semibold transition-colors text-xs',
                        itemSortBy === 'quantity'
                          ? 'bg-pos-primary text-white shadow-xs'
                          : 'text-pos-text-secondary hover:text-pos-text'
                      )}
                    >
                      By Volume Sold
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Product Ranking Table */}
                <div className="lg:col-span-2 p-4 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                    <Flame size={14} className="text-pos-primary" />
                    <span>Top-Selling Menu Products</span>
                  </h4>

                  {itemsRankingQuery.isLoading ? (
                    <div className="py-16 flex justify-center">
                      <Spinner size="md" />
                    </div>
                  ) : !itemsRankingQuery.data?.items ||
                    itemsRankingQuery.data.items.length === 0 ? (
                    <div className="py-12 text-center text-xs text-pos-text-muted">
                      No menu items sold in the selected period.
                    </div>
                  ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-pos-border text-pos-text-muted text-[10px] uppercase tracking-wider font-semibold">
                            <th className="py-2 px-1">#</th>
                            <th className="py-2 px-2">Item Name</th>
                            <th className="py-2 px-2">Category</th>
                            <th className="py-2 px-2 text-right">Qty Sold</th>
                            <th className="py-2 px-2 text-right">Net Revenue</th>
                            <th className="py-2 px-2 text-right">Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-pos-border">
                          {itemsRankingQuery.data.items.map((item, idx) => (
                            <tr
                              key={item.menuItemId}
                              className="hover:bg-pos-surface-subtle transition-colors"
                            >
                              <td className="py-2.5 px-1 font-mono font-bold text-pos-text-muted">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-2">
                                <span className="font-bold text-pos-text block">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-pos-text-muted font-mono">
                                  {item.itemCode}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-pos-text-muted">
                                <Badge variant="default" size="sm" className="text-[9px]">
                                  {item.categoryName}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono font-bold text-pos-text">
                                {item.quantitySold}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono font-bold text-pos-primary">
                                {formatPrice(item.netRevenue)}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono text-pos-text-muted">
                                {item.revenueShare}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Category Contribution */}
                <div className="p-4 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                    <Tag size={14} className="text-pos-primary" />
                    <span>Category Revenue Share</span>
                  </h4>

                  {categorySalesQuery.isLoading ? (
                    <div className="py-16 flex justify-center">
                      <Spinner size="md" />
                    </div>
                  ) : !categorySalesQuery.data?.categories ||
                    categorySalesQuery.data.categories.length === 0 ? (
                    <div className="py-12 text-center text-xs text-pos-text-muted">
                      No category sales data.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {categorySalesQuery.data.categories.map(c => (
                        <div
                          key={c.categoryId}
                          className="p-2.5 rounded-md bg-pos-surface-subtle border border-pos-border space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-pos-text">
                              {c.categoryName}
                            </span>
                            <span className="font-mono font-bold text-pos-primary">
                              {formatPrice(c.netRevenue)} ({c.revenueShare}%)
                            </span>
                          </div>

                          <div className="h-1.5 w-full bg-pos-surface rounded-full overflow-hidden border border-pos-border">
                            <div
                              className="h-full bg-pos-primary transition-all rounded-full"
                              style={{ width: `${Math.min(100, c.revenueShare)}%` }}
                            />
                          </div>

                          <div className="text-[10px] text-pos-text-muted flex items-center justify-between pt-0.5">
                            <span>{c.itemsSold} units sold</span>
                            <span>Gross {formatPrice(c.grossRevenue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: HOURLY TRENDS */}
          {activeTab === 'hourly' && (
            <div>
              {hourlyTrendsQuery.isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                  <Spinner size="lg" />
                  <span>Analyzing 24-Hour Traffic Patterns...</span>
                </div>
              ) : !hourlyTrendsQuery.data ? (
                <div className="py-24 text-center text-xs text-pos-text-muted">
                  No hourly trend data available for this date range.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Peak Hour Callout */}
                  {hourlyTrendsQuery.data.peakHour && (
                    <div className="p-4 rounded-lg bg-pos-primary-soft border border-pos-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-pos-primary text-white flex items-center justify-center font-bold shadow-xs">
                          <Flame size={18} />
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-primary block">
                            Peak Dining Rush Hour
                          </span>
                          <span className="text-base font-bold text-pos-text">
                            {hourlyTrendsQuery.data.peakHour.hourLabel}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-[10px] text-pos-text-muted block">
                          Peak Hour Revenue
                        </span>
                        <span className="text-lg font-bold text-pos-primary">
                          {formatPrice(hourlyTrendsQuery.data.peakHour.revenue)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 24-Hour Timeline Grid */}
                  <div className="p-4 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary">
                      Hourly Sales & Volume Timeline (
                      {hourlyTrendsQuery.data.totalOrders} orders)
                    </h4>

                    <div className="space-y-2">
                      {hourlyTrendsQuery.data.hourlyDistribution.map(h => {
                        const maxSales = Math.max(
                          ...hourlyTrendsQuery.data!.hourlyDistribution.map(
                            x => x.grandTotal
                          ),
                          1
                        );
                        const percent = Math.round((h.grandTotal / maxSales) * 100);

                        return (
                          <div
                            key={h.hour}
                            className="p-2 rounded-md bg-pos-surface-subtle border border-pos-border text-xs flex items-center gap-3"
                          >
                            <span className="font-mono font-bold text-pos-text w-24 text-[11px] shrink-0">
                              {h.hourLabel}
                            </span>

                            <div className="flex-1 h-2.5 bg-pos-surface rounded-full overflow-hidden border border-pos-border">
                              <div
                                className="h-full bg-pos-primary transition-all rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>

                            <div className="flex items-center gap-3 shrink-0 text-right font-mono text-[11px]">
                              <span className="text-pos-text-muted">
                                {h.orderCount} orders
                              </span>
                              <span className="font-bold text-pos-primary w-24">
                                {formatPrice(h.grandTotal)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 5: STAFF & SHIFTS AUDIT */}
          {activeTab === 'staff_shifts' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Staff Performance */}
                <div className="p-4 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                    <Users size={14} className="text-pos-primary" />
                    <span>Staff & Cashier Sales Performance</span>
                  </h4>

                  {staffQuery.isLoading ? (
                    <div className="py-16 flex justify-center">
                      <Spinner size="md" />
                    </div>
                  ) : staffQuery.isError ? (
                    <ReportErrorState
                      message={
                        staffQuery.error instanceof Error
                          ? staffQuery.error.message
                          : 'Unable to load staff performance.'
                      }
                      onRetry={() => staffQuery.refetch()}
                    />
                  ) : !staffQuery.data?.staff || staffQuery.data.staff.length === 0 ? (
                    <div className="py-12 text-center text-xs text-pos-text-muted">
                      No staff sales activity in this period.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {staffQuery.data.staff.map(st => (
                        <div
                          key={st.staffId}
                          className="p-3 rounded-md bg-pos-surface-subtle border border-pos-border space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-pos-text block">
                                {st.name}
                              </span>
                              <span className="text-[10px] text-pos-text-muted font-mono">
                                @{st.username} · {st.shiftsCount} shifts
                              </span>
                            </div>
                            <span className="font-mono font-bold text-sm text-pos-primary">
                              {formatPrice(st.totalRevenue)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-pos-text-muted pt-1 border-t border-pos-border">
                            <span>{st.ordersProcessed} orders processed</span>
                            <span>
                              Gross {formatPrice(st.grossSales)} · Disc{' '}
                              {formatPrice(st.totalDiscounts)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Shift Settlement Summary */}
                <div className="p-4 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                    <RotateCw size={14} className="text-pos-primary" />
                    <span>Register Shift Settlements & Cash Variance</span>
                  </h4>

                  {shiftsSummaryQuery.isLoading ? (
                    <div className="py-16 flex justify-center">
                      <Spinner size="md" />
                    </div>
                  ) : shiftsSummaryQuery.isError ? (
                    <ReportErrorState
                      message={
                        shiftsSummaryQuery.error instanceof Error
                          ? shiftsSummaryQuery.error.message
                          : 'Unable to load shift settlements.'
                      }
                      onRetry={() => shiftsSummaryQuery.refetch()}
                    />
                  ) : !shiftsSummaryQuery.data?.shifts ||
                    shiftsSummaryQuery.data.shifts.length === 0 ? (
                    <div className="py-12 text-center text-xs text-pos-text-muted">
                      No shifts logged in this period.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar">
                      {shiftsSummaryQuery.data.summary && (
                        <div className="p-2.5 rounded-md bg-pos-surface border border-pos-border text-[11px] font-mono grid grid-cols-2 gap-1">
                          <span>
                            Shifts: {shiftsSummaryQuery.data.summary.totalShifts}
                          </span>
                          <span>
                            Cash sales:{' '}
                            {formatPrice(
                              shiftsSummaryQuery.data.summary.totalCashSales
                            )}
                          </span>
                          <span>
                            Expected:{' '}
                            {formatPrice(
                              shiftsSummaryQuery.data.summary.totalExpectedCash
                            )}
                          </span>
                          <span
                            className={cn(
                              shiftsSummaryQuery.data.summary.totalVariance < 0
                                ? 'text-pos-danger'
                                : shiftsSummaryQuery.data.summary.totalVariance > 0
                                  ? 'text-pos-success'
                                  : ''
                            )}
                          >
                            Variance:{' '}
                            {formatPrice(shiftsSummaryQuery.data.summary.totalVariance)}
                          </span>
                        </div>
                      )}
                      {shiftsSummaryQuery.data.shifts.map(sh => (
                        <div
                          key={sh.id}
                          className="p-3 rounded-md bg-pos-surface-subtle border border-pos-border space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-pos-text block">
                                {sh.registerName}
                              </span>
                              <span className="text-[10px] text-pos-text-muted">
                                {sh.cashierName} · {sh.businessDate}
                              </span>
                            </div>
                            <Badge
                              variant={sh.status === 'CLOSED' ? 'default' : 'success'}
                              size="sm"
                              className="text-[9px]"
                            >
                              {sh.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div>
                              <span className="text-pos-text-muted block">
                                Cash sales:
                              </span>
                              <span className="font-mono font-bold text-pos-text">
                                {formatPrice(sh.cashSales)}
                              </span>
                            </div>
                            <div>
                              <span className="text-pos-text-muted block">Opening:</span>
                              <span className="font-mono font-bold text-pos-text">
                                {formatPrice(sh.openingCash)}
                              </span>
                            </div>
                            <div>
                              <span className="text-pos-text-muted block">Expected:</span>
                              <span className="font-mono font-bold text-pos-text">
                                {sh.expectedClosingCash != null
                                  ? formatPrice(sh.expectedClosingCash)
                                  : '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-pos-text-muted block">Counted:</span>
                              <span className="font-mono font-bold text-pos-text">
                                {sh.actualClosingCash != null
                                  ? formatPrice(sh.actualClosingCash)
                                  : '—'}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-pos-text-muted block">Variance:</span>
                              <span
                                className={cn(
                                  'font-mono font-bold',
                                  (sh.variance ?? 0) < 0
                                    ? 'text-pos-danger'
                                    : (sh.variance ?? 0) > 0
                                      ? 'text-pos-success'
                                      : 'text-pos-text'
                                )}
                              >
                                {sh.variance != null ? formatPrice(sh.variance) : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Adjustments summary (backend contract) */}
              {financialAdjQuery.isLoading ? (
                <div className="py-8 flex justify-center">
                  <Spinner size="md" />
                </div>
              ) : financialAdjQuery.data ? (
                <div className="p-4 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-pos-danger" />
                    <span>Tax, Discounts, Voids & Cancellations</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-md bg-pos-surface-subtle border border-pos-border">
                      <span className="text-[10px] text-pos-text-muted block">Tax</span>
                      <span className="font-mono font-bold">
                        {formatPrice(financialAdjQuery.data.taxes.totalTaxCollected)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-md bg-pos-surface-subtle border border-pos-border">
                      <span className="text-[10px] text-pos-text-muted block">
                        Discounts
                      </span>
                      <span className="font-mono font-bold text-pos-danger">
                        {formatPrice(financialAdjQuery.data.discounts.totalDiscounts)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-md bg-pos-surface-subtle border border-pos-border">
                      <span className="text-[10px] text-pos-text-muted block">
                        Voids ({financialAdjQuery.data.voids.voidedOrdersCount})
                      </span>
                      <span className="font-mono font-bold text-pos-danger">
                        {formatPrice(financialAdjQuery.data.voids.voidedOrdersValue)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-md bg-pos-surface-subtle border border-pos-border">
                      <span className="text-[10px] text-pos-text-muted block">
                        Cancelled (
                        {financialAdjQuery.data.cancellations.cancelledOrdersCount})
                      </span>
                      <span className="font-mono font-bold text-pos-danger">
                        {formatPrice(
                          financialAdjQuery.data.cancellations.cancelledOrdersValue
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* VIEW 6: OPERATIONS */}
          {activeTab === 'operations' && (
            <div>
              {operationsQuery.isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                  <Spinner size="lg" />
                  <span>Loading Operations Performance...</span>
                </div>
              ) : operationsQuery.isError ? (
                <ReportErrorState
                  message={
                    operationsQuery.error instanceof Error
                      ? operationsQuery.error.message
                      : 'Unable to load operations report.'
                  }
                  onRetry={() => operationsQuery.refetch()}
                />
              ) : !operationsQuery.data ? (
                <div className="py-24 text-center text-xs text-pos-text-muted">
                  No operations data recorded.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary block">
                        Delivery Orders
                      </span>
                      <span className="text-xl font-bold font-mono text-pos-primary block">
                        {operationsQuery.data.delivery.totalOrders}
                      </span>
                      <span className="text-[10px] text-pos-text-muted">
                        {operationsQuery.data.delivery.completedDeliveries} completed ·{' '}
                        {operationsQuery.data.delivery.cancelledDeliveries} cancelled
                      </span>
                    </div>

                    <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary block">
                        Delivery Fees
                      </span>
                      <span className="text-xl font-bold font-mono text-pos-text block">
                        {formatPrice(operationsQuery.data.delivery.totalDeliveryFees)}
                      </span>
                      <span className="text-[10px] text-pos-text-muted">
                        Charged on delivery orders
                      </span>
                    </div>

                    <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary block">
                        Takeaway Orders
                      </span>
                      <span className="text-xl font-bold font-mono text-pos-text block">
                        {operationsQuery.data.takeaway.totalOrders}
                      </span>
                      <span className="text-[10px] text-pos-text-muted">
                        Valid takeaway volume
                      </span>
                    </div>
                  </div>

                  {operationsQuery.data.delivery.ridersBreakdown.length > 0 && (
                    <div className="p-4 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                        <Truck size={14} className="text-pos-primary" />
                        <span>Rider Fulfillment</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {operationsQuery.data.delivery.ridersBreakdown.map(r => (
                          <div
                            key={r.riderName}
                            className="p-3 rounded-md bg-pos-surface-subtle border border-pos-border space-y-1 text-xs"
                          >
                            <span className="font-bold text-pos-text block">
                              {r.riderName}
                            </span>
                            <span className="text-[11px] text-pos-text-muted">
                              {r.deliveriesCount} deliveries assigned
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
