import React, { useState } from 'react';
import {
  useCurrentShiftQuery,
  usePastShiftsQuery,
  usePaymentsListQuery,
} from '@/features/shifts/hooks/useShiftsData';
import { ShiftsApi } from '@/core/api/shiftsApi';
import { useAuthStore } from '@/core/auth/authStore';
import { usePermissions } from '@/core/auth/usePermissions';
import {
  ShiftSummaryData,
  PaymentRecord,
  CashierShiftRecord,
  CashTransactionType,
  ShiftStatus,
} from '@/types';
import { OpenShiftModal } from '@/features/shifts/components/OpenShiftModal';
import { CashDropModal } from '@/features/shifts/components/CashDropModal';
import { CashAdjustmentModal } from '@/features/shifts/components/CashAdjustmentModal';
import { CloseShiftModal } from '@/features/shifts/components/CloseShiftModal';
import { RefundModal } from '@/features/shifts/components/RefundModal';
import { ShiftSummaryDrawer } from '@/features/shifts/components/ShiftSummaryDrawer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  Wallet,
  RotateCw,
  Plus,
  Lock,
  ArrowDownCircle,
  ArrowUpRight,
  Receipt,
  History,
  Building,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';

function cashTxMeta(type: CashTransactionType | string): {
  short: string;
  tone: string;
  isOutflow: boolean;
} {
  switch (type) {
    case 'OPENING_FLOAT':
      return {
        short: 'OF',
        tone: 'bg-pos-primary-soft text-pos-primary',
        isOutflow: false,
      };
    case 'CASH_SALE':
      return {
        short: 'CS',
        tone: 'bg-pos-success-soft text-pos-success',
        isOutflow: false,
      };
    case 'PAY_IN':
      return {
        short: 'PI',
        tone: 'bg-pos-success-soft text-pos-success',
        isOutflow: false,
      };
    case 'CASH_DROP':
      return {
        short: 'CD',
        tone: 'bg-pos-warning-soft text-pos-warning',
        isOutflow: true,
      };
    case 'CASH_REFUND':
      return {
        short: 'CR',
        tone: 'bg-pos-danger-soft text-pos-danger',
        isOutflow: true,
      };
    case 'PAY_OUT':
      return {
        short: 'PO',
        tone: 'bg-pos-danger-soft text-pos-danger',
        isOutflow: true,
      };
    case 'EXPENSE':
      return {
        short: 'EX',
        tone: 'bg-pos-danger-soft text-pos-danger',
        isOutflow: true,
      };
    default:
      return {
        short: 'TX',
        tone: 'bg-pos-surface-subtle text-pos-text-muted',
        isOutflow: false,
      };
  }
}

