import React, { useState } from 'react';
import { ExpenseRecord } from '@/types';
import { useVoidExpenseMutation } from '../hooks/useExpensesData';
import { Button } from '@/components/ui/Button';
import { X, AlertTriangle, AlertCircle, KeyRound } from 'lucide-react';

interface VoidExpenseModalProps {
  expense: ExpenseRecord;
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const VoidExpenseModal: React.FC<VoidExpenseModalProps> = ({
  expense,
  currency = 'USD',
  onClose,
  onSuccess,
}) => {
  const voidMutation = useVoidExpenseMutation();

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

  const handleVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage('Void reason is mandatory.');
      return;
    }

    setErrorMessage(null);

    try {
      await voidMutation.mutateAsync({
        id: expense.id,
        payload: {
          reason: reason.trim(),
          managerPin: managerPin.trim() || undefined,
        },
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to void expense record';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">Void Expense Record</h3>
              <p className="text-xs text-pos-text-muted">
                #{expense.expenseNumber} • {formatPrice(expense.amount)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleVoid} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-pos-surface-subtle border border-pos-border text-xs space-y-1">
            <span className="font-bold text-pos-text block">{expense.description}</span>
            <span className="text-[11px] text-pos-text-muted block">
              Category: {expense.category.name} • Method: {expense.paymentMethod}
              {expense.shift && ' • Shift Drawer Cash Linked'}
            </span>
          </div>

          <p className="text-xs text-pos-text-secondary font-medium leading-relaxed">
            Voiding will mark this expense as cancelled and reverse any associated
            cash-drawer deduction in the active shift register.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Reason for Voiding <span className="text-pos-danger">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Duplicate entry, Incorrect amount, Cancelled purchase..."
              className="w-full p-2.5 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-danger/20 focus:border-pos-danger resize-none font-medium shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Manager PIN (If authorization required)
            </label>
            <div className="relative">
              <KeyRound
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
              />
              <input
                type="password"
                maxLength={8}
                value={managerPin}
                onChange={e => setManagerPin(e.target.value)}
                placeholder="••••"
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono text-center tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-bold shadow-xs"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-pos-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={voidMutation.isPending}
            >
              Keep Expense
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              isLoading={voidMutation.isPending}
              disabled={!reason.trim()}
              className="font-bold shadow-xs"
            >
              Void Expense
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
