import React, { useState } from 'react';
import { usePosTablesQuery } from '../hooks/usePosData';
import { PosTable } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { X, Users, UtensilsCrossed, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface TableSelectorModalProps {
  currentTableId?: string | null;
  onSelectTable: (table: { id: string; name: string } | null) => void;
  onClose: () => void;
}

export const TableSelectorModal: React.FC<TableSelectorModalProps> = ({
  currentTableId,
  onSelectTable,
  onClose,
}) => {
  const { data: floorData, isLoading, error } = usePosTablesQuery();
  const [selectedZoneId, setSelectedZoneId] = useState<string>('ALL');

  const zones = floorData?.zones || [];
  const activeZones =
    selectedZoneId === 'ALL' ? zones : zones.filter(z => z.id === selectedZoneId);

  const getStatusBadge = (status: PosTable['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="success">Available</Badge>;
      case 'OCCUPIED':
        return <Badge variant="warning">Occupied</Badge>;
      case 'BILL_PRINTED':
        return <Badge variant="info">Bill Printed</Badge>;
      case 'RESERVED':
        return <Badge variant="default">Reserved</Badge>;
      case 'CLEANING':
        return <Badge variant="danger">Cleaning</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-3xl bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-accent/15 border border-pos-accent/30 text-pos-accent flex items-center justify-center">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">Select Dine-In Table</h3>
              <p className="text-xs text-pos-text-muted">
                Assign an active dining table to this order
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close table selector"
            className="p-2 rounded-xl text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Zone Navigation Filter Pills */}
        <div className="px-4 py-3 border-b border-pos-border bg-pos-bg/50 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setSelectedZoneId('ALL')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px]',
              selectedZoneId === 'ALL'
                ? 'bg-pos-accent text-white shadow-sm'
                : 'bg-pos-surface text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover border border-pos-border'
            )}
          >
            All Zones ({floorData?.summary.totalTablesCount || 0})
          </button>
          {zones.map(zone => (
            <button
              key={zone.id}
              type="button"
              onClick={() => setSelectedZoneId(zone.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px]',
                selectedZoneId === zone.id
                  ? 'bg-pos-accent text-white shadow-sm'
                  : 'bg-pos-surface text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover border border-pos-border'
              )}
            >
              {zone.name} ({zone.tables.length})
            </button>
          ))}
        </div>

        {/* Tables Grid Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
              <Spinner size="lg" />
              <span>Loading dining floor tables...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-pos-danger/10 border border-pos-danger/30 text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>Failed to fetch table floor plan. Please retry.</span>
            </div>
          )}

          {!isLoading && activeZones.length === 0 && (
            <div className="py-12 text-center text-xs text-pos-text-muted">
              No tables found in this zone.
            </div>
          )}

          {!isLoading &&
            activeZones.map(zone => (
              <div key={zone.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-pos-text-muted">
                    {zone.name}
                  </h4>
                  <span className="text-[11px] text-pos-text-muted">
                    {zone.tables.length} tables
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {zone.tables.map(table => {
                    const isSelected = currentTableId === table.id;
                    return (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => {
                          onSelectTable({ id: table.id, name: table.name });
                          onClose();
                        }}
                        className={cn(
                          'p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[90px]',
                          isSelected
                            ? 'border-pos-accent bg-pos-accent/15 ring-2 ring-pos-accent shadow-md'
                            : 'border-pos-border bg-pos-bg hover:border-pos-accent/50 hover:bg-pos-surface'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-bold text-pos-text truncate">
                            {table.name}
                          </span>
                          {isSelected && (
                            <span className="h-5 w-5 rounded-full bg-pos-accent text-white flex items-center justify-center shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-pos-border/40 text-xs">
                          <span className="text-pos-text-muted flex items-center gap-1 text-[11px]">
                            <Users size={12} /> {table.capacity}
                          </span>
                          {getStatusBadge(table.status)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-pos-border bg-pos-header flex items-center justify-between shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSelectTable(null);
              onClose();
            }}
            className="text-xs text-pos-text-muted hover:text-pos-danger"
          >
            Clear Table Selection
          </Button>

          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