export const ShiftsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const currency =
    user && 'restaurant' in user && user.restaurant?.currency
      ? user.restaurant.currency
      : 'PKR';

  const canOpenShift = hasPermission('shifts.open');
  const canCloseShift = hasPermission('shifts.close');
  const canViewPayments = hasPermission('payments.view');
  const canRefund = hasPermission('payments.refund');

  // Tabs: 'DRAWER' | 'PAYMENTS' | 'HISTORY'
  const [activeTab, setActiveTab] = useState<'DRAWER' | 'PAYMENTS' | 'HISTORY'>('DRAWER');

  // History filters
  const [historyStatus, setHistoryStatus] = useState<'ALL' | ShiftStatus>('ALL');
  const [historyBusinessDate, setHistoryBusinessDate] = useState<string>('');
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Modals state
  const [isOpenShiftOpen, setIsOpenShiftOpen] = useState(false);
  const [isCashDropOpen, setIsCashDropOpen] = useState(false);
  const [isCashAdjustmentOpen, setIsCashAdjustmentOpen] = useState(false);
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
  const [refundPayment, setRefundPayment] = useState<PaymentRecord | null>(null);
  const [selectedShiftSummary, setSelectedShiftSummary] =
    useState<ShiftSummaryData | null>(null);

  // Queries
  const {
    data: currentShift,
    isLoading: isCurrentLoading,
    isError: isCurrentError,
    error: currentError,
    isRefetching,
    refetch: refetchCurrent,
  } = useCurrentShiftQuery();

  const hasActiveShift = Boolean(currentShift && currentShift.status === 'OPEN');

  const {
    data: pastShiftsData,
    isLoading: isPastLoading,
    isError: isPastError,
    error: pastError,
    refetch: refetchPast,
  } = usePastShiftsQuery({
    limit: 50,
    status: historyStatus !== 'ALL' ? historyStatus : undefined,
    businessDate: historyBusinessDate.trim() || undefined,
  });

  const {
    data: paymentsData,
    isLoading: isPaymentsLoading,
    isError: isPaymentsError,
    error: paymentsError,
    refetch: refetchPayments,
  } = usePaymentsListQuery(
    {
      limit: 50,
      shiftId: hasActiveShift && currentShift ? currentShift.id : undefined,
    },
    { enabled: canViewPayments }
  );

  const handleRefreshAll = () => {
    refetchCurrent();
    refetchPast();
    if (canViewPayments) refetchPayments();
  };

  const handleOpenSummaryForPastShift = async (shift: CashierShiftRecord) => {
    setSummaryError(null);
    setIsSummaryLoading(true);
    try {
      const fullSummary = await ShiftsApi.getShiftSummary(shift.id);
      setSelectedShiftSummary(fullSummary);
    } catch (err) {
      setSummaryError(
        err instanceof Error
          ? err.message
          : 'Failed to load shift settlement summary.'
      );
      // Fall back to list-row totals so managers still see reconciliation basics.
      const summary: ShiftSummaryData = {
        shiftId: shift.id,
        businessDate: shift.businessDate,
        registerName: shift.registerName,
        status: shift.status,
        openedAt: shift.openedAt,
        closedAt: shift.closedAt || null,
        cashier: shift.cashier,
        cashDrawer: {
          openingCash: shift.openingCash,
          cashSales: shift.cashSales,
          cashRefunds: shift.cashRefunds,
          cashDrops: shift.cashDrops,
          cashAdjustments: shift.cashAdjustments,
          cashExpenses: shift.cashExpenses,
          expectedClosingCash: shift.expectedClosingCash ?? 0,
          actualClosingCash: shift.actualClosingCash,
          variance: shift.variance,
        },
        paymentsByMethod: {},
        refundsByMethod: {},
        totals: {
          totalSales: shift.cashSales,
          totalRefunds: shift.cashRefunds,
          netSales: shift.cashSales - shift.cashRefunds,
          transactionsCount: 0,
        },
      };
      setSelectedShiftSummary(summary);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-3.5 overflow-hidden select-none -m-4 md:-m-6 p-3 sm:p-4 bg-pos-bg">
      {/* =========================================================================
          LEFT / MAIN: Register Drawer, Payments Ledger & Shift Management
      ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-pos-surface border border-pos-border rounded-lg overflow-hidden shadow-xs">
        {/* Header Bar */}
        <div className="p-3 sm:p-3.5 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Shift Status & Info */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-9 w-9 rounded-lg border flex items-center justify-center',
                hasActiveShift
                  ? 'bg-pos-success-soft border-[#BBF7D0] text-pos-success'
                  : 'bg-pos-surface-subtle border-pos-border text-pos-text-muted'
              )}
            >
              <Wallet size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-pos-text">
                  {hasActiveShift ? currentShift?.registerName : 'Register Closed'}
                </h3>
                <Badge variant={hasActiveShift ? 'success' : 'default'} size="sm">
                  {hasActiveShift ? 'Active Shift Open' : 'No Open Shift'}
                </Badge>
              </div>
              <p className="text-[11px] text-pos-text-muted mt-0.5 flex items-center gap-1 font-medium">
                {hasActiveShift ? (
                  <>
                    <Building size={12} /> Cashier: {currentShift?.cashier.name} • Opened{' '}
                    {new Date(currentShift!.openedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </>
                ) : (
                  'Open a register shift to start taking orders and tracking cash drawer'
                )}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isRefetching}
              className="min-h-[36px] px-3 font-medium flex items-center gap-1.5"
            >
              <RotateCw size={14} className={isRefetching ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {hasActiveShift ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCashDropOpen(true)}
                  className="min-h-[36px] text-xs font-semibold flex items-center gap-1.5 text-pos-warning"
                >
                  <ArrowDownCircle size={15} />
                  <span>Safe Drop</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCashAdjustmentOpen(true)}
                  className="min-h-[36px] text-xs font-semibold flex items-center gap-1.5"
                >
                  <ArrowUpRight size={15} />
                  <span>Pay In / Out</span>
                </Button>

                {canCloseShift && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setIsCloseShiftOpen(true)}
                    className="min-h-[36px] text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Lock size={15} />
                    <span>Close Shift</span>
                  </Button>
                )}
              </>
            ) : (
              canOpenShift && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsOpenShiftOpen(true)}
                  className="min-h-[36px] text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Plus size={16} />
                  <span>Open Register Shift</span>
                </Button>
              )
            )}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-3.5 py-2 border-b border-pos-border bg-pos-surface-subtle flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('DRAWER')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 min-h-[32px]',
              activeTab === 'DRAWER'
                ? 'bg-pos-primary text-white shadow-xs'
                : 'bg-pos-surface text-pos-text-secondary hover:text-pos-text border border-pos-border'
            )}
          >
            <Wallet size={14} />
            <span>Active Drawer & Ledger</span>
          </button>

          {canViewPayments && (
            <button
              type="button"
              onClick={() => setActiveTab('PAYMENTS')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 min-h-[32px]',
                activeTab === 'PAYMENTS'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'bg-pos-surface text-pos-text-secondary hover:text-pos-text border border-pos-border'
              )}
            >
              <Receipt size={14} />
              <span>
                {hasActiveShift ? 'Shift Payments' : 'Payment Transactions'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 min-h-[32px]',
              activeTab === 'HISTORY'
                ? 'bg-pos-primary text-white shadow-xs'
                : 'bg-pos-surface text-pos-text-secondary hover:text-pos-text border border-pos-border'
            )}
          >
            <History size={14} />
            <span>Past Shift Reports</span>
          </button>
        </div>

        {/* Viewport Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-pos-bg">
          {/* =========================================================================
              TAB 1: Active Drawer & Shift Ledger
          ========================================================================= */}
          {activeTab === 'DRAWER' && (
            <>
              {isCurrentLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                  <Spinner size="lg" />
                  <span>Checking Active Shift Status...</span>
                </div>
              ) : isCurrentError ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-xs">
                  <AlertCircle size={32} className="text-pos-danger" />
                  <p className="font-bold text-pos-text">Failed to load active shift</p>
                  <p className="text-pos-text-muted max-w-sm text-center">
                    {currentError instanceof Error
                      ? currentError.message
                      : 'Unable to check shift status.'}
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => refetchCurrent()}>
                    Retry
                  </Button>
                </div>
              ) : !hasActiveShift ? (
                <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-3">
                  <Wallet size={40} className="text-pos-text-muted/40" />
                  <p className="font-bold text-base text-pos-text">
                    Register is Currently Closed
                  </p>
                  <p className="text-xs max-w-sm text-pos-text-secondary">
                    There is no active open shift for your cashier account.
                    {canOpenShift
                      ? ' Enter opening cash float to open the register drawer.'
                      : ' Ask a cashier or manager with shift-open permission to start a shift.'}
                  </p>
                  {canOpenShift && (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setIsOpenShiftOpen(true)}
                      className="font-bold mt-2 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      <span>Open Register Shift</span>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Top Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                    <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs sm:col-span-2">
                      <span className="text-[10px] font-semibold text-pos-text-muted uppercase tracking-wider block mb-1">
                        Expected Drawer Cash
                      </span>
                      <span className="text-xl sm:text-2xl font-black font-mono text-pos-primary block">
                        {formatPrice(currentShift?.currentDrawerCash || 0)}
                      </span>
                      <span className="text-[11px] text-pos-text-muted mt-1 block">
                        Opening Float: {formatPrice(currentShift?.openingCash || 0)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs">
                      <span className="text-[10px] font-semibold text-pos-text-muted uppercase tracking-wider block mb-1">
                        Cash Sales
                      </span>
                      <span className="text-lg font-black font-mono text-pos-success block">
                        +{formatPrice(currentShift?.cashSales || 0)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs">
                      <span className="text-[10px] font-semibold text-pos-text-muted uppercase tracking-wider block mb-1">
                        Cash Refunds
                      </span>
                      <span className="text-lg font-black font-mono text-pos-danger block">
                        -{formatPrice(currentShift?.cashRefunds || 0)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs">
                      <span className="text-[10px] font-semibold text-pos-text-muted uppercase tracking-wider block mb-1">
                        Safe Drops
                      </span>
                      <span className="text-lg font-black font-mono text-pos-warning block">
                        -{formatPrice(currentShift?.cashDrops || 0)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs">
                      <span className="text-[10px] font-semibold text-pos-text-muted uppercase tracking-wider block mb-1">
                        Adjustments / Expenses
                      </span>
                      <span className="text-sm font-black font-mono text-pos-info block">
                        Adj{' '}
                        {currentShift && currentShift.cashAdjustments >= 0 ? '+' : ''}
                        {formatPrice(currentShift?.cashAdjustments || 0)}
                      </span>
                      <span className="text-[11px] font-mono text-pos-danger mt-0.5 block">
                        Exp -{formatPrice(currentShift?.cashExpenses || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Cash Transactions List */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-2.5 flex items-center justify-between">
                      <span>Shift Cash Movements</span>
                      <span className="text-[11px] text-pos-text-muted font-normal">
                        {currentShift?.cashTransactions?.length || 0} recorded
                      </span>
                    </h4>

                    {currentShift?.cashTransactions &&
                    currentShift.cashTransactions.length > 0 ? (
                      <div className="space-y-2">
                        {currentShift.cashTransactions.map(tx => {
                          const meta = cashTxMeta(tx.type);
                          return (
                            <div
                              key={tx.id}
                              className="p-3 rounded-lg bg-pos-surface border border-pos-border flex items-center justify-between text-xs shadow-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={cn(
                                    'h-8 w-8 rounded-md flex items-center justify-center shrink-0 text-xs font-bold',
                                    meta.tone
                                  )}
                                >
                                  {meta.short}
                                </div>

                                <div>
                                  <span className="font-bold text-pos-text block">
                                    {tx.type.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-[11px] text-pos-text-muted">
                                    {tx.reason || 'Drawer balance entry'} •{' '}
                                    {new Date(tx.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={cn(
                                  'font-mono font-bold text-sm',
                                  meta.isOutflow ? 'text-pos-danger' : 'text-pos-success'
                                )}
                              >
                                {meta.isOutflow ? '-' : '+'}
                                {formatPrice(tx.amount)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-pos-surface border border-pos-border rounded-lg text-xs text-pos-text-muted">
                        No cash movements logged in this shift yet. Cash sales and refunds
                        appear here after payments are taken.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* =========================================================================
              TAB 2: Payment Transactions History
          ========================================================================= */}
          {activeTab === 'PAYMENTS' && canViewPayments && (
            <div>
              {hasActiveShift ? (
                <p className="text-xs text-pos-text-muted mb-3">
                  Showing payments linked to the active shift. Cash payments update
                  drawer cash sales automatically.
                </p>
              ) : (
                <p className="text-xs text-pos-text-muted mb-3">
                  No active shift — recent restaurant payments are listed below.
                </p>
              )}

              {isPaymentsLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                  <Spinner size="lg" />
                  <span>Loading Payment Transactions...</span>
                </div>
              ) : isPaymentsError ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-xs">
                  <AlertCircle size={32} className="text-pos-danger" />
                  <p className="font-bold text-pos-text">Failed to load payments</p>
                  <p className="text-pos-text-muted max-w-sm text-center">
                    {paymentsError instanceof Error
                      ? paymentsError.message
                      : 'Unable to load payment transactions.'}
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => refetchPayments()}>
                    Retry
                  </Button>
                </div>
              ) : !paymentsData?.payments || paymentsData.payments.length === 0 ? (
                <div className="py-24 text-center text-xs text-pos-text-muted">
                  {hasActiveShift
                    ? 'No payments recorded on this shift yet.'
                    : 'No payment transactions found.'}
                </div>
              ) : (
                <div className="overflow-x-auto border border-pos-border rounded-lg bg-pos-surface">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-pos-surface-subtle border-b border-pos-border text-pos-text-muted font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3">Order / Code</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Tender / Change</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Time</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pos-border">
                      {paymentsData.payments.map(p => {
                        const isRefundable =
                          p.status !== 'REFUNDED' && p.status !== 'VOIDED';
                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-pos-surface-subtle transition-colors"
                          >
                            <td className="p-3 font-mono font-bold text-pos-text">
                              {p.order
                                ? `#${p.order.orderCode}`
                                : `#${p.orderId.slice(0, 8)}`}
                            </td>
                            <td className="p-3">
                              <Badge
                                variant="default"
                                size="sm"
                                className="font-mono text-[10px]"
                              >
                                {p.paymentMethod}
                              </Badge>
                            </td>
                            <td className="p-3 font-mono font-bold text-pos-text">
                              {formatPrice(p.amount)}
                            </td>
                            <td className="p-3 font-mono text-pos-text-muted text-[11px]">
                              {p.amountTendered ? (
                                <>
                                  Tender: {formatPrice(p.amountTendered)}
                                  {p.changeAmount
                                    ? ` (Change: ${formatPrice(p.changeAmount)})`
                                    : ''}
                                </>
                              ) : (
                                'Exact'
                              )}
                            </td>
                            <td className="p-3">
                              <Badge
                                size="sm"
                                variant={
                                  p.status === 'COMPLETED'
                                    ? 'success'
                                    : p.status === 'REFUNDED'
                                      ? 'danger'
                                      : 'warning'
                                }
                              >
                                {p.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-pos-text-muted font-mono text-[11px]">
                              {new Date(p.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="p-3 text-right">
                              {isRefundable && canRefund && (
                                <button
                                  type="button"
                                  onClick={() => setRefundPayment(p)}
                                  className="text-xs text-pos-danger hover:underline font-semibold"
                                >
                                  Refund
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 3: Past Shift Reports
          ========================================================================= */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={historyStatus}
                  onChange={e =>
                    setHistoryStatus(e.target.value as 'ALL' | ShiftStatus)
                  }
                  className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <input
                  type="date"
                  value={historyBusinessDate}
                  onChange={e => setHistoryBusinessDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                  aria-label="Filter by business date"
                />
                {historyBusinessDate && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setHistoryBusinessDate('')}
                    className="text-xs"
                  >
                    Clear Date
                  </Button>
                )}
              </div>

              {summaryError && (
                <div className="p-2.5 rounded-md bg-pos-warning-soft border border-[#FDE68A] text-pos-warning text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>
                    Settlement summary partially loaded: {summaryError}
                  </span>
                </div>
              )}

              {isSummaryLoading && (
                <div className="text-xs text-pos-text-muted flex items-center gap-2">
                  <Spinner size="sm" /> Loading settlement summary…
                </div>
              )}

              {isPastLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                  <Spinner size="lg" />
                  <span>Loading Shift History...</span>
                </div>
              ) : isPastError ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-xs">
                  <AlertCircle size={32} className="text-pos-danger" />
                  <p className="font-bold text-pos-text">Failed to load shift history</p>
                  <p className="text-pos-text-muted max-w-sm text-center">
                    {pastError instanceof Error
                      ? pastError.message
                      : 'Unable to load shifts.'}
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => refetchPast()}>
                    Retry
                  </Button>
                </div>
              ) : !pastShiftsData?.shifts || pastShiftsData.shifts.length === 0 ? (
                <div className="py-24 text-center text-xs text-pos-text-muted">
                  No shifts match the selected filters.
                </div>
              ) : (
                <div className="overflow-x-auto border border-pos-border rounded-lg bg-pos-surface">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-pos-surface-subtle border-b border-pos-border text-pos-text-muted font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3">Register</th>
                        <th className="p-3">Cashier</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Opening</th>
                        <th className="p-3">Expected</th>
                        <th className="p-3">Counted</th>
                        <th className="p-3">Variance</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Z-Report</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pos-border">
                      {pastShiftsData.shifts.map(s => (
                        <tr
                          key={s.id}
                          className="hover:bg-pos-surface-subtle transition-colors"
                        >
                          <td className="p-3 font-bold text-pos-text">
                            {s.registerName}
                          </td>
                          <td className="p-3 text-pos-text-muted">{s.cashier.name}</td>
                          <td className="p-3 font-mono text-[11px] text-pos-text-muted">
                            {s.businessDate}
                          </td>
                          <td className="p-3 font-mono">{formatPrice(s.openingCash)}</td>
                          <td className="p-3 font-mono text-pos-text">
                            {s.expectedClosingCash != null
                              ? formatPrice(s.expectedClosingCash)
                              : '—'}
                          </td>
                          <td className="p-3 font-mono text-pos-text">
                            {s.actualClosingCash != null
                              ? formatPrice(s.actualClosingCash)
                              : '—'}
                          </td>
                          <td className="p-3 font-mono">
                            {s.variance !== null && s.variance !== undefined ? (
                              <span
                                className={cn(
                                  'font-bold',
                                  Math.abs(s.variance) < 0.01
                                    ? 'text-pos-success'
                                    : s.variance > 0
                                      ? 'text-pos-info'
                                      : 'text-pos-danger'
                                )}
                              >
                                {s.variance >= 0 ? '+' : ''}
                                {formatPrice(s.variance)}
                              </span>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="p-3">
                            <Badge
                              size="sm"
                              variant={s.status === 'OPEN' ? 'success' : 'default'}
                            >
                              {s.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenSummaryForPastShift(s)}
                              disabled={isSummaryLoading}
                              className="text-xs text-pos-primary hover:underline font-semibold disabled:opacity-50"
                            >
                              View Z-Report
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          RIGHT SIDE: Shift Settlement Summary Drawer
      ========================================================================= */}
      {selectedShiftSummary && (
        <ShiftSummaryDrawer
          summary={selectedShiftSummary}
          currency={currency}
          onClose={() => setSelectedShiftSummary(null)}
        />
      )}

      {/* Modals */}
      {isOpenShiftOpen && (
        <OpenShiftModal
          currency={currency}
          onClose={() => setIsOpenShiftOpen(false)}
          onSuccess={() => {
            refetchCurrent();
            setIsOpenShiftOpen(false);
          }}
        />
      )}

      {hasActiveShift && currentShift && isCashDropOpen && (
        <CashDropModal
          shift={currentShift}
          currency={currency}
          onClose={() => setIsCashDropOpen(false)}
          onSuccess={() => {
            refetchCurrent();
            setIsCashDropOpen(false);
          }}
        />
      )}

      {hasActiveShift && currentShift && isCashAdjustmentOpen && (
        <CashAdjustmentModal
          shift={currentShift}
          currency={currency}
          onClose={() => setIsCashAdjustmentOpen(false)}
          onSuccess={() => {
            refetchCurrent();
            setIsCashAdjustmentOpen(false);
          }}
        />
      )}

      {hasActiveShift && currentShift && isCloseShiftOpen && (
        <CloseShiftModal
          shift={currentShift}
          currency={currency}
          onClose={() => setIsCloseShiftOpen(false)}
          onSuccess={summary => {
            refetchCurrent();
            setSelectedShiftSummary(summary);
            setIsCloseShiftOpen(false);
          }}
        />
      )}

      {refundPayment && (
        <RefundModal
          payment={refundPayment}
          currency={currency}
          onClose={() => setRefundPayment(null)}
          onSuccess={() => {
            refetchCurrent();
            setRefundPayment(null);
          }}
        />
      )}
    </div>
  );
};

export default ShiftsPage;
