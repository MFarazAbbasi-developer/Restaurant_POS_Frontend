import React, { useState } from 'react';
import { CashierShiftRecord, ShiftSummaryData } from '@/types';
import { useCloseShiftMutation } from '../hooks/useShiftsData';
import { Button } from '@/components/ui/Button';
import {
  X,
  Lock,
  DollarSign,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface CloseShiftModalProps {
  shift: CashierShiftRecord;
  currency?: string;
  onClose: () => void;
  onSuccess: (summary: ShiftSummaryData) => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  shift,
  currency = 'USD',
  onClose,
  onSuccess,
}) => {
  const closeShiftMutation = useCloseShiftMutation();
  const [actualCash, setActualCash] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const expectedClosingCash =
    shift.openingCash +
    shift.cashSales -
    shift.cashRefunds -
    shift.cashDrops +
    shift.cashAdjustments -
    shift.cashExpenses;

  const parsedActualCash = parseFloat(actualCash);
  const isValidActual = !isNaN(parsedActualCash) && parsedActualCash >= 0;
  const variance = isValidActual ? parsedActualCash - expectedClosingCash : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidActual) {
      setErrorMessage('Please enter the total counted cash in the drawer.');
      return;
    }

    setErrorMessage(null);

    try {
      const res = await closeShiftMutation.mutateAsync({
        actualClosingCash: parsedActualCash,
        closingNotes: closingNotes.trim() || undefined,
      });
      onSuccess(res.summary);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to close register shift';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-accent/15 border border-pos-accent/30 text-pos-accent flex items-center justify-center">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                Close & Settle Register Shift
              </h3>
              <p className="text-xs text-pos-text-muted">
                Count physical cash drawer & record end-of-shift reconciliation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shift modal"
            className="p-2 rounded-xl text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar"
        >
          {errorMessage && (
            <div className="p-3 rounded-xl bg-pos-danger/10 border border-pos-danger/30 text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Expected Cash Ledger Breakdown Card */}
          <div className="p-3.5 rounded-xl bg-pos-bg border border-pos-border space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-pos-border/40 pb-2">
              <span className="font-bold text-pos-text uppercase tracking-wider text-[11px]">
                Expected Drawer Cash Math
              </span>
              <span className="text-[11px] text-pos-text-muted">
                Register: {shift.registerName}
              </span>
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between text-pos-text-muted">
                <span>(+) Opening Float:</span>
                <span>{formatPrice(shift.openingCash)}</span>
              </div>
              <div className="flex justify-between text-pos-success">
                <span>(+) Cash Sales:</span>
                <span>+{formatPrice(shift.cashSales)}</span>
              </div>
              {shift.cashAdjustments !== 0 && (
                <div className="flex justify-between text-pos-info">
                  <span>(±) Cash Adjustments:</span>
                  <span>
                    {shift.cashAdjustments >= 0 ? '+' : ''}
                    {formatPrice(shift.cashAdjustments)}
                  </span>
                </div>
              )}
              {shift.cashDrops > 0 && (
                <div className="flex justify-between text-pos-warning">
                  <span>(-) Safe Drops:</span>
                  <span>-{formatPrice(shift.cashDrops)}</span>
                </div>
              )}
              {shift.cashExpenses > 0 && (
                <div className="flex justify-between text-pos-danger">
                  <span>(-) Cash Expenses:</span>
                  <span>-{formatPrice(shift.cashExpenses)}</span>
                </div>
              )}
              {shift.cashRefunds > 0 && (
                <div className="flex justify-between text-pos-danger">
                  <span>(-) Cash Refunds:</span>
                  <span>-{formatPrice(shift.cashRefunds)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-pos-border/60">
              <span className="text-pos-text">Expected Drawer Cash:</span>
              <span className="text-base font-black text-pos-accent font-mono">
                {formatPrice(expectedClosingCash)}
              </span>
            </div>
          </div>

          {/* Actual Counted Cash Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5 flex items-center justify-between">
              <span>Actual Counted Cash In Drawer ({currency}) *</span>
              <span className="text-[11px] text-pos-text-muted font-normal lowercase">
                physically counted coins + bills
              </span>
            </label>
            <div className="relative">
              <DollarSign
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pos-text-muted"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={actualCash}
                onChange={e => setActualCash(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-pos-bg border border-pos-border text-pos-text font-mono font-black text-lg focus:outline-none focus:ring-2 focus:ring-pos-accent"
              />
            </div>
          </div>

          {/* Live Variance Calculation Banner */}
          {variance !== null && (
            <div
              className={cn(
                'p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-150',
                Math.abs(variance) < 0.01
                  ? 'bg-pos-success/15 border-pos-success/30 text-pos-success'
                  : variance > 0
                    ? 'bg-pos-info/15 border-pos-info/30 text-pos-info'
                    : 'bg-pos-danger/15 border-pos-danger/30 text-pos-danger'
              )}
            >
              <div className="flex items-center gap-2">
                {Math.abs(variance) < 0.01 ? (
                  <CheckCircle2 size={18} className="shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="shrink-0" />
                )}
                <div>
                  <span className="font-bold block">
                    {Math.abs(variance) < 0.01
                      ? 'Perfect Reconciliation (Exact Match)'
                      : variance > 0
                        ? 'Drawer Cash Over (Surplus)'
                        : 'Drawer Cash Short (Shortage)'}
                  </span>
                  <span className="text-[11px] opacity-85">
                    Counted: {formatPrice(parsedActualCash)} vs Expected:{' '}
                    {formatPrice(expectedClosingCash)}
                  </span>
                </div>
              </div>

              <span className="font-mono font-black text-base">
                {variance >= 0 ? '+' : ''}
                {formatPrice(variance)}
              </span>
            </div>
          )}

          {/* Closing Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Reconciliation / Closing Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={closingNotes}
              onChange={e => setClosingNotes(e.target.value)}
              placeholder="e.g. End of dinner shift, safe drop envelope #12 verified..."
              className="w-full p-3 rounded-xl bg-pos-bg border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent resize-none font-medium"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-pos-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={closeShiftMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={closeShiftMutation.isPending}
              disabled={!isValidActual}
              className="font-bold shadow-sm"
            >
              <Calculator size={16} className="mr-1.5" />
              Close & Reconcile Shift
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
