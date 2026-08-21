import React, { useState } from 'react';
import { PosTable, PosZone } from '@/types';
import { useTransferTableMutation } from '@/features/orders/hooks/usePosData';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, ArrowRightLeft, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface TableTransferModalProps {
  sourceTable: PosTable;
  zones: PosZone[];
  onClose: () => void;
  onSuccess: () => void;
}

export const TableTransferModal: React.FC<TableTransferModalProps> = ({
  sourceTable,
  zones,
  onClose,
  onSuccess,
}) => {
  const transferMutation = useTransferTableMutation();
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Flatten all tables excluding the source table
  const availableTargetTables = zones
    .flatMap(z =>
      z.tables.map(t => ({
        ...t,
        zoneName: z.name,
      }))
    )
    .filter(t => t.id !== sourceTable.id);

  const handleTransfer = async () => {
    if (!selectedTargetId) {
      setErrorMessage('Please select a destination table to transfer to.');
      return;
    }

    setErrorMessage(null);

    try {
      await transferMutation.mutateAsync({
        fromTableId: sourceTable.id,
        toTableId: selectedTargetId,
        targetStatus: 'OCCUPIED',
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to transfer table orders';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-accent/15 border border-pos-accent/30 text-pos-accent flex items-center justify-center">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">Transfer Table Orders</h3>
              <p className="text-xs text-pos-text-muted">
                Move all active orders from{' '}
                <span className="font-bold text-pos-text">{sourceTable.name}</span> to
                another table
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close transfer modal"
            className="p-2 rounded-xl text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Target Tables List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-pos-danger/10 border border-pos-danger/30 text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-2">
            Select Destination Table
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            {availableTargetTables.map(table => {
              const isSelected = selectedTargetId === table.id;
              const isAvailable = table.status === 'AVAILABLE';

              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => setSelectedTargetId(table.id)}
                  className={cn(
                    'p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[75px]',
                    isSelected
                      ? 'border-pos-accent bg-pos-accent/15 ring-2 ring-pos-accent shadow-sm'
                      : 'border-pos-border bg-pos-bg hover:border-pos-accent/40'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-pos-text">{table.name}</span>
                    {isSelected && (
                      <span className="h-4 w-4 rounded-full bg-pos-accent text-white flex items-center justify-center">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-pos-text-muted mt-2">
                    <span>{table.zoneName}</span>
                    <Badge variant={isAvailable ? 'success' : 'default'} size="sm">
                      {table.status}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pos-border bg-pos-header flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={transferMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleTransfer}
            isLoading={transferMutation.isPending}
            disabled={!selectedTargetId}
            className="font-bold flex items-center gap-2"
          >
            <ArrowRightLeft size={16} />
            <span>Confirm Transfer</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
