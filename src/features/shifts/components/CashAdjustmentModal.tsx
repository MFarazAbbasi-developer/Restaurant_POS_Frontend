import React, { useState } from 'react';
import { CashierShiftRecord, CashAdjustmentType } from '@/types';
import { useCashAdjustmentMutation } from '../hooks/useShiftsData';
import { usePermissions } from '@/core/auth/usePermissions';
import { Button } from '@/components/ui/Button';
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface CashAdjustmentModalProps {
  shift: CashierShiftRecord;
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CashAdjustmentModal: React.FC<CashAdjustmentModalProps> = ({
  shift,
  currency = 'USD',
  onClose,
  onSuccess,
}) => {
  const adjustmentMutation = useCashAdjustmentMutation();
  const { hasPermission } = usePermissions();
  const canAdjustDirectly = hasPermission('shifts.cash_drop');

  const [type, setType] = useState<CashAdjustmentType>('PAY_IN');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [managerPin, setManagerPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const adjVal = parseFloat(amount);
    if (isNaN(adjVal) || adjVal <= 0) {
      setErrorMessage('Please enter a valid positive adjustment amount.');
      return;
    }

    if (type === 'PAY_OUT' && adjVal > shift.currentDrawerCash) {
      setErrorMessage(
        `Pay-out amount (${formatPrice(adjVal)}) exceeds available drawer balance (${formatPrice(shift.currentDrawerCash)}).`
      );
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      setErrorMessage('Please provide a descriptive reason (at least 3 characters).');
      return;
    }

    if (!canAdjustDirectly && (!managerPin.trim() || managerPin.trim().length !== 4)) {
      setErrorMessage(
        'Manager authorization PIN (4 digits) is required for this operation.'
      );
      return;
    }

    setErrorMessage(null);

    try {
      await adjustmentMutation.mutateAsync({
        type,
        amount: adjVal,
        reason: reason.trim(),
        managerPin: managerPin.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to record cash adjustment';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-10 w-10 rounded-xl border flex items-center justify-center',
                type === 'PAY_IN'
                  ? 'bg-pos-success/15 border-pos-success/30 text-pos-success'
                  : 'bg-pos-danger/15 border-pos-danger/30 text-pos-danger'
              )}
            >
              {type === 'PAY_IN' ? (
                <ArrowDownLeft size={20} />
              ) : (
                <ArrowUpRight size={20} />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                Drawer Cash Adjustment
              </h3>
              <p className="text-xs text-pos-text-muted">
                Record Pay-In or Pay-Out petty cash transactions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close adjustment modal"
            className="p-2 rounded-xl text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-pos-danger/10 border border-pos-danger/30 text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Type Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-pos-bg border border-pos-border">
            <button
              type="button"
              onClick={() => setType('PAY_IN')}
              className={cn(
                'py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                type === 'PAY_IN'
                  ? 'bg-pos-success text-white shadow-sm'
                  : 'text-pos-text-muted hover:text-pos-text'
              )}
            >
              <ArrowDownLeft size={14} />
              <span>Pay In (Cash Added)</span>
            </button>

            <button
              type="button"
              onClick={() => setType('PAY_OUT')}
              className={cn(
                'py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                type === 'PAY_OUT'
                  ? 'bg-pos-danger text-white shadow-sm'
                  : 'text-pos-text-muted hover:text-pos-text'
              )}
            >
              <ArrowUpRight size={14} />
              <span>Pay Out (Cash Taken)</span>
            </button>
          </div>

          {/* Current Drawer Info */}
          <div className="p-3 rounded-xl bg-pos-bg border border-pos-border flex items-center justify-between text-xs">
            <span className="text-pos-text-muted font-medium">Drawer Balance:</span>
            <span className="font-mono font-bold text-base text-pos-accent">
              {formatPrice(shift.currentDrawerCash)}
            </span>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Adjustment Amount ({currency}) <span className="text-pos-danger">*</span>
            </label>
            <div className="relative">
              <DollarSign
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pos-text-muted"
              />
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-pos-accent"
              />
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Reason / Expense Description <span className="text-pos-danger">*</span>
            </label>
            <input
              type="text"
              required
              minLength={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={
                type === 'PAY_IN'
                  ? 'e.g. Additional coin rolls / change fund'
                  : 'e.g. Milk emergency purchase / supplier cash pay'
              }
              className="w-full px-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-medium"
            />
          </div>

          {/* Manager PIN Verification if required */}
          {!canAdjustDirectly && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5 flex items-center gap-1">
                <KeyRound size={13} className="text-pos-warning" />
                <span>Manager Authorization PIN</span>
                <span className="text-pos-danger">*</span>
              </label>
              <input
                type="password"
                maxLength={4}
                required
                value={managerPin}
                onChange={e => setManagerPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4-digit PIN"
                className="w-full px-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text font-mono tracking-widest text-center text-sm focus:outline-none focus:ring-2 focus:ring-pos-accent"
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 border-t border-pos-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={adjustmentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={adjustmentMutation.isPending}
              disabled={!amount || !reason.trim()}
              className="font-bold shadow-sm"
            >
              Record {type === 'PAY_IN' ? 'Pay In' : 'Pay Out'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
