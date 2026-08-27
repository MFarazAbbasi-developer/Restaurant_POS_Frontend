import React from 'react';
import { ShiftSummaryData } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, Printer, Calendar, User, CreditCard, Building } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';

interface ShiftSummaryDrawerProps {
  summary: ShiftSummaryData;
  currency?: string;
  onClose: () => void;
}

export const ShiftSummaryDrawer: React.FC<ShiftSummaryDrawerProps> = ({
  summary,
  currency = 'PKR',
  onClose,
}) => {
  const isClosed = summary.status === 'CLOSED';
  const variance = summary.cashDrawer.variance;
  const formatMoney = (val: number) => formatPrice(val, currency);

  return (
    <div className="w-full lg:w-96 flex flex-col bg-pos-surface border border-pos-border rounded-xl shadow-dropdown overflow-hidden shrink-0 animate-in slide-in-from-right-4 duration-150">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-pos-border bg-pos-surface flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-pos-text">Shift Settlement Report</h3>
            <Badge variant={isClosed ? 'default' : 'success'} size="sm">
              {summary.status}
            </Badge>
          </div>
          <p className="text-[11px] text-pos-text-muted mt-0.5 flex items-center gap-1 font-medium">
            <Building size={12} /> {summary.registerName} • {summary.businessDate}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close shift summary"
          className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Cashier & Shift Timestamps */}
        <div className="p-3 rounded-lg bg-pos-surface-subtle border border-pos-border text-xs space-y-1.5 font-medium">
          <div className="flex items-center justify-between">
            <span className="text-pos-text-muted flex items-center gap-1.5">
              <User size={14} className="text-pos-primary" /> Cashier:
            </span>
            <span className="font-bold text-pos-text">{summary.cashier.name}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-pos-text-muted flex items-center gap-1.5">
              <Calendar size={14} /> Opened:
            </span>
            <span className="text-pos-text font-mono text-[11px]">
              {new Date(summary.openedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {summary.closedAt && (
            <div className="flex items-center justify-between border-t border-pos-border pt-1">
              <span className="text-pos-text-muted flex items-center gap-1.5">
                <Calendar size={14} /> Closed:
              </span>
              <span className="text-pos-text font-mono text-[11px]">
                {new Date(summary.closedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Top Totals Card */}
        <div className="p-3 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-1 text-xs">
          <div className="flex justify-between text-pos-text-muted">
            <span>Gross Sales ({summary.totals.transactionsCount} txs):</span>
            <span className="font-mono text-pos-text">
              {formatMoney(summary.totals.totalSales)}
            </span>
          </div>

          {summary.totals.totalRefunds > 0 && (
            <div className="flex justify-between text-pos-danger">
              <span>Total Refunds:</span>
              <span className="font-mono">
                -{formatMoney(summary.totals.totalRefunds)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm font-bold pt-1.5 border-t border-pos-border">
            <span className="text-pos-text uppercase tracking-wider text-xs">
              Net Sales:
            </span>
            <span className="text-base font-black text-pos-primary font-mono">
              {formatMoney(summary.totals.netSales)}
            </span>
          </div>
        </div>

        {/* Drawer Math Reconciliation */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-2">
            Cash Drawer Ledger
          </h4>

          <div className="p-3 rounded-lg bg-pos-surface border border-pos-border space-y-1.5 font-mono text-xs shadow-xs">
            <div className="flex justify-between text-pos-text-muted">
              <span>(+) Opening Float:</span>
              <span>{formatMoney(summary.cashDrawer.openingCash)}</span>
            </div>

            <div className="flex justify-between text-pos-success font-medium">
              <span>(+) Cash Sales:</span>
              <span>+{formatMoney(summary.cashDrawer.cashSales)}</span>
            </div>

            {summary.cashDrawer.cashAdjustments !== 0 && (
              <div className="flex justify-between text-pos-info">
                <span>(±) Cash Adjustments:</span>
                <span>
                  {summary.cashDrawer.cashAdjustments >= 0 ? '+' : ''}
                  {formatMoney(summary.cashDrawer.cashAdjustments)}
                </span>
              </div>
            )}

            {summary.cashDrawer.cashDrops > 0 && (
              <div className="flex justify-between text-pos-warning">
                <span>(-) Safe Drops:</span>
                <span>-{formatMoney(summary.cashDrawer.cashDrops)}</span>
              </div>
            )}

            {summary.cashDrawer.cashExpenses > 0 && (
              <div className="flex justify-between text-pos-danger">
                <span>(-) Cash Expenses:</span>
                <span>-{formatMoney(summary.cashDrawer.cashExpenses)}</span>
              </div>
            )}

            {summary.cashDrawer.cashRefunds > 0 && (
              <div className="flex justify-between text-pos-danger">
                <span>(-) Cash Refunds:</span>
                <span>-{formatMoney(summary.cashDrawer.cashRefunds)}</span>
              </div>
            )}

            <div className="flex justify-between items-center font-bold pt-1.5 border-t border-pos-border text-pos-text">
              <span>Expected Closing Cash:</span>
              <span>{formatMoney(summary.cashDrawer.expectedClosingCash)}</span>
            </div>

            {summary.cashDrawer.actualClosingCash !== null && (
              <div className="flex justify-between items-center font-bold text-pos-primary">
                <span>Actual Counted Cash:</span>
                <span>{formatMoney(summary.cashDrawer.actualClosingCash)}</span>
              </div>
            )}

            {variance !== null && (
              <div
                className={cn(
                  'flex justify-between items-center font-bold pt-1 border-t border-pos-border',
                  Math.abs(variance) < 0.01
                    ? 'text-pos-success'
                    : variance > 0
                      ? 'text-pos-info'
                      : 'text-pos-danger'
                )}
              >
                <span>Reconciliation Variance:</span>
                <span>
                  {variance >= 0 ? '+' : ''}
                  {formatMoney(variance)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-2">
            Payment Methods Breakdown
          </h4>

          <div className="space-y-1.5">
            {Object.entries(summary.paymentsByMethod).map(([method, data]) => (
              <div
                key={method}
                className="p-2.5 rounded-lg bg-pos-surface border border-pos-border flex items-center justify-between text-xs font-medium shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <CreditCard size={14} className="text-pos-primary" />
                  <span className="font-bold text-pos-text">{method}</span>
                  <span className="text-[10px] text-pos-text-muted">
                    ({data.count} orders)
                  </span>
                </div>
                <span className="font-mono font-bold text-pos-text">
                  {formatMoney(data.totalAmount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action: Print Report */}
        <div className="pt-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => window.print()}
            className="w-full text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <Printer size={15} />
            <span>Print Z-Report Summary</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
