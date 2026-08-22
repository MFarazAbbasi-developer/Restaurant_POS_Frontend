import React, { useState } from 'react';
import { PosTable, PosZone } from '@/types';
import { useTransferTableMutation } from '@/features/orders/hooks/usePosData';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, ArrowRightLeft, Check, AlertCircle, Users, ArrowRight } from 'lucide-react';
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
  const [selectedZoneId, setSelectedZoneId] = useState<string>('ALL');

  // Flatten all tables
  const allTargetTables = zones.flatMap(z =>
    z.tables.map(t => ({
      ...t,
      zoneId: z.id,
      zoneName: z.name,
    }))
  );

  const filteredTargetTables = allTargetTables.filter(
    t => selectedZoneId === 'ALL' || t.zoneId === selectedZoneId
  );

  const selectedTargetTable = allTargetTables.find(t => t.id === selectedTargetId);

  const handleTransfer = async () => {
    if (!selectedTargetId) {
      setErrorMessage('Please select a destination table to transfer to.');
      return;
    }

    if (selectedTargetId === sourceTable.id) {
      setErrorMessage('Cannot transfer table orders to the same table.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-xl bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-pos-primary-soft text-pos-primary flex items-center justify-center">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-pos-text">
                Transfer / Merge Table
              </h3>
              <p className="text-xs text-pos-text-muted mt-0.5">
                Move active orders and guest count to another dining table
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close transfer modal"
            className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Source -> Destination Visual Flow Bar */}
        <div className="px-4 py-3 border-b border-pos-border bg-pos-surface-subtle flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pos-text-muted">
              Source:
            </span>
            <div className="flex items-center gap-1.5 font-bold text-pos-text bg-pos-surface px-2.5 py-1 rounded border border-pos-border">
              <span>{sourceTable.name}</span>
              <span className="text-[10px] text-pos-text-muted font-normal">
                ({sourceTable.capacity} Seats)
              </span>
            </div>
          </div>

          <ArrowRight size={16} className="text-pos-primary shrink-0" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pos-text-muted">
              Destination:
            </span>
            {selectedTargetTable ? (
              <div className="flex items-center gap-1.5 font-bold text-pos-primary bg-pos-primary-soft px-2.5 py-1 rounded border border-pos-primary/30">
                <span>{selectedTargetTable.name}</span>
                <span className="text-[10px] opacity-80 font-normal">
                  ({selectedTargetTable.capacity} Seats)
                </span>
              </div>
            ) : (
              <span className="text-xs text-pos-text-muted italic bg-pos-surface px-2.5 py-1 rounded border border-dashed border-pos-border">
                Select table below
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Target Tables List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Zone Filter Chips */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-pos-text-secondary mb-2">
              Filter by Zone
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedZoneId('ALL')}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-semibold transition-colors',
                  selectedZoneId === 'ALL'
                    ? 'bg-pos-primary text-white shadow-xs'
                    : 'bg-pos-surface text-pos-text-secondary hover:text-pos-text hover:bg-pos-surface-subtle border border-pos-border'
                )}
              >
                All Zones
              </button>
              {zones.map(z => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setSelectedZoneId(z.id)}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-semibold transition-colors',
                    selectedZoneId === z.id
                      ? 'bg-pos-primary text-white shadow-xs'
                      : 'bg-pos-surface text-pos-text-secondary hover:text-pos-text hover:bg-pos-surface-subtle border border-pos-border'
                  )}
                >
                  {z.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-pos-text-secondary mb-2">
              Choose Destination Table
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredTargetTables.map(table => {
                const isSource = table.id === sourceTable.id;
                const isSelected = selectedTargetId === table.id;
                const isAvailable = table.status === 'AVAILABLE';

                return (
                  <button
                    key={table.id}
                    type="button"
                    disabled={isSource}
                    onClick={() => {
                      if (!isSource) {
                        setSelectedTargetId(table.id);
                        setErrorMessage(null);
                      }
                    }}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-colors relative flex flex-col justify-between min-h-[82px] select-none shadow-xs',
                      isSource
                        ? 'opacity-40 bg-pos-surface-subtle border-pos-border cursor-not-allowed'
                        : isSelected
                          ? 'border-pos-primary bg-pos-primary-soft/40 ring-1 ring-pos-primary'
                          : 'border-pos-border bg-pos-surface hover:border-pos-border-strong hover:bg-pos-surface-subtle'
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <span className="font-bold text-xs text-pos-text leading-tight block">
                          {table.name}
                        </span>
                        <span className="text-[10px] text-pos-text-muted flex items-center gap-1 mt-0.5 font-medium">
                          <Users size={10} /> {table.capacity} Seats
                        </span>
                      </div>
                      {isSelected ? (
                        <span className="h-4 w-4 rounded-full bg-pos-primary text-white flex items-center justify-center shrink-0">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      ) : isSource ? (
                        <span className="text-[9px] text-pos-text-muted italic bg-pos-surface-subtle px-1 py-0.5 rounded">
                          Current
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-pos-text-muted mt-2 pt-1 border-t border-pos-border/60">
                      <span className="truncate max-w-[80px]">{table.zoneName}</span>
                      <Badge
                        variant={
                          isAvailable
                            ? 'success'
                            : table.status === 'OCCUPIED'
                              ? 'warning'
                              : 'default'
                        }
                        size="sm"
                      >
                        {table.status}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pos-border bg-pos-surface flex items-center justify-between shrink-0">
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
            disabled={!selectedTargetId || selectedTargetId === sourceTable.id}
            className="font-semibold flex items-center gap-2 shadow-xs"
          >
            <ArrowRightLeft size={16} />
            <span>Confirm Transfer</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
