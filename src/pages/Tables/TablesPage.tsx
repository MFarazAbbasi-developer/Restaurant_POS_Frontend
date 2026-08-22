import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosTablesQuery } from '@/features/orders/hooks/usePosData';
import { useAuthStore } from '@/core/auth/authStore';
import { TableCard } from '@/features/tables/components/TableCard';
import { TableDetailsDrawer } from '@/features/tables/components/TableDetailsDrawer';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  UtensilsCrossed,
  RotateCw,
  Search,
  X,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Percent,
  PlusCircle,
  Printer,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const TablesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    data: floorData,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = usePosTablesQuery();

  const currency =
    user && 'restaurant' in user && user.restaurant?.currency
      ? user.restaurant.currency
      : 'USD';

  // Local Filter & Selection State
  const [selectedZoneId, setSelectedZoneId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const zones = useMemo(() => floorData?.zones || [], [floorData]);

  // Flatten all tables with zone reference
  const allTables = useMemo(() => {
    return zones.flatMap(z =>
      z.tables.map(t => ({
        ...t,
        zoneId: z.id,
        zoneName: z.name,
      }))
    );
  }, [zones]);

  // Selected table object
  const selectedTable = useMemo(() => {
    return allTables.find(t => t.id === selectedTableId) || null;
  }, [allTables, selectedTableId]);

  const selectedTableZone = useMemo(() => {
    if (!selectedTable) return undefined;
    return zones.find(z => z.id === selectedTable.zoneId);
  }, [zones, selectedTable]);

  // Summary Metrics
  const summary = floorData?.summary || {
    totalZones: zones.length,
    totalTables: allTables.length,
    occupiedTables: allTables.filter(
      t => t.status === 'OCCUPIED' || t.status === 'BILL_PRINTED'
    ).length,
    availableTables: allTables.filter(t => t.status === 'AVAILABLE').length,
    totalGuestsSeated: allTables.reduce(
      (sum, t) =>
        sum + (t.activeOrders?.reduce((s, o) => s + (o.guestCount || 0), 0) || 0),
      0
    ),
  };

  const cleaningCount = allTables.filter(t => t.status === 'CLEANING').length;
  const billPrintedCount = allTables.filter(t => t.status === 'BILL_PRINTED').length;

  const occupancyRate =
    summary.totalTables > 0
      ? Math.round((summary.occupiedTables / summary.totalTables) * 100)
      : 0;

  // Filtered Tables
  const filteredTables = useMemo(() => {
    let result = allTables;

    // Zone Filter
    if (selectedZoneId !== 'ALL') {
      result = result.filter(t => t.zoneId === selectedZoneId);
    }

    // Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter(t => t.status === statusFilter);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        t =>
          t.name.toLowerCase().includes(q) ||
          t.zoneName.toLowerCase().includes(q) ||
          t.activeOrders?.some(o => o.orderCode.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allTables, selectedZoneId, statusFilter, searchQuery]);

  const statusFilters: Array<{ id: string; label: string; count: number }> = [
    { id: 'ALL', label: 'All Tables', count: allTables.length },
    {
      id: 'AVAILABLE',
      label: 'Available',
      count: allTables.filter(t => t.status === 'AVAILABLE').length,
    },
    {
      id: 'OCCUPIED',
      label: 'Occupied',
      count: allTables.filter(t => t.status === 'OCCUPIED').length,
    },
    { id: 'BILL_PRINTED', label: 'Bill Printed', count: billPrintedCount },
    { id: 'CLEANING', label: 'Needs Cleaning', count: cleaningCount },
    {
      id: 'RESERVED',
      label: 'Reserved',
      count: allTables.filter(t => t.status === 'RESERVED').length,
    },
  ];

  // Current Date display
  const currentDateFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(new Date());
  }, []);

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col xl:flex-row gap-3 overflow-hidden select-none -m-4 md:-m-6 p-2 sm:p-3 bg-pos-bg">
      {/* =========================================================================
          LEFT / CENTER: Floor Overview Metrics, Zone Tabs, & Table Grid
      ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-pos-surface border border-pos-border rounded-lg overflow-hidden shadow-xs">
        {/* Top Header Operational & Metric Bar */}
        <div className="p-3 sm:p-3.5 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Operational Context & Metric Chips */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Live Operational Context Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-surface-subtle border border-pos-border text-pos-text font-medium">
              <Calendar size={13} className="text-pos-primary" />
              <span>{currentDateFormatted}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-surface-subtle border border-pos-border">
              <UtensilsCrossed size={13} className="text-pos-primary" />
              <span className="text-pos-text-muted">Total:</span>
              <span className="font-semibold text-pos-text font-mono">
                {summary.totalTables}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-success-soft border border-[#BBF7D0] text-pos-success">
              <CheckCircle2 size={13} />
              <span className="font-medium">Available:</span>
              <span className="font-bold font-mono">{summary.availableTables}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-warning-soft border border-[#FED7AA] text-pos-warning">
              <Clock size={13} />
              <span className="font-medium">Occupied:</span>
              <span className="font-bold font-mono">{summary.occupiedTables}</span>
            </div>

            {billPrintedCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-info-soft border border-[#BFDBFE] text-pos-info">
                <Printer size={13} />
                <span className="font-medium">Bill Out:</span>
                <span className="font-bold font-mono">{billPrintedCount}</span>
              </div>
            )}

            {cleaningCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-danger-soft border border-[#FECACA] text-pos-danger">
                <AlertTriangle size={13} />
                <span className="font-medium">Dirty:</span>
                <span className="font-bold font-mono">{cleaningCount}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-surface-subtle border border-pos-border">
              <Users size={13} className="text-pos-primary" />
              <span className="text-pos-text-muted">Guests:</span>
              <span className="font-semibold text-pos-text font-mono">
                {summary.totalGuestsSeated}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-surface-subtle border border-pos-border">
              <Percent size={13} className="text-pos-primary" />
              <span className="text-pos-text-muted">Occupancy:</span>
              <span className="font-semibold text-pos-text font-mono">
                {occupancyRate}%
              </span>
            </div>
          </div>

          {/* Search, Refresh & Fast Action */}
          <div className="flex items-center gap-2">
            <div className="relative w-40 sm:w-52">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tables..."
                className="w-full pl-8 pr-7 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text placeholder-pos-text-muted text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium min-h-[36px]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-pos-text-muted hover:text-pos-text"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="min-h-[36px] px-3 font-medium flex items-center gap-1.5"
              title="Refresh live floor state"
            >
              <RotateCw size={14} className={isRefetching ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/orders')}
              className="min-h-[36px] px-3 font-semibold flex items-center gap-1.5 shadow-xs"
              title="Open POS Register"
            >
              <PlusCircle size={14} />
              <span className="hidden md:inline">New Sale</span>
            </Button>
          </div>
        </div>

        {/* Zones Horizontal Filter Bar */}
        <div className="px-3 py-2 border-b border-pos-border bg-pos-surface-subtle/50 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setSelectedZoneId('ALL')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[34px] flex items-center gap-1.5',
              selectedZoneId === 'ALL'
                ? 'bg-pos-primary text-white shadow-xs'
                : 'bg-pos-surface text-pos-text-secondary hover:text-pos-text hover:bg-pos-surface-subtle border border-pos-border'
            )}
          >
            <span>All Zones</span>
            <span
              className={cn(
                'text-[10px] font-mono px-1.5 py-0.2 rounded',
                selectedZoneId === 'ALL'
                  ? 'bg-white/20 text-white'
                  : 'bg-pos-surface-subtle text-pos-text-muted'
              )}
            >
              {allTables.length}
            </span>
          </button>
          {zones.map(zone => {
            const isSelected = selectedZoneId === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZoneId(zone.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[34px] flex items-center gap-1.5',
                  isSelected
                    ? 'bg-pos-primary text-white shadow-xs'
                    : 'bg-pos-surface text-pos-text-secondary hover:text-pos-text hover:bg-pos-surface-subtle border border-pos-border'
                )}
              >
                <span>{zone.name}</span>
                <span
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0.2 rounded',
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-pos-surface-subtle text-pos-text-muted'
                  )}
                >
                  {zone.tables.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Filter Pills Sub-bar */}
        <div className="px-3 py-1.5 border-b border-pos-border bg-pos-surface flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
          {statusFilters.map(sf => {
            const isSelected = statusFilter === sf.id;
            return (
              <button
                key={sf.id}
                type="button"
                onClick={() => setStatusFilter(sf.id)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5',
                  isSelected
                    ? 'bg-pos-text text-white font-semibold'
                    : 'text-pos-text-secondary hover:text-pos-text hover:bg-pos-surface-subtle'
                )}
              >
                <span>{sf.label}</span>
                <span
                  className={cn(
                    'text-[10px] font-mono px-1 py-0.2 rounded',
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-pos-surface-subtle text-pos-text-muted'
                  )}
                >
                  {sf.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tables Grid Viewport */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar bg-pos-bg">
          {isLoading && (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
              <Spinner size="lg" />
              <span>Loading Restaurant Floor Plan...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>Failed to load floor tables. Please check backend connection.</span>
            </div>
          )}

          {!isLoading && filteredTables.length === 0 && (
            <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-2">
              <UtensilsCrossed size={28} className="text-pos-text-muted/50" />
              <p className="font-semibold text-pos-text">No tables found</p>
              <p className="text-xs">Try adjusting your zone or status filter</p>
            </div>
          )}

          {!isLoading && filteredTables.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {filteredTables.map(table => (
                <TableCard
                  key={table.id}
                  table={table}
                  currency={currency}
                  isSelected={selectedTableId === table.id}
                  onClick={() =>
                    setSelectedTableId(prev => (prev === table.id ? null : table.id))
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          RIGHT SIDE: Table Details Drawer (~390px)
      ========================================================================= */}
      {selectedTable && (
        <TableDetailsDrawer
          table={selectedTable}
          zone={selectedTableZone}
          allZones={zones}
          currency={currency}
          onClose={() => setSelectedTableId(null)}
          onRefresh={() => refetch()}
        />
      )}
    </div>
  );
};
