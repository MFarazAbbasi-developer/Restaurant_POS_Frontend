import React, { useState, useMemo } from 'react';
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

  const { data: stations = [] } = useKitchenStationsQuery();
  const { data: performance } = useKitchenPerformanceQuery();

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
      label: 'Pending / Confirmed',
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
          TOP: KDS Live Analytics & Control Header
      ========================================================================= */}
      <div className="p-3 sm:p-4 border-b border-pos-border bg-pos-header shrink-0 space-y-3">
        {/* Row 1: Metrics & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Performance Metric Badges */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pos-surface border border-pos-border">
              <ChefHat size={15} className="text-pos-accent" />
              <span className="text-pos-text-muted">Active:</span>
              <span className="font-black text-pos-text font-mono">
                {metrics.activeTicketsCount}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pos-info/10 border border-pos-info/30 text-pos-info">
              <Clock size={14} />
              <span className="font-semibold">Cooking:</span>
              <span className="font-black font-mono">
                {metrics.preparingTicketsCount}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pos-success/10 border border-pos-success/30 text-pos-success">
              <CheckCircle2 size={14} />
              <span className="font-semibold">Ready:</span>
              <span className="font-black font-mono">{metrics.readyTicketsCount}</span>
            </div>

            {metrics.delayedTicketsCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pos-danger text-white font-bold animate-pulse shadow-sm">
                <Flame size={14} className="animate-bounce" />
                <span>Delayed (15m+): {metrics.delayedTicketsCount}</span>
              </div>
            )}

            {metrics.avgPrepTimeMinutes > 0 && (
              <div className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-pos-surface border border-pos-border text-pos-text-muted">
                <Sparkles size={13} className="text-pos-warning" />
                <span>Avg Prep:</span>
                <span className="font-bold text-pos-text font-mono">
                  {metrics.avgPrepTimeMinutes}m
                </span>
              </div>
            )}
          </div>

          {/* Search & Refresh Actions */}
          <div className="flex items-center gap-2">
            <div className="relative w-44 sm:w-60">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search ticket #, item, table..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-medium min-h-[36px]"
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
              className="min-h-[36px] px-3 font-semibold flex items-center gap-1.5"
              title="Refresh KDS queue"
            >
              <RotateCw size={14} className={isRefetching ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Stations, Status & Channel Filters Sub-bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-pos-border/40">
          {/* Station Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedStationId('ALL')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[32px]',
                selectedStationId === 'ALL'
                  ? 'bg-pos-accent text-white shadow-sm'
                  : 'bg-pos-surface text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover border border-pos-border'
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
                    'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 min-h-[32px]',
                    isSelected
                      ? 'bg-pos-accent text-white shadow-sm'
                      : 'bg-pos-surface text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover border border-pos-border'
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
            <div className="flex items-center bg-pos-surface border border-pos-border rounded-xl p-0.5 text-xs">
              {channelFilters.map(ch => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setOrderTypeFilter(ch.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-semibold transition-all text-[11px]',
                    orderTypeFilter === ch.id
                      ? 'bg-pos-accent text-white shadow-xs'
                      : 'text-pos-text-muted hover:text-pos-text'
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
                      'px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[32px]',
                      isSelected
                        ? 'bg-pos-text text-pos-bg shadow-sm font-black'
                        : 'bg-pos-surface text-pos-text-muted hover:text-pos-text border border-pos-border'
                    )}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={cn(
                          'px-1.5 py-0.2 rounded text-[10px] font-mono font-bold',
                          isSelected
                            ? 'bg-pos-bg/25 text-pos-bg'
                            : 'bg-pos-bg text-pos-text-muted'
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
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 custom-scrollbar">
        {isQueueLoading && (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
            <Spinner size="lg" />
            <span>Loading Kitchen Display Tickets...</span>
          </div>
        )}

        {queueError && (
          <div className="p-4 rounded-xl bg-pos-danger/10 border border-pos-danger/30 text-pos-danger text-xs flex items-center gap-2">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 items-start">
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
