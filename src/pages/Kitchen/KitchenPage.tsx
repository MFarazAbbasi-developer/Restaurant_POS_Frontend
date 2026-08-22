import React, { useState, useMemo, useEffect } from 'react';
import {
  useKitchenQueueQuery,
  useKitchenStationsQuery,
  useKitchenPerformanceQuery,
} from '@/features/kitchen/hooks/useKitchenData';
import { KitchenTicket, KitchenQueueQueryParams } from '@/types';
import { KitchenTicketCard } from '@/features/kitchen/components/KitchenTicketCard';
import { KitchenTicketModal } from '@/features/kitchen/components/KitchenTicketModal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  ChefHat,
  RotateCw,
  Search,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  UtensilsCrossed,
  Layers,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const KitchenPage: React.FC = () => {
  // Filters State
  const [selectedStationId, setSelectedStationId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<
    'ALL_ACTIVE' | 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY'
  >('ALL_ACTIVE');
  const [orderTypeFilter, setOrderTypeFilter] = useState<
    'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTicketModal, setActiveTicketModal] = useState<KitchenTicket | null>(null);

  // Live time clock
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTimeStr(
        new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(new Date())
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentDateFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(new Date());
  }, []);

  // TanStack Query Hooks
  const queryParams: KitchenQueueQueryParams = useMemo(() => {
    return {
      ...(selectedStationId !== 'ALL' ? { stationId: selectedStationId } : {}),
      ...(statusFilter !== 'ALL_ACTIVE' ? { status: statusFilter } : {}),
      ...(orderTypeFilter !== 'ALL' ? { orderType: orderTypeFilter } : {}),
      limit: 100,
    };
  }, [selectedStationId, statusFilter, orderTypeFilter]);

  const {
    data: queueData,
    isLoading: isQueueLoading,
    isRefetching,
    error: queueError,
    refetch,
  } = useKitchenQueueQuery(queryParams);

  const { data: rawStations } = useKitchenStationsQuery();
  const { data: performance } = useKitchenPerformanceQuery();

  const stations = useMemo(() => {
    if (Array.isArray(rawStations)) return rawStations;
    if (
      rawStations &&
      typeof rawStations === 'object' &&
      'stations' in rawStations &&
      Array.isArray((rawStations as { stations?: unknown[] }).stations)
    ) {
      return (rawStations as { stations: typeof rawStations }).stations;
    }
    return [];
  }, [rawStations]);

  const rawTickets = useMemo(() => queueData?.tickets || [], [queueData]);

  // Client-side search filter
  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return rawTickets;
    const q = searchQuery.toLowerCase().trim();
    return rawTickets.filter(
      t =>
        t.orderCode.toLowerCase().includes(q) ||
        t.dailySequence.toString().includes(q) ||
        (t.tableName && t.tableName.toLowerCase().includes(q)) ||
        (t.customerName && t.customerName.toLowerCase().includes(q)) ||
        (t.tokenNumber && t.tokenNumber.toString().includes(q)) ||
        t.items.some(it => it.itemName.toLowerCase().includes(q))
    );
  }, [rawTickets, searchQuery]);

  // Performance metrics summary fallback
  const metrics = performance || {
    activeTicketsCount: rawTickets.length,
    preparingTicketsCount: rawTickets.filter(t => t.status === 'PREPARING').length,
    readyTicketsCount: rawTickets.filter(t => t.status === 'READY').length,
    delayedTicketsCount: rawTickets.filter(t => t.urgencyTier === 'CRITICAL').length,
    completedTicketsToday: 0,
    avgPrepTimeMinutes: 0,
  };

  const statusTabs: Array<{
    id: 'ALL_ACTIVE' | 'PENDING' | 'PREPARING' | 'READY';
    label: string;
    count?: number;
  }> = [
    {
      id: 'ALL_ACTIVE',
      label: 'All Active Queue',
      count: queueData?.counts.total ?? rawTickets.length,
    },
    {
      id: 'PENDING',
      label: 'Pending / New',
      count: queueData?.counts.confirmed,
    },
    {
      id: 'PREPARING',
      label: 'Cooking',
      count: queueData?.counts.preparing,
    },
    {
      id: 'READY',
      label: 'Ready to Serve',
      count: queueData?.counts.ready,
    },
  ];

  const channelFilters: Array<{
    id: 'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
    label: string;
  }> = [
    { id: 'ALL', label: 'All Channels' },
    { id: 'DINE_IN', label: 'Dine-In' },
    { id: 'TAKEAWAY', label: 'Takeaway' },
    { id: 'DELIVERY', label: 'Delivery' },
  ];

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden select-none -m-4 md:-m-6 bg-pos-bg">
      {/* =========================================================================
          TOP: Compact Operational Header & Live Queue Metrics
      ========================================================================= */}
      <div className="p-2.5 sm:p-3.5 border-b border-pos-border bg-pos-surface shrink-0 space-y-2.5 shadow-xs">
        {/* Row 1: Operational Header, Metrics & Quick Search/Refresh */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Operational Context & Metric Chips */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Live Connection & Clock Badge */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-pos-surface-subtle border border-pos-border text-pos-text font-medium">
              <span className="flex items-center gap-1.5 text-pos-success font-semibold">
                <span className="h-2 w-2 rounded-full bg-pos-success animate-pulse shrink-0" />
                <span className="text-[11px] hidden sm:inline">Live KDS</span>
              </span>
              <span className="text-pos-border font-light">|</span>
              <span className="text-[11px] font-mono">{currentTimeStr}</span>
              <span className="text-pos-text-muted text-[10px] hidden md:inline">
                ({currentDateFormatted})
              </span>
            </div>

            {/* Active Queue Count */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-surface-subtle border border-pos-border">
              <ChefHat size={14} className="text-pos-primary" />
              <span className="text-pos-text-muted">Active:</span>
              <span className="font-bold text-pos-text font-mono">
                {metrics.activeTicketsCount}
              </span>
            </div>

            {/* Cooking Count */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-info-soft border border-[#BFDBFE] text-pos-info">
              <Clock size={13} />
              <span className="font-medium">Cooking:</span>
              <span className="font-bold font-mono">{metrics.preparingTicketsCount}</span>
            </div>

            {/* Ready Count */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-success-soft border border-[#BBF7D0] text-pos-success">
              <CheckCircle2 size={13} />
              <span className="font-medium">Ready:</span>
              <span className="font-bold font-mono">{metrics.readyTicketsCount}</span>
            </div>

            {/* Delayed Alert Pill (15m+) */}
            {metrics.delayedTicketsCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-danger-soft border border-[#FECACA] text-pos-danger font-bold animate-pulse shadow-xs">
                <Flame size={14} className="shrink-0" />
                <span>Delayed: {metrics.delayedTicketsCount}</span>
              </div>
            )}

            {/* Avg Prep Time */}
            {metrics.avgPrepTimeMinutes > 0 && (
              <div className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-pos-surface-subtle border border-pos-border text-pos-text-muted">
                <Sparkles size={12} className="text-pos-primary" />
                <span>Avg:</span>
                <span className="font-bold text-pos-text font-mono">
                  {metrics.avgPrepTimeMinutes}m
                </span>
              </div>
            )}
          </div>

          {/* Search & Refresh Actions */}
          <div className="flex items-center gap-2">
            <div className="relative w-40 sm:w-56">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search ticket #, table, item..."
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
              title="Refresh KDS queue"
            >
              <RotateCw size={14} className={isRefetching ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Station Navigation Tabs & Queue Filter Sub-bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-pos-border">
          {/* Station Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedStationId('ALL')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 min-h-[32px]',
                selectedStationId === 'ALL'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'bg-pos-surface text-pos-text-secondary hover:text-pos-text hover:bg-pos-surface-subtle border border-pos-border'
              )}
            >
              <Layers size={13} />
              <span>All Stations</span>
            </button>

            {stations.map(st => {
              const isSelected = selectedStationId === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStationId(st.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 min-h-[32px]',
                    isSelected
                      ? 'bg-pos-primary text-white shadow-xs'
                      : 'bg-pos-surface text-pos-text-secondary hover:text-pos-text hover:bg-pos-surface-subtle border border-pos-border'
                  )}
                >
                  <span>{st.name}</span>
                </button>
              );
            })}
          </div>

          {/* Status & Channel Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Channel Filter */}
            <div className="flex items-center bg-pos-surface-subtle border border-pos-border rounded-md p-0.5 text-xs">
              {channelFilters.map(ch => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setOrderTypeFilter(ch.id)}
                  className={cn(
                    'px-2.5 py-1 rounded font-medium transition-colors text-[11px]',
                    orderTypeFilter === ch.id
                      ? 'bg-pos-primary text-white font-semibold shadow-xs'
                      : 'text-pos-text-secondary hover:text-pos-text'
                  )}
                >
                  {ch.label}
                </button>
              ))}
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1">
              {statusTabs.map(tab => {
                const isSelected = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 min-h-[30px]',
                      isSelected
                        ? 'bg-pos-text text-white font-semibold shadow-xs'
                        : 'bg-pos-surface text-pos-text-secondary hover:text-pos-text hover:bg-pos-surface-subtle border border-pos-border'
                    )}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={cn(
                          'px-1.5 py-0.2 rounded text-[10px] font-mono',
                          isSelected
                            ? 'bg-white/20 text-white font-bold'
                            : 'bg-pos-surface-subtle text-pos-text-muted'
                        )}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CENTER / MAIN: KDS Tickets Board Grid
      ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar bg-pos-bg">
        {isQueueLoading && (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
            <Spinner size="lg" />
            <span>Loading Kitchen Display Tickets...</span>
          </div>
        )}

        {queueError && (
          <div className="p-4 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>Failed to load kitchen queue. Please check network connectivity.</span>
          </div>
        )}

        {!isQueueLoading && filteredTickets.length === 0 && (
          <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-2">
            <UtensilsCrossed size={36} className="text-pos-text-muted/40" />
            <p className="font-bold text-sm text-pos-text">Kitchen Queue is Clear!</p>
            <p className="text-[11px] max-w-sm">
              {statusFilter !== 'ALL_ACTIVE' || selectedStationId !== 'ALL'
                ? 'No active kitchen tickets match the current station or status filter.'
                : 'All orders have been prepared and expedited.'}
            </p>
          </div>
        )}

        {!isQueueLoading && filteredTickets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 items-start">
            {filteredTickets.map(ticket => (
              <KitchenTicketCard
                key={ticket.id}
                ticket={ticket}
                onOpenDetails={() => setActiveTicketModal(ticket)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {activeTicketModal && (
        <KitchenTicketModal
          ticket={activeTicketModal}
          onClose={() => setActiveTicketModal(null)}
        />
      )}
    </div>
  );
};

export default KitchenPage;
