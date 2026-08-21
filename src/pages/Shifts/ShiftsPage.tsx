import React, { useState } from 'react';
import {
  useCurrentShiftQuery,
  usePastShiftsQuery,
  usePaymentsListQuery,
} from '@/features/shifts/hooks/useShiftsData';
import { useAuthStore } from '@/core/auth/authStore';
import { ShiftSummaryData, PaymentRecord, CashierShiftRecord } from '@/types';
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
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const ShiftsPage: React.FC = () => {
  const { user } = useAuthStore();
  const currency =
    user && 'restaurant' in user && user.restaurant?.currency
      ? user.restaurant.currency
      : 'USD';

  // Tabs: 'DRAWER' | 'PAYMENTS' | 'HISTORY'
  const [activeTab, setActiveTab] = useState<'DRAWER' | 'PAYMENTS' | 'HISTORY'>('DRAWER');

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
    isRefetching,
    refetch: refetchCurrent,
  } = useCurrentShiftQuery();

  const { data: pastShiftsData, isLoading: isPastLoading } = usePastShiftsQuery({
    limit: 20,
  });

  const { data: paymentsData, isLoading: isPaymentsLoading } = usePaymentsListQuery({
    limit: 50,
  });

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const hasActiveShift = Boolean(currentShift && currentShift.status === 'OPEN');

  const handleOpenSummaryForPastShift = (shift: CashierShiftRecord) => {
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
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-4 overflow-hidden select-none -m-4 md:-m-6 p-3 sm:p-4 bg-pos-bg">
      {/* =========================================================================
          LEFT / MAIN: Register Drawer, Payments Ledger & Shift Management
      ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-pos-surface/50 border border-pos-border rounded-2xl overflow-hidden shadow-sm">
        {/* Header Bar */}
        <div className="p-3.5 border-b border-pos-border bg-pos-header/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Shift Status & Info */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-10 w-10 rounded-xl border flex items-center justify-center',
                hasActiveShift
                  ? 'bg-pos-success/15 border-pos-success/30 text-pos-success'
                  : 'bg-pos-border/60 border-pos-border text-pos-text-muted'
              )}
            >
              <Wallet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-pos-text">
                  {hasActiveShift ? currentShift?.registerName : 'Register Closed'}
                </h3>
                <Badge variant={hasActiveShift ? 'success' : 'default'}>
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
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetchCurrent()}
              disabled={isRefetching}
              className="min-h-[36px] px-3 font-semibold flex items-center gap-1.5"
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

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsCloseShiftOpen(true)}
                  className="min-h-[36px] text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Lock size={15} />
                  <span>Close Shift</span>
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsOpenShiftOpen(true)}
                className="min-h-[36px] text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={16} />
                <span>Open Register Shift</span>
              </Button>
            )}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-3.5 py-2 border-b border-pos-border bg-pos-bg/40 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('DRAWER')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[34px]',
              activeTab === 'DRAWER'
                ? 'bg-pos-accent text-white shadow-sm'
                : 'bg-pos-surface text-pos-text-muted hover:text-pos-text border border-pos-border'
            )}
          >
            <Wallet size={14} />
            <span>Active Drawer & Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PAYMENTS')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[34px]',
              activeTab === 'PAYMENTS'
                ? 'bg-pos-accent text-white shadow-sm'
                : 'bg-pos-surface text-pos-text-muted hover:text-pos-text border border-pos-border'
            )}
          >
            <Receipt size={14} />
            <span>Payment Transactions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[34px]',
              activeTab === 'HISTORY'
                ? 'bg-pos-accent text-white shadow-sm'
                : 'bg-pos-surface text-pos-text-muted hover:text-pos-text border border-pos-border'
            )}
          >
            <History size={14} />
            <span>Past Shift Reports</span>
          </button>
        </div>

        {/* Viewport Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
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
              ) : !hasActiveShift ? (
                <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-3">
                  <Wallet size={40} className="text-pos-text-muted/40" />
                  <p className="font-bold text-base text-pos-text">
                    Register is Currently Closed
                  </p>
                  <p className="text-xs max-w-sm">
                    There is no active open shift for your cashier account. Click below to
                    enter opening cash float and open the register drawer.
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsOpenShiftOpen(true)}
                    className="font-bold mt-2 flex items-center gap-2"
                  >
                    <Plus size={16} />
                    <span>Open Register Shift</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Top Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-pos-surface border border-pos-border shadow-xs">
                      <span className="text-[10px] font-bold text-pos-text-muted uppercase tracking-wider block mb-1">
                        Current Drawer Balance
                      </span>
                      <span className="text-2xl font-black font-mono text-pos-accent block">
                        {formatPrice(currentShift?.currentDrawerCash || 0)}
                      </span>
                      <span className="text-[11px] text-pos-text-muted mt-1 block">
                        Opening Float: {formatPrice(currentShift?.openingCash || 0)}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-pos-surface border border-pos-border shadow-xs">
                      <span className="text-[10px] font-bold text-pos-text-muted uppercase tracking-wider block mb-1">
                        Cash Sales Inflow
                      </span>
                      <span className="text-2xl font-black font-mono text-pos-success block">
                        +{formatPrice(currentShift?.cashSales || 0)}
                      </span>
                      <span className="text-[11px] text-pos-text-muted mt-1 block">
                        Direct register cash intake
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-pos-surface border border-pos-border shadow-xs">
                      <span className="text-[10px] font-bold text-pos-text-muted uppercase tracking-wider block mb-1">
                        Safe Cash Drops
                      </span>
                      <span className="text-2xl font-black font-mono text-pos-warning block">
                        -{formatPrice(currentShift?.cashDrops || 0)}
                      </span>
                      <span className="text-[11px] text-pos-text-muted mt-1 block">
                        Safe deposits recorded
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-pos-surface border border-pos-border shadow-xs">
                      <span className="text-[10px] font-bold text-pos-text-muted uppercase tracking-wider block mb-1">
                        Cash Adjustments (Net)
                      </span>
                      <span className="text-2xl font-black font-mono text-pos-info block">
                        {currentShift && currentShift.cashAdjustments >= 0 ? '+' : ''}
                        {formatPrice(currentShift?.cashAdjustments || 0)}
                      </span>
                      <span className="text-[11px] text-pos-text-muted mt-1 block">
                        Pay In / Pay Out transactions
                      </span>
                    </div>
                  </div>

                  {/* Cash Transactions List */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-pos-text mb-2.5 flex items-center justify-between">
                      <span>Shift Cash Transactions Log</span>
                      <span className="text-[11px] text-pos-text-muted font-normal">
                        {currentShift?.cashTransactions?.length || 0} recorded movements
                      </span>
                    </h4>

                    {currentShift?.cashTransactions &&
                    currentShift.cashTransactions.length > 0 ? (
                      <div className="space-y-2">
                        {currentShift.cashTransactions.map(tx => (
                          <div
                            key={tx.id}
                            className="p-3 rounded-xl bg-pos-surface border border-pos-border flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                                  tx.type === 'OPENING_FLOAT'
                                    ? 'bg-pos-accent/15 text-pos-accent'
                                    : tx.type === 'CASH_DROP'
                                      ? 'bg-pos-warning/15 text-pos-warning'
                                      : tx.type === 'PAY_IN'
                                        ? 'bg-pos-success/15 text-pos-success'
                                        : 'bg-pos-danger/15 text-pos-danger'
                                )}
                              >
                                {tx.type === 'OPENING_FLOAT'
                                  ? 'OF'
                                  : tx.type === 'CASH_DROP'
                                    ? 'CD'
                                    : tx.type === 'PAY_IN'
                                      ? 'PI'
                                      : 'PO'}
                              </div>

                              <div>
                                <span className="font-bold text-pos-text block">
                                  {tx.type.replace('_', ' ')}
                                </span>
                                <span className="text-[11px] text-pos-text-muted">
                                  {tx.reason || 'Standard drawer balance entry'} •{' '}
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
                                tx.type === 'CASH_DROP' || tx.type === 'PAY_OUT'
                                  ? 'text-pos-danger'
                                  : 'text-pos-success'
                              )}
                            >
                              {tx.type === 'CASH_DROP' || tx.type === 'PAY_OUT'
                                ? '-'
                                : '+'}
                              {formatPrice(tx.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-pos-surface border border-pos-border rounded-xl text-xs text-pos-text-muted">
                        No manual cash transactions logged in this shift yet.
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
          {activeTab === 'PAYMENTS' && (
            <div>
              {isPaymentsLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                  <Spinner size="lg" />
                  <span>Loading Payment Transactions...</span>
                </div>
              ) : !paymentsData?.payments || paymentsData.payments.length === 0 ? (
                <div className="py-24 text-center text-xs text-pos-text-muted">
                  No payment transactions found.
                </div>
              ) : (
                <div className="overflow-x-auto border border-pos-border rounded-xl bg-pos-surface">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-pos-header border-b border-pos-border text-pos-text-muted font-bold uppercase text-[10px] tracking-wider">
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
                    <tbody className="divide-y divide-pos-border/60">
                      {paymentsData.payments.map(p => {
                        const isRefundable =
                          p.status !== 'REFUNDED' && p.status !== 'VOIDED';
                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-pos-surface-hover transition-colors"
                          >
                            <td className="p-3 font-mono font-bold text-pos-text">
                              {p.order
                                ? `#${p.order.orderCode}`
                                : `#${p.orderId.slice(0, 8)}`}
                            </td>
                            <td className="p-3">
                              <Badge variant="default" className="font-mono text-[10px]">
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
                              {isRefundable && (
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
            <div>
              {isPastLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                  <Spinner size="lg" />
                  <span>Loading Past Shift History...</span>
                </div>
              ) : !pastShiftsData?.shifts || pastShiftsData.shifts.length === 0 ? (
                <div className="py-24 text-center text-xs text-pos-text-muted">
                  No past closed shifts found.
                </div>
              ) : (
                <div className="overflow-x-auto border border-pos-border rounded-xl bg-pos-surface">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-pos-header border-b border-pos-border text-pos-text-muted font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3">Register</th>
                        <th className="p-3">Cashier</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Opening</th>
                        <th className="p-3">Cash Sales</th>
                        <th className="p-3">Variance</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Z-Report</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pos-border/60">
                      {pastShiftsData.shifts.map(s => (
                        <tr
                          key={s.id}
                          className="hover:bg-pos-surface-hover transition-colors"
                        >
                          <td className="p-3 font-bold text-pos-text">
                            {s.registerName}
                          </td>
                          <td className="p-3 text-pos-text-muted">{s.cashier.name}</td>
                          <td className="p-3 font-mono text-[11px] text-pos-text-muted">
                            {s.businessDate}
                          </td>
                          <td className="p-3 font-mono">{formatPrice(s.openingCash)}</td>
                          <td className="p-3 font-mono text-pos-success font-bold">
                            +{formatPrice(s.cashSales)}
                          </td>
                          <td className="p-3 font-mono">
                            {s.variance !== null ? (
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
                            <Badge variant={s.status === 'OPEN' ? 'success' : 'default'}>
                              {s.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenSummaryForPastShift(s)}
                              className="text-xs text-pos-accent hover:underline font-semibold"
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
