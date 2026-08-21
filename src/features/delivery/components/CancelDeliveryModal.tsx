import React, { useState } from 'react';
import { DeliveryOrderRecord } from '@/types';
import { useCancelDeliveryOrderMutation } from '../hooks/useDeliveryData';
import { Button } from '@/components/ui/Button';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';

interface CancelDeliveryModalProps {
  order: DeliveryOrderRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelDeliveryModal: React.FC<CancelDeliveryModalProps> = ({
  order,
  onClose,
  onSuccess,
}) => {
  const cancelMutation = useCancelDeliveryOrderMutation();
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage('Please provide a reason for cancelling this delivery order.');
      return;
    }

    setErrorMessage(null);

    try {
      await cancelMutation.mutateAsync({
        orderId: order.id,
        payload: { reason: reason.trim() },
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel delivery order';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-danger/15 border border-pos-danger/30 text-pos-danger flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">Cancel Delivery Order</h3>
              <p className="text-xs text-pos-text-muted">
                #{order.orderCode} • {order.customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cancel modal"
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Cancellation Reason <span className="text-pos-danger">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Customer cancelled phone-in, address outside zone, rider unavailable..."
              className="w-full p-3 rounded-xl bg-pos-bg border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-xs focus:outline-none focus:ring-2 focus:ring-pos-danger focus:border-transparent font-medium resize-none"
            />
          </div>

          <div className="pt-2 border-t border-pos-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={cancelMutation.isPending}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              isLoading={cancelMutation.isPending}
              disabled={!reason.trim()}
              className="font-bold"
            >
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
