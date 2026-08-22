import React, { useState } from 'react';
import { DeliveryOrderRecord } from '@/types';
import { useDeliveryRidersQuery, useAssignRiderMutation } from '../hooks/useDeliveryData';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { X, Bike, User, Phone, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface AssignRiderModalProps {
  order: DeliveryOrderRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignRiderModal: React.FC<AssignRiderModalProps> = ({
  order,
  onClose,
  onSuccess,
}) => {
  const { data: riders = [], isLoading, error } = useDeliveryRidersQuery();
  const assignMutation = useAssignRiderMutation();
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(
    order.rider?.id || null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAssign = async () => {
    if (!selectedRiderId) {
      setErrorMessage('Please select a rider to assign to this delivery.');
      return;
    }

    setErrorMessage(null);

    try {
      await assignMutation.mutateAsync({
        orderId: order.id,
        payload: { riderId: selectedRiderId },
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to assign rider';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <Bike size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">Assign Delivery Rider</h3>
              <p className="text-xs text-pos-text-muted">
                Order #{order.orderCode} • {order.customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rider modal"
            className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Riders List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-pos-text-muted text-xs">
              <Spinner size="md" />
              <span>Loading eligible delivery riders...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs">
              Failed to load riders list.
            </div>
          )}

          {!isLoading && riders.length === 0 && (
            <div className="py-12 text-center text-xs text-pos-text-muted">
              No active delivery riders found. Make sure staff with DELIVERY role are
              active.
            </div>
          )}

          {!isLoading && riders.length > 0 && (
            <div className="space-y-2">
              {riders.map(rider => {
                const isSelected = selectedRiderId === rider.id;
                return (
                  <button
                    key={rider.id}
                    type="button"
                    onClick={() => setSelectedRiderId(rider.id)}
                    className={cn(
                      'w-full p-3 rounded-lg border text-left transition-colors flex items-center justify-between min-h-[54px] shadow-xs',
                      isSelected
                        ? 'border-pos-primary bg-pos-primary-soft ring-1 ring-pos-primary'
                        : 'border-pos-border bg-pos-surface hover:border-pos-border-strong hover:bg-pos-surface-subtle'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-pos-surface-subtle border border-pos-border flex items-center justify-center text-pos-primary">
                        <User size={15} />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-pos-text block">
                          {rider.name}
                        </span>
                        <span className="text-[11px] text-pos-text-muted flex items-center gap-1 font-mono">
                          <Phone size={11} /> {rider.phone || `@${rider.username}`}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="h-5 w-5 rounded-full bg-pos-primary text-white flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pos-border bg-pos-surface flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={assignMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleAssign}
            isLoading={assignMutation.isPending}
            disabled={!selectedRiderId}
            className="font-bold flex items-center gap-2"
          >
            <Bike size={16} />
            <span>Confirm Rider</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
