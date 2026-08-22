import React, { useState } from 'react';
import { CashierShiftRecord } from '@/types';
import { useCashDropMutation } from '../hooks/useShiftsData';
import { usePermissions } from '@/core/auth/usePermissions';
import { Button } from '@/components/ui/Button';
import { X, ArrowDownCircle, DollarSign, KeyRound, AlertCircle } from 'lucide-react';

interface CashDropModalProps {
  shift: CashierShiftRecord;
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CashDropModal: React.FC<CashDropModalProps> = ({
  shift,
  currency = 'USD',
  onClose,
  onSuccess,
}) => {
  const cashDropMutation = useCashDropMutation();
  const { hasPermission } = usePermissions();
  const canCashDropDirectly = hasPermission('shifts.cash_drop');

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
    const dropVal = parseFloat(amount);
    if (isNaN(dropVal) || dropVal <= 0) {
      setErrorMessage('Please enter a valid positive cash drop amount.');
      return;
    }

    if (dropVal > shift.currentDrawerCash) {
      setErrorMessage(
        `Cash drop amount (${formatPrice(dropVal)}) cannot exceed current drawer cash (${formatPrice(shift.currentDrawerCash)}).`
      );
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      setErrorMessage('Please provide a descriptive reason (at least 3 characters).');
      return;
    }

    if (!canCashDropDirectly && (!managerPin.trim() || managerPin.trim().length !== 4)) {
      setErrorMessage(
        'Manager authorization PIN (4 digits) is required for this operation.'
      );
      return;
    }

    setErrorMessage(null);

    try {
      await cashDropMutation.mutateAsync({
        amount: dropVal,
        reason: reason.trim(),
        managerPin: managerPin.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to record cash drop';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-warning-soft border border-[#FED7AA] text-pos-warning flex items-center justify-center">
              <ArrowDownCircle size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">Safe Cash Drop</h3>
              <p className="text-xs text-pos-text-muted">
                Transfer surplus cash from register drawer to safe
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cash drop modal"
            className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current Drawer Info */}
          <div className="p-3 rounded-lg bg-pos-surface-subtle border border-pos-border flex items-center justify-between text-xs">
            <span className="text-pos-text-secondary font-medium">
              Available Drawer Cash:
            </span>
            <span className="font-mono font-bold text-sm text-pos-primary">
              {formatPrice(shift.currentDrawerCash)}
            </span>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Drop Amount ({currency}) <span className="text-pos-danger">*</span>
            </label>
            <div className="relative">
              <DollarSign
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
              />
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={shift.currentDrawerCash}
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
              />
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Drop Reason / Drop Reference <span className="text-pos-danger">*</span>
            </label>
            <input
              type="text"
              required
              minLength={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Mid-day safe drop envelope #04"
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
            />
          </div>

          {/* Manager PIN Verification if required */}
          {!canCashDropDirectly && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5 flex items-center gap-1">
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
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono tracking-widest text-center text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
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
              disabled={cashDropMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={cashDropMutation.isPending}
              disabled={!amount || !reason.trim()}
              className="font-bold shadow-xs"
            >
              Confirm Safe Drop
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
