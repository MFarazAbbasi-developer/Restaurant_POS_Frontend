import React, { useState } from 'react';
import { useOpenShiftMutation } from '../hooks/useShiftsData';
import { Button } from '@/components/ui/Button';
import { X, Wallet, AlertCircle } from 'lucide-react';

interface OpenShiftModalProps {
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({
  currency = 'PKR',
  onClose,
  onSuccess,
}) => {
  const openShiftMutation = useOpenShiftMutation();
  const [openingCash, setOpeningCash] = useState<string>('2000');
  const [registerName, setRegisterName] = useState<string>('Main Register');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Standard Pakistani banknote float presets
  const quickFloats = [500, 1000, 2000, 5000, 10000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cashVal = parseFloat(openingCash);
    if (isNaN(cashVal) || cashVal < 0) {
      setErrorMessage('Please enter a valid non-negative opening cash amount.');
      return;
    }

    setErrorMessage(null);

    try {
      await openShiftMutation.mutateAsync({
        openingCash: cashVal,
        registerName: registerName.trim() || 'Main Register',
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to open register shift';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <Wallet size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">Open Register Shift</h3>
              <p className="text-xs text-pos-text-muted">
                Start cashier drawer & record opening float ({currency})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close open shift modal"
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

          {/* Register Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Register Terminal Name
            </label>
            <input
              type="text"
              required
              value={registerName}
              onChange={e => setRegisterName(e.target.value)}
              placeholder="e.g. Counter Register 01"
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
            />
          </div>

          {/* Opening Float Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Opening Cash Float ({currency || 'PKR'})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-pos-text-muted">
                Rs.
              </span>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={openingCash}
                onChange={e => setOpeningCash(e.target.value)}
                placeholder="2000"
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
              />
            </div>

            {/* Quick Denomination Chips */}
            <div className="flex items-center gap-1.5 pt-2 overflow-x-auto">
              {quickFloats.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setOpeningCash(amt.toString())}
                  className="px-2.5 py-1 rounded-md bg-pos-surface-subtle hover:bg-pos-surface border border-pos-border text-xs font-mono font-semibold text-pos-text transition-colors"
                >
                  Rs. {amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Shift Opening Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Shift Opening Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Morning shift opening float verified in drawer..."
              className="w-full p-2.5 rounded-lg bg-pos-surface border border-pos-border text-pos-text placeholder-pos-text-muted text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none font-medium shadow-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-pos-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={openShiftMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={openShiftMutation.isPending}
              className="font-bold shadow-xs"
            >
              Open Register Shift
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
