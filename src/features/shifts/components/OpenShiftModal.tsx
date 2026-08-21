import React, { useState } from 'react';
import { useOpenShiftMutation } from '../hooks/useShiftsData';
import { Button } from '@/components/ui/Button';
import { X, Wallet, DollarSign, AlertCircle } from 'lucide-react';

interface OpenShiftModalProps {
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({
  currency = 'USD',
  onClose,
  onSuccess,
}) => {
  const openShiftMutation = useOpenShiftMutation();
  const [openingCash, setOpeningCash] = useState<string>('150');
  const [registerName, setRegisterName] = useState<string>('Main Register');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const quickFloats = [50, 100, 150, 200, 300];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-accent/15 border border-pos-accent/30 text-pos-accent flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">Open Register Shift</h3>
              <p className="text-xs text-pos-text-muted">
                Start cashier drawer & record opening float
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close open shift modal"
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

          {/* Register Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Register Terminal Name
            </label>
            <input
              type="text"
              required
              value={registerName}
              onChange={e => setRegisterName(e.target.value)}
              placeholder="e.g. Main Counter POS-01"
              className="w-full px-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pos-accent"
            />
          </div>

          {/* Opening Float Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Opening Cash Float ({currency})
            </label>
            <div className="relative">
              <DollarSign
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pos-text-muted"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={openingCash}
                onChange={e => setOpeningCash(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-pos-accent"
              />
            </div>

            {/* Quick Denomination Chips */}
            <div className="flex items-center gap-1.5 pt-2 overflow-x-auto">
              {quickFloats.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setOpeningCash(amt.toString())}
                  className="px-2.5 py-1 rounded-lg bg-pos-bg hover:bg-pos-surface-hover border border-pos-border text-xs font-mono font-semibold text-pos-text transition-colors"
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>

          {/* Shift Opening Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Shift Opening Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Morning shift, starting float verified by supervisor..."
              className="w-full p-3 rounded-xl bg-pos-bg border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent resize-none font-medium"
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
              className="font-bold shadow-sm"
            >
              Open Register Shift
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
