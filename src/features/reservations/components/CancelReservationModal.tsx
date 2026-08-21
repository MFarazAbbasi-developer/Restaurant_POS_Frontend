import React, { useState } from 'react';
import { ReservationRecord } from '@/types';
import { useUpdateReservationStatusMutation } from '../hooks/useReservationData';
import { Button } from '@/components/ui/Button';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';

interface CancelReservationModalProps {
  reservation: ReservationRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelReservationModal: React.FC<CancelReservationModalProps> = ({
  reservation,
  onClose,
  onSuccess,
}) => {
  const statusMutation = useUpdateReservationStatusMutation();
  const [cancelReason, setCancelReason] = useState<string>(
    'Guest called to cancel booking'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      await statusMutation.mutateAsync({
        id: reservation.id,
        payload: {
          status: 'CANCELLED',
          cancelReason: cancelReason.trim() || undefined,
        },
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel reservation';
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
              <h3 className="text-base font-bold text-pos-text">Cancel Reservation</h3>
              <p className="text-xs text-pos-text-muted">
                #{reservation.reservationCode} • {reservation.customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCancel} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-pos-danger/10 border border-pos-danger/30 text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <p className="text-xs text-pos-text font-medium leading-relaxed">
            Are you sure you want to cancel the reservation for{' '}
            <strong className="text-pos-text font-bold">
              {reservation.customerName}
            </strong>{' '}
            ({reservation.guestCount} guests)? Any assigned floor table will be freed up
            immediately.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Cancellation Reason (Optional)
            </label>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="e.g. Guest rescheduled, late cancellation..."
              className="w-full p-3 rounded-xl bg-pos-bg border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-xs focus:outline-none focus:ring-2 focus:ring-pos-danger resize-none font-medium"
            />
          </div>

          <div className="pt-2 border-t border-pos-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={statusMutation.isPending}
            >
              Keep Reservation
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              isLoading={statusMutation.isPending}
              className="font-bold shadow-sm"
            >
              Cancel Reservation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
