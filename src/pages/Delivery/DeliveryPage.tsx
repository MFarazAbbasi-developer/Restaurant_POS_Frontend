import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useDeliveryQueueQuery,
  useDeliveryZonesQuery,
} from '@/features/delivery/hooks/useDeliveryData';
import { useAuthStore } from '@/core/auth/authStore';
import { useCartStore } from '@/features/orders/store/cartStore';
import { DeliveryOrderRecord } from '@/types';
import { DeliveryCard } from '@/features/delivery/components/DeliveryCard';
import { DeliveryDetailsDrawer } from '@/features/delivery/components/DeliveryDetailsDrawer';
import { AssignRiderModal } from '@/features/delivery/components/AssignRiderModal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  Truck,
  RotateCw,
  Search,
  X,
  Plus,
  Clock,
  ChefHat,
  CheckCircle2,
  Send,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const DeliveryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setOrderType, setSelectedTable } = useCartStore();

  const {
    data: queueData,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useDeliveryQueueQuery();

  const { data: zones = [] } = useDeliveryZonesQuery();

  const currency =
    user && 'restaurant' in user && user.restaurant?.currency
      ? user.restaurant.currency
      : 'USD';

  // Local Filter & Selection State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [assigningOrder, setAssigningOrder] = useState<DeliveryOrderRecord | null>(null);

  const rawQueue = useMemo(() => queueData?.queue || [], [queueData]);

  // Selected Order
  const selectedOrder = useMemo(() => {
    return rawQueue.find(o => o.id === selectedOrderId) || null;
  }, [rawQueue, selectedOrderId]);

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    let result = rawQueue;

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(o => o.status === statusFilter);
    }

    // Zone filter
    if (selectedZone !== 'ALL') {
      result = result.filter(o => o.deliveryZoneName === selectedZone);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        o =>
          o.customerName.toLowerCase().includes(q) ||
          o.orderCode.toLowerCase().includes(q) ||
          o.deliveryAddress.toLowerCase().includes(q) ||
          (o.landmark && o.landmark.toLowerCase().includes(q)) ||
          (o.rider?.name && o.rider.name.toLowerCase().includes(q)) ||
          o.customerPhone.toLowerCase().includes(q)
      );
    }

    return result;
  }, [rawQueue, statusFilter, selectedZone, searchQuery]);

  // Summary Metrics
  const summary = queueData?.summary || {
    totalActive: rawQueue.length,
    pending: rawQueue.filter(o => o.status === 'PENDING').length,
    preparing: rawQueue.filter(o => o.status === 'PREPARING').length,
    ready: rawQueue.filter(o => o.status === 'READY').length,
    dispatched: rawQueue.filter(o => o.status === 'DISPATCHED').length,
  };

  // Launch New Delivery Order in POS Register
  const handleNewDeliveryOrder = () => {
    setOrderType('DELIVERY');
    setSelectedTable(null);
    navigate('/orders');
  };

  const statusFilters: Array<{ id: string; label: string; count: number }> = [
    { id: 'ALL', label: 'All Active', count: summary.totalActive },
    { id: 'PENDING', label: 'Pending', count: summary.pending },
    { id: 'PREPARING', label: 'Preparing', count: summary.preparing },
    { id: 'READY', label: 'Ready for Dispatch', count: summary.ready },
    { id: 'DISPATCHED', label: 'Out for Delivery', count: summary.dispatched },
  ];

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-3.5 overflow-hidden select-none -m-4 md:-m-6 p-3 sm:p-4 bg-pos-bg">
      {/* =========================================================================
          LEFT / CENTER: Delivery Dispatcher Queue Board
      ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-pos-surface border border-pos-border rounded-lg overflow-hidden shadow-xs">
        {/* Header Bar */}
        <div className="p-3 sm:p-3.5 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Summary Metric Chips */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-surface-subtle border border-pos-border">
              <Truck size={14} className="text-pos-primary" />
              <span className="text-pos-text-muted">Active:</span>
              <span className="font-bold text-pos-text font-mono">
                {summary.totalActive}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-warning-soft border border-[#FED7AA] text-pos-warning">
              <Clock size={13} />
              <span className="font-medium">Pending:</span>
              <span className="font-bold font-mono">{summary.pending}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-info-soft border border-[#BFDBFE] text-pos-info">
              <ChefHat size={13} />
              <span className="font-medium">Preparing:</span>
              <span className="font-bold font-mono">{summary.preparing}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-success-soft border border-[#BBF7D0] text-pos-success">
              <CheckCircle2 size={13} />
              <span className="font-medium">Ready:</span>
              <span className="font-bold font-mono">{summary.ready}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pos-primary-soft border border-pos-primary/20 text-pos-primary">
              <Send size={13} />
              <span className="font-medium">Dispatched:</span>
              <span className="font-bold font-mono">{summary.dispatched}</span>
            </div>
          </div>

          {/* Actions & Search */}
          <div className="flex items-center gap-2">
            {/* Zone Filter Dropdown */}
            {zones.length > 0 && (
              <select
                value={selectedZone}
                onChange={e => setSelectedZone(e.target.value)}
                className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium min-h-[36px]"
              >
                <option value="ALL">All Zones</option>
                {zones.map(z => (
                  <option key={z.id} value={z.name}>
                    {z.name}
                  </option>
                ))}
              </select>
            )}

            <div className="relative w-40 sm:w-56">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search code, address, rider..."
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
              title="Refresh delivery queue"
            >
              <RotateCw size={14} className={isRefetching ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleNewDeliveryOrder}
              className="min-h-[36px] px-3.5 font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={15} />
              <span>New Delivery</span>
            </Button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="px-3.5 py-2 border-b border-pos-border bg-pos-surface-subtle flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
          {statusFilters.map(tab => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 min-h-[32px]',
                  isSelected
                    ? 'bg-pos-primary text-white shadow-xs'
                    : 'bg-pos-surface text-pos-text-secondary hover:text-pos-text hover:bg-pos-surface-subtle border border-pos-border'
                )}
              >
                <span>{tab.label}</span>
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
              </button>
            );
          })}
        </div>

        {/* Deliveries Queue Grid Viewport */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar bg-pos-bg">
          {isLoading && (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
              <Spinner size="lg" />
              <span>Loading Dispatcher Delivery Queue...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>Failed to load delivery queue. Please check network connection.</span>
            </div>
          )}

          {!isLoading && filteredQueue.length === 0 && (
            <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-2">
              <Truck size={32} className="text-pos-text-muted/40" />
              <p className="font-semibold text-sm text-pos-text">
                No delivery orders in this queue
              </p>
              <p className="text-[11px] max-w-xs">
                {statusFilter !== 'ALL' || selectedZone !== 'ALL'
                  ? 'No orders match current status or zone filters'
                  : 'Click "New Delivery" above to create a phone-in or dispatch order'}
              </p>
            </div>
          )}

          {!isLoading && filteredQueue.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredQueue.map(order => (
                <DeliveryCard
                  key={order.id}
                  order={order}
                  currency={currency}
                  isSelected={selectedOrderId === order.id}
                  onClick={() =>
                    setSelectedOrderId(prev => (prev === order.id ? null : order.id))
                  }
                  onAssignRiderClick={() => setAssigningOrder(order)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          RIGHT SIDE: Delivery Details Drawer
      ========================================================================= */}
      {selectedOrder && (
        <DeliveryDetailsDrawer
          order={selectedOrder}
          currency={currency}
          onClose={() => setSelectedOrderId(null)}
          onRefresh={() => refetch()}
        />
      )}

      {/* Standalone Rider Assignment Modal */}
      {assigningOrder && (
        <AssignRiderModal
          order={assigningOrder}
          onClose={() => setAssigningOrder(null)}
          onSuccess={() => {
            refetch();
            setAssigningOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default DeliveryPage;
