import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosTablesQuery } from '../hooks/usePosData';
import { PosTable } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { X, Users, UtensilsCrossed, Check, AlertCircle, LayoutGrid } from 'lucide-react';
import { cn } from '@/utils/cn';

import { usePermissions } from '@/core/auth/usePermissions';

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
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canViewTables = hasPermission('tables.view');
  const canManageTables = hasPermission('tables.manage');
  const {
    data: floorData,
    isLoading,
    error,
  } = usePosTablesQuery({ enabled: canViewTables });
  const [selectedZoneId, setSelectedZoneId] = useState<string>('ALL');

  const zones = floorData?.zones || [];
  const totalTables = floorData?.summary.totalTables ?? 0;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-3xl bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-pos-primary-soft border border-[#FED7AA] text-pos-primary flex items-center justify-center">
              <UtensilsCrossed size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-pos-text">
                Select Dine-In Table
              </h3>
              <p className="text-xs text-pos-text-muted">
                Assign an active dining table to this order
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close table selector"
            className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Zone Navigation Filter Pills */}
        <div className="px-4 py-2.5 border-b border-pos-border bg-pos-surface-subtle/50 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setSelectedZoneId('ALL')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[34px]',
              selectedZoneId === 'ALL'
                ? 'bg-pos-primary text-white shadow-xs'
                : 'bg-pos-surface text-pos-text-secondary hover:text-pos-text hover:bg-pos-surface-subtle border border-pos-border'
            )}
          >
            All Zones ({floorData?.summary.totalTables || 0})
          </button>
          {zones.map(zone => (
            <button
              key={zone.id}
              type="button"
              onClick={() => setSelectedZoneId(zone.id)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[34px]',
                selectedZoneId === zone.id
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'bg-pos-surface text-pos-text-secondary hover:text-pos-text hover:bg-pos-surface-subtle border border-pos-border'
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

          {!canViewTables && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span className="font-medium">
                Your role does not have permission to view or select floor tables
                (requires tables.view).
              </span>
            </div>
          )}

          {error && canViewTables && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span className="font-medium">
                Failed to fetch table floor plan. Please retry.
              </span>
            </div>
          )}

          {!isLoading && canViewTables && !error && zones.length === 0 && (
            <div className="py-12 px-2 text-center flex flex-col items-center gap-3">
              <LayoutGrid size={32} className="text-pos-text-muted/40" />
              <p className="font-semibold text-sm text-pos-text">No dining tables configured</p>
              <p className="text-xs text-pos-text-secondary max-w-sm leading-relaxed">
                Create a zone and add tables under Floor &amp; Tables before starting a Dine-in
                sale. Takeaway does not require tables.
              </p>
              {canManageTables && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="font-semibold mt-1"
                  onClick={() => {
                    onClose();
                    navigate('/tables');
                  }}
                >
                  Open Floor &amp; Tables
                </Button>
              )}
            </div>
          )}

          {!isLoading &&
            canViewTables &&
            !error &&
            zones.length > 0 &&
            totalTables === 0 && (
              <div className="py-12 px-2 text-center flex flex-col items-center gap-3">
                <UtensilsCrossed size={32} className="text-pos-text-muted/40" />
                <p className="font-semibold text-sm text-pos-text">Zones exist but have no tables</p>
                <p className="text-xs text-pos-text-secondary max-w-sm leading-relaxed">
                  Add at least one table in Floor &amp; Tables, then return here to assign it to
                  this order.
                </p>
                {canManageTables && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="font-semibold mt-1"
                    onClick={() => {
                      onClose();
                      navigate('/tables');
                    }}
                  >
                    Add tables
                  </Button>
                )}
              </div>
            )}

          {!isLoading &&
            canViewTables &&
            totalTables > 0 &&
            activeZones.length === 0 && (
              <div className="py-12 text-center text-xs text-pos-text-muted">
                No tables found in this zone.
              </div>
            )}

          {!isLoading &&
            totalTables > 0 &&
            activeZones.map(zone => (
              <div key={zone.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary">
                    {zone.name}
                  </h4>
                  <span className="text-xs text-pos-text-muted">
                    {zone.tables.length} tables
                  </span>
                </div>

                {zone.tables.length === 0 ? (
                  <p className="text-xs text-pos-text-muted py-2">No tables in this zone.</p>
                ) : (
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
                            'p-3.5 rounded-lg border text-left transition-colors relative flex flex-col justify-between min-h-[90px] shadow-xs',
                            isSelected
                              ? 'border-pos-primary bg-pos-primary-soft/40 ring-1 ring-pos-primary'
                              : 'border-pos-border bg-pos-surface hover:border-pos-border-strong hover:bg-pos-surface-subtle'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-semibold text-pos-text truncate">
                              {table.name}
                            </span>
                            {isSelected && (
                              <span className="h-5 w-5 rounded-full bg-pos-primary text-white flex items-center justify-center shrink-0">
                                <Check size={12} strokeWidth={3} />
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-pos-border text-xs">
                            <span className="text-pos-text-muted flex items-center gap-1">
                              <Users size={12} /> {table.capacity}
                            </span>
                            {getStatusBadge(table.status)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-pos-border bg-pos-surface flex items-center justify-between shrink-0">
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
