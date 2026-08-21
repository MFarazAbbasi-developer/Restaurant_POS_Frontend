import React, { useState } from 'react';
import { ReservationRecord } from '@/types';
import {
  useAssignReservationTableMutation,
  useReservationAvailabilityQuery,
} from '../hooks/useReservationData';
import { Button } from '@/components/ui/Button';
import { X, Grid, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { cn } from '@/utils/cn';

interface AssignTableModalProps {
  reservation: ReservationRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignTableModal: React.FC<AssignTableModalProps> = ({
  reservation,
  onClose,
  onSuccess,
}) => {
  const assignTableMutation = useAssignReservationTableMutation();

  const [selectedTableId, setSelectedTableId] = useState<string>(
    reservation.tableId || ''
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reservationDateStr = new Date(reservation.reservationDate)
    .toISOString()
    .split('T')[0];

  const startTimeStr = new Date(reservation.startTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const { data: availabilityData, isLoading } = useReservationAvailabilityQuery({
    reservationDate: reservationDateStr,
    startTime: startTimeStr,
    durationMinutes: reservation.durationMinutes,
    guestCount: reservation.guestCount,
  });

  const availableTables = availabilityData?.availableTables || [];

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableId) {
      setErrorMessage('Please select a table to assign.');
      return;
    }

    setErrorMessage(null);

    try {
      await assignTableMutation.mutateAsync({
        id: reservation.id,
        payload: {
          tableId: selectedTableId,
        },
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to assign table';
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
              <Grid size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">Assign Floor Table</h3>
              <p className="text-xs text-pos-text-muted">
                #{reservation.reservationCode} • {reservation.customerName} (
                {reservation.guestCount} guests)
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

        {/* Body */}
        <form onSubmit={handleAssign} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-pos-danger/10 border border-pos-danger/30 text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-2 flex items-center justify-between">
              <span>Select Available Table</span>
              <span className="text-[11px] text-pos-text-muted font-normal">
                Min Capacity: {reservation.guestCount}
              </span>
            </label>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-pos-text-muted">
                Checking table availability...
              </div>
            ) : availableTables.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto custom-scrollbar p-1">
                {availableTables.map(tbl => {
                  const isSelected = selectedTableId === tbl.id;
                  return (
                    <button
                      key={tbl.id}
                      type="button"
                      onClick={() => setSelectedTableId(tbl.id)}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all flex flex-col justify-between',
                        isSelected
                          ? 'bg-pos-accent text-white border-pos-accent shadow-sm'
                          : 'bg-pos-bg border-pos-border text-pos-text hover:border-pos-accent/40'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">Table {tbl.name}</span>
                        {isSelected && <CheckCircle2 size={15} />}
                      </div>

                      <div
                        className={cn(
                          'flex items-center justify-between text-[11px] mt-2 pt-2 border-t',
                          isSelected
                            ? 'border-white/20 text-white/80'
                            : 'border-pos-border/60 text-pos-text-muted'
                        )}
                      >
                        <span>{tbl.zone?.name || 'Floor'}</span>
                        <span className="flex items-center gap-0.5 font-mono">
                          <Users size={11} /> {tbl.capacity}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-pos-bg border border-pos-border text-xs text-pos-text-muted">
                No suitable tables available for this time window and party size.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-pos-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={assignTableMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={assignTableMutation.isPending}
              disabled={!selectedTableId}
              className="font-bold shadow-sm"
            >
              Confirm Table
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
