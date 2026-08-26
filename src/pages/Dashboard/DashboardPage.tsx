import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/core/auth/authStore';
import { usePermissions } from '@/core/auth/usePermissions';
import { useSocketStatus, useSocketEvent } from '@/core/socket/useSocket';
import { PRODUCT_IDENTITY } from '@/config/product';
import {
  usePosTablesQuery,
  useOrdersListQuery,
} from '@/features/orders/hooks/usePosData';
import { useKitchenQueueQuery } from '@/features/kitchen/hooks/useKitchenData';
import { useTakeawayQueueQuery } from '@/features/takeaway/hooks/useTakeawayData';
import { useDeliveryQueueQuery } from '@/features/delivery/hooks/useDeliveryData';
import { useCurrentShiftQuery } from '@/features/shifts/hooks/useShiftsData';
import { useLowStockQuery } from '@/features/inventory/hooks/useInventoryData';
import { useReservationsQuery } from '@/features/reservations/hooks/useReservationData';
import {
  useSalesSummaryReportQuery,
  useHourlyTrendsReportQuery,
  useSalesByOrderTypeReportQuery,
} from '@/features/reports/hooks/useReportsData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  UtensilsCrossed,
  ChefHat,
  Package,
  Truck,
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  Banknote,
  RotateCw,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { OrderStatus, OrderType } from '@/types';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, terminal } = useAuthStore();
  const { roles, hasPermission } = usePermissions();
  const { isConnected, isReconnecting } = useSocketStatus();

  // ---------------------------------------------------------------------------
  // Date & Time helpers
  // ---------------------------------------------------------------------------
  const [liveTime, setLiveTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const currency =
    user && 'restaurant' in user && user.restaurant?.currency
      ? user.restaurant.currency
      : 'USD';

  const formatPrice = useCallback(
    (val: number | string | null | undefined) => {
      const num = Number(val || 0);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    },
    [currency]
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // ---------------------------------------------------------------------------
  // Socket.IO Real-time Invalidation Listeners
  // ---------------------------------------------------------------------------
  useSocketEvent('order:created', () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
    queryClient.invalidateQueries({ queryKey: ['pos', 'tables'] });
  });

  useSocketEvent('order:status_changed', () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
    queryClient.invalidateQueries({ queryKey: ['pos', 'tables'] });
  });

  useSocketEvent('kitchen:order_bumped', () => {
    queryClient.invalidateQueries({ queryKey: ['kitchen'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['pos', 'tables'] });
  });

  useSocketEvent('kitchen:order_new', () => {
    queryClient.invalidateQueries({ queryKey: ['kitchen'] });
  });

  useSocketEvent('takeaway:status_changed', () => {
    queryClient.invalidateQueries({ queryKey: ['takeaway'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  });

  useSocketEvent('table:status_changed', () => {
    queryClient.invalidateQueries({ queryKey: ['pos', 'tables'] });
  });

  useSocketEvent('shift:opened', () => {
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
  });

  useSocketEvent('shift:closed', () => {
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
  });

  useSocketEvent('shift:cash_drop', () => {
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
  });

  useSocketEvent('inventory:low_stock', () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  });

  // ---------------------------------------------------------------------------
  // Real Data Queries with RBAC Gates
  // ---------------------------------------------------------------------------
  const canViewReports = hasPermission('reports.view');
  const canViewShifts = hasPermission('shifts.view');
  const canViewOrders = hasPermission('orders.view');
  const canViewTables = hasPermission('tables.view');
  const canViewInventory = hasPermission('inventory.view');
  const canViewReservations = hasPermission('reservations.view');
  const canViewKitchen = hasPermission('kitchen.view');
  const canViewDelivery = hasPermission('delivery.view');

  // Live Operations queries
  const currentShiftQuery = useCurrentShiftQuery({ enabled: canViewShifts });
  const tablesQuery = usePosTablesQuery({ enabled: canViewTables });
  const kitchenQuery = useKitchenQueueQuery(undefined, { enabled: canViewKitchen });
  const takeawayQuery = useTakeawayQueueQuery();
  const deliveryQuery = useDeliveryQueueQuery({ enabled: canViewDelivery });
  const lowStockQuery = useLowStockQuery({ enabled: canViewInventory });
  const recentOrdersQuery = useOrdersListQuery(canViewOrders ? { limit: 8 } : undefined);

  // Business Date determination:
  // Priority: 1. Active shift business date -> 2. Consistent ISO date (matches backend sequence/stamping)
  const todayStr = useMemo(() => {
    if (currentShiftQuery.data?.businessDate) {
      return currentShiftQuery.data.businessDate;
    }
    return new Date().toISOString().split('T')[0];
  }, [currentShiftQuery.data?.businessDate]);

  // Reports queries (Today's metrics)
  const salesSummaryQuery = useSalesSummaryReportQuery(
    canViewReports ? { startDate: todayStr, endDate: todayStr } : undefined
  );
  const hourlyTrendsQuery = useHourlyTrendsReportQuery(
    canViewReports ? { startDate: todayStr, endDate: todayStr } : undefined
  );
  const orderTypeQuery = useSalesByOrderTypeReportQuery(
    canViewReports ? { startDate: todayStr, endDate: todayStr } : undefined
  );
  const reservationsQuery = useReservationsQuery(
    canViewReservations ? { reservationDate: todayStr, status: 'CONFIRMED' } : undefined
  );

  // ---------------------------------------------------------------------------
  // Computed Live Operation Statistics
  // ---------------------------------------------------------------------------
  const allTables = useMemo(() => {
    if (!tablesQuery.data?.zones) return [];
    return tablesQuery.data.zones.flatMap(z => z.tables);
  }, [tablesQuery.data]);

  const tableStats = useMemo(() => {
    const total = allTables.length;
    const occupied = allTables.filter(
      t => t.status === 'OCCUPIED' || t.status === 'BILL_PRINTED'
    ).length;
    const available = allTables.filter(t => t.status === 'AVAILABLE').length;
    const billPrinted = allTables.filter(t => t.status === 'BILL_PRINTED').length;
    const cleaning = allTables.filter(t => t.status === 'CLEANING').length;
    const seatedGuests = allTables.reduce((sum, t) => {
      const guestsInTable =
        t.activeOrders?.reduce((acc, o) => acc + (o.guestCount || 0), 0) || 0;
      return sum + guestsInTable;
    }, 0);
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return {
      total,
      occupied,
      available,
      billPrinted,
      cleaning,
      seatedGuests,
      occupancyRate,
    };
  }, [allTables]);

  const kitchenStats = useMemo(() => {
    const tickets = kitchenQuery.data?.tickets || [];
    const active = tickets.filter(
      t => t.status === 'PREPARING' || t.status === 'CONFIRMED' || t.status === 'PENDING'
    );
    const ready = tickets.filter(t => t.status === 'READY');
    const delayed = active.filter(t => (t.elapsedMinutes || 0) >= 15);
    return {
      total: tickets.length,
      activeCount: active.length,
      readyCount: ready.length,
      delayedCount: delayed.length,
      delayedTickets: delayed,
    };
  }, [kitchenQuery.data]);

  const takeawayStats = useMemo(() => {
    const queue = takeawayQuery.data?.queue || [];
    const preparing = queue.filter(o => o.status === 'PREPARING');
    const ready = queue.filter(o => o.status === 'READY');
    return {
      total: queue.length,
      preparingCount: preparing.length,
      readyCount: ready.length,
    };
  }, [takeawayQuery.data]);

  const deliveryStats = useMemo(() => {
    const queue = deliveryQuery.data?.queue || [];
    const summary = deliveryQuery.data?.summary;
    const unassigned = queue.filter(d => !d.rider && d.status !== 'FAILED');
    const outForDelivery = queue.filter(d => d.status === 'DISPATCHED');
    const readyForPickup = queue.filter(d => d.status === 'READY');
    return {
      total: summary?.totalActive ?? queue.length,
      unassignedCount: unassigned.length,
      unassignedOrders: unassigned,
      outForDeliveryCount: summary?.dispatched ?? outForDelivery.length,
      readyCount: summary?.ready ?? readyForPickup.length,
    };
  }, [deliveryQuery.data]);

  const lowStockItems = useMemo(() => {
    return lowStockQuery.data?.items || [];
  }, [lowStockQuery.data]);

  const upcomingReservations = useMemo(() => {
    return reservationsQuery.data?.reservations || [];
  }, [reservationsQuery.data]);

  // ---------------------------------------------------------------------------
  // Actionable Attention Items List
  // ---------------------------------------------------------------------------
  const attentionItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      desc: string;
      severity: 'danger' | 'warning' | 'info';
      link: string;
      actionText: string;
    }> = [];

    // 1. Delayed Kitchen Tickets (>15m)
    if (canViewKitchen && kitchenStats.delayedCount > 0) {
      items.push({
        id: 'delayed-kds',
        title: `${kitchenStats.delayedCount} Delayed Kitchen Ticket${
          kitchenStats.delayedCount > 1 ? 's' : ''
        }`,
        desc: `Tickets exceeding 15m target prep time in kitchen queue (${kitchenStats.delayedTickets
          .map(t => `#${t.orderCode}`)
          .slice(0, 3)
          .join(', ')})`,
        severity: 'danger',
        link: '/kitchen',
        actionText: 'View KDS',
      });
    }

    // 2. Unassigned Delivery Orders
    if (canViewDelivery && deliveryStats.unassignedCount > 0) {
      items.push({
        id: 'unassigned-delivery',
        title: `${deliveryStats.unassignedCount} Delivery Order${
          deliveryStats.unassignedCount > 1 ? 's' : ''
        } Unassigned`,
        desc: 'Orders awaiting rider assignment at dispatch station.',
        severity: 'warning',
        link: '/delivery',
        actionText: 'Dispatch',
      });
    }

    // 3. Low Stock Items
    if (canViewInventory && lowStockItems.length > 0) {
      items.push({
        id: 'low-stock',
        title: `${lowStockItems.length} Inventory Item${
          lowStockItems.length > 1 ? 's' : ''
        } Low on Stock`,
        desc: `${lowStockItems
          .map(i => i.name)
          .slice(0, 3)
          .join(', ')} reached reorder threshold.`,
        severity: 'warning',
        link: '/inventory',
        actionText: 'Restock',
      });
    }

    // 4. Shift & Cash Variance / Closed Shift alert
    if (canViewShifts) {
      const shift = currentShiftQuery.data;
      if (!shift || shift.status !== 'OPEN') {
        items.push({
          id: 'shift-closed',
          title: 'Register Shift Currently Closed',
          desc: 'Open a shift to start accepting cash payments and track drawer float.',
          severity: 'info',
          link: '/shifts',
          actionText: 'Open Shift',
        });
      } else if (shift.variance && Number(shift.variance) !== 0) {
        items.push({
          id: 'cash-variance',
          title: `Cash Variance: ${formatPrice(shift.variance)}`,
          desc: 'Drawer reconciliation difference detected on active shift.',
          severity: 'danger',
          link: '/shifts',
          actionText: 'Inspect',
        });
      }
    }

    // 5. Today's Upcoming Reservations
    if (canViewReservations && upcomingReservations.length > 0) {
      items.push({
        id: 'upcoming-reservations',
        title: `${upcomingReservations.length} Confirmed Reservation${
          upcomingReservations.length > 1 ? 's' : ''
        } Today`,
        desc: `Upcoming guest bookings: ${upcomingReservations
          .map(r => `${r.customerName} (${r.guestCount}p)`)
          .slice(0, 2)
          .join(', ')}`,
        severity: 'info',
        link: '/reservations',
        actionText: 'Floor Plan',
      });
    }

    return items;
  }, [
    canViewKitchen,
    kitchenStats,
    canViewDelivery,
    deliveryStats,
    canViewInventory,
    lowStockItems,
    canViewShifts,
    currentShiftQuery.data,
    canViewReservations,
    upcomingReservations,
    formatPrice,
  ]);

  // Hourly Trends Peak calculation
  const hourlyData = useMemo(() => {
    return hourlyTrendsQuery.data?.hourlyData || [];
  }, [hourlyTrendsQuery.data?.hourlyData]);

  const peakHour = hourlyTrendsQuery.data?.peakHour;
  const maxHourlyNet = useMemo(() => {
    return Math.max(...hourlyData.map(h => h.netSales), 1);
  }, [hourlyData]);

  // Channel breakdown
  const channelBreakdown = orderTypeQuery.data?.breakdown || [];
  const totalChannelRevenue = orderTypeQuery.data?.totals?.totalSales || 0;

  // Format relative time helper
  const getRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(dateStr).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">COMPLETED</Badge>;
      case 'SERVED':
        return <Badge variant="info">SERVED</Badge>;
      case 'READY':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            READY
          </span>
        );
      case 'PREPARING':
        return <Badge variant="warning">PREPARING</Badge>;
      case 'CONFIRMED':
      case 'PENDING':
        return <Badge variant="default">{status}</Badge>;
      case 'CANCELLED':
      case 'VOIDED':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getOrderTypeBadge = (type: OrderType) => {
    switch (type) {
      case 'DINE_IN':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <UtensilsCrossed size={11} /> Dine-In
          </span>
        );
      case 'TAKEAWAY':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Package size={11} /> Takeaway
          </span>
        );
      case 'DELIVERY':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Truck size={11} /> Delivery
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 pb-8 max-w-[1600px] mx-auto">
      {/* ===================================================================== */}
      {/* 1. NOW: COMPACT OPERATIONAL HEADER                                    */}
      {/* ===================================================================== */}
      <div className="bg-pos-surface border border-pos-border rounded-lg p-3.5 sm:p-4 shadow-pos flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-pos-primary-soft border border-[#FED7AA] flex items-center justify-center text-pos-primary font-bold text-base shrink-0">
            {user?.name?.charAt(0) || 'F'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-pos-text leading-tight">
                {getGreeting()},{' '}
                <span className="text-pos-primary">{user?.name || 'Operator'}</span>
              </h1>
              <div className="flex items-center gap-1">
                {roles.slice(0, 2).map(r => (
                  <span
                    key={r}
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-pos-surface-subtle border border-pos-border text-pos-text-secondary"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-pos-text-muted mt-0.5 flex items-center gap-2">
              <span>
                Terminal: {terminal?.terminalId || PRODUCT_IDENTITY.defaultTerminalId}
              </span>
              <span>•</span>
              <span>
                {user && 'restaurant' in user && user.restaurant?.name
                  ? user.restaurant.name
                  : 'Faraz Bistro'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Business Date & Live Time */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pos-surface-subtle border border-pos-border text-pos-text font-medium">
            <Calendar size={13} className="text-pos-text-muted" />
            <span>{formattedDate}</span>
            <span className="text-pos-border-strong font-mono">|</span>
            <Clock size={13} className="text-pos-primary" />
            <span className="font-mono font-semibold">{liveTime || '--:--:--'}</span>
          </div>

          {/* Shift Status */}
          {canViewShifts && (
            <Link
              to="/shifts"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors',
                currentShiftQuery.data?.status === 'OPEN'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              )}
            >
              <Banknote size={13} />
              <span>
                {currentShiftQuery.data?.status === 'OPEN'
                  ? `Shift #${currentShiftQuery.data.id.slice(0, 6)} Open`
                  : 'No Active Shift'}
              </span>
            </Link>
          )}

          {/* Connection Status */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium text-xs',
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isReconnecting
                  ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isConnected
                  ? 'bg-emerald-500'
                  : isReconnecting
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
              )}
            />
            <span>
              {isConnected ? 'Realtime Live' : isReconnecting ? 'Syncing...' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. NOW: TODAY'S OPERATIONAL KPI ROW                                   */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Today's Net Sales */}
        <Card className="p-3.5 bg-pos-surface border-pos-border rounded-lg shadow-pos">
          <div className="flex items-center justify-between text-pos-text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Today's Sales
            </span>
            <DollarSign size={15} className="text-pos-primary" />
          </div>
          {canViewReports ? (
            <div className="mt-1.5">
              <div className="text-lg sm:text-xl font-bold font-mono text-pos-text truncate">
                {salesSummaryQuery.isLoading
                  ? '...'
                  : formatPrice(salesSummaryQuery.data?.summary?.netSales || 0)}
              </div>
              <p className="text-[11px] text-pos-text-muted mt-0.5 truncate">
                Gross: {formatPrice(salesSummaryQuery.data?.summary?.grossSales || 0)}
              </p>
            </div>
          ) : (
            <div className="mt-2 text-xs text-pos-text-muted flex items-center gap-1">
              <EyeOff size={12} /> Restricted
            </div>
          )}
        </Card>

        {/* Metric 2: Today's Orders */}
        <Card className="p-3.5 bg-pos-surface border-pos-border rounded-lg shadow-pos">
          <div className="flex items-center justify-between text-pos-text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Valid Orders
            </span>
            <ShoppingBag size={15} className="text-pos-info" />
          </div>
          {canViewReports ? (
            <div className="mt-1.5">
              <div className="text-lg sm:text-xl font-bold font-mono text-pos-text">
                {salesSummaryQuery.isLoading
                  ? '...'
                  : salesSummaryQuery.data?.ordersMetrics?.validOrdersCount || 0}
              </div>
              <p className="text-[11px] text-pos-text-muted mt-0.5 truncate">
                Total: {salesSummaryQuery.data?.ordersMetrics?.totalOrdersCount || 0} (
                {salesSummaryQuery.data?.ordersMetrics?.completedOrdersCount || 0} done)
              </p>
            </div>
          ) : (
            <div className="mt-2 text-xs text-pos-text-muted flex items-center gap-1">
              <EyeOff size={12} /> Restricted
            </div>
          )}
        </Card>

        {/* Metric 3: Average Order Value */}
        <Card className="p-3.5 bg-pos-surface border-pos-border rounded-lg shadow-pos">
          <div className="flex items-center justify-between text-pos-text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Avg Order Value
            </span>
            <TrendingUp size={15} className="text-pos-success" />
          </div>
          {canViewReports ? (
            <div className="mt-1.5">
              <div className="text-lg sm:text-xl font-bold font-mono text-pos-text truncate">
                {salesSummaryQuery.isLoading
                  ? '...'
                  : formatPrice(
                      salesSummaryQuery.data?.ordersMetrics?.averageOrderValue || 0
                    )}
              </div>
              <p className="text-[11px] text-pos-text-muted mt-0.5 truncate">
                Per valid ticket
              </p>
            </div>
          ) : (
            <div className="mt-2 text-xs text-pos-text-muted flex items-center gap-1">
              <EyeOff size={12} /> Restricted
            </div>
          )}
        </Card>

        {/* Metric 4: Seated Guests */}
        <Card className="p-3.5 bg-pos-surface border-pos-border rounded-lg shadow-pos">
          <div className="flex items-center justify-between text-pos-text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Guests Seated
            </span>
            <Users size={15} className="text-pos-warning" />
          </div>
          {canViewTables ? (
            <div className="mt-1.5">
              <div className="text-lg sm:text-xl font-bold font-mono text-pos-text">
                {tablesQuery.isLoading ? '...' : tableStats.seatedGuests}
              </div>
              <p className="text-[11px] text-pos-text-muted mt-0.5 truncate">
                {tableStats.occupied} occupied table{tableStats.occupied === 1 ? '' : 's'}
              </p>
            </div>
          ) : (
            <div className="mt-2 text-xs text-pos-text-muted flex items-center gap-1">
              <EyeOff size={12} /> Restricted
            </div>
          )}
        </Card>

        {/* Metric 5: Table Occupancy */}
        <Card className="p-3.5 bg-pos-surface border-pos-border rounded-lg shadow-pos">
          <div className="flex items-center justify-between text-pos-text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Floor Tables
            </span>
            <UtensilsCrossed size={15} className="text-pos-primary" />
          </div>
          {canViewTables ? (
            <div className="mt-1.5">
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-bold font-mono text-pos-text">
                  {tablesQuery.isLoading ? '...' : tableStats.occupied}
                </span>
                <span className="text-xs font-mono text-pos-text-muted">
                  /{tableStats.total}
                </span>
                <span className="text-[11px] font-medium text-pos-text-secondary ml-auto">
                  {tableStats.occupancyRate}%
                </span>
              </div>
              {/* Clean Progress Bar */}
              <div className="w-full h-1.5 bg-pos-surface-subtle rounded-full overflow-hidden mt-1.5 border border-pos-border">
                <div
                  className="h-full bg-pos-primary rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(tableStats.occupancyRate, 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-pos-text-muted flex items-center gap-1">
              <EyeOff size={12} /> Restricted
            </div>
          )}
        </Card>

        {/* Metric 6: Cash Drawer */}
        <Card className="p-3.5 bg-pos-surface border-pos-border rounded-lg shadow-pos">
          <div className="flex items-center justify-between text-pos-text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Cash Drawer
            </span>
            <Banknote size={15} className="text-pos-success" />
          </div>
          {canViewShifts ? (
            <div className="mt-1.5">
              <div className="text-lg sm:text-xl font-bold font-mono text-pos-text truncate">
                {currentShiftQuery.isLoading
                  ? '...'
                  : currentShiftQuery.data?.status === 'OPEN'
                    ? formatPrice(currentShiftQuery.data.currentDrawerCash || 0)
                    : 'Closed'}
              </div>
              <p className="text-[11px] text-pos-text-muted mt-0.5 truncate">
                {currentShiftQuery.data?.status === 'OPEN'
                  ? `Float: ${formatPrice(currentShiftQuery.data.openingCash || 0)}`
                  : 'No active float'}
              </p>
            </div>
          ) : (
            <div className="mt-2 text-xs text-pos-text-muted flex items-center gap-1">
              <EyeOff size={12} /> Restricted
            </div>
          )}
        </Card>
      </div>

      {/* ===================================================================== */}
      {/* 3. ATTENTION: ACTIONABLE OPERATIONAL EXCEPTIONS RADAR                 */}
      {/* ===================================================================== */}
      <Card className="p-4 bg-pos-surface border-pos-border rounded-lg shadow-pos">
        <div className="flex items-center justify-between mb-3 border-b border-pos-border pb-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-pos-warning" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-pos-text">
              Operational Attention Radar
            </h2>
            <span
              className={cn(
                'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border',
                attentionItems.length > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              )}
            >
              {attentionItems.length}{' '}
              {attentionItems.length === 1 ? 'Action Required' : 'Actions Required'}
            </span>
          </div>
          <span className="text-[11px] text-pos-text-muted hidden sm:inline">
            Real-time bottleneck & exception monitoring
          </span>
        </div>

        {attentionItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {attentionItems.map(item => (
              <div
                key={item.id}
                className={cn(
                  'p-3 rounded-lg border flex items-start justify-between gap-2.5 transition-colors',
                  item.severity === 'danger'
                    ? 'bg-rose-50/60 border-rose-200'
                    : item.severity === 'warning'
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-blue-50/60 border-blue-200'
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {item.severity === 'danger' ? (
                      <Flame size={14} className="text-rose-600 shrink-0" />
                    ) : item.severity === 'warning' ? (
                      <AlertCircle size={14} className="text-amber-600 shrink-0" />
                    ) : (
                      <Sparkles size={14} className="text-blue-600 shrink-0" />
                    )}
                    <p className="text-xs font-bold text-pos-text truncate">
                      {item.title}
                    </p>
                  </div>
                  <p className="text-[11px] text-pos-text-secondary mt-1 line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <Link
                  to={item.link}
                  className="shrink-0 text-xs font-bold px-2.5 py-1 rounded bg-pos-surface border border-pos-border hover:border-pos-border-strong text-pos-text hover:text-pos-primary transition-colors flex items-center gap-1 shadow-xs"
                >
                  {item.actionText}
                  <ArrowRight size={11} />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 px-3 rounded-lg bg-emerald-50/50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  All Systems Operational • No Active Bottlenecks
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Floor seating, kitchen display, takeaway queue, and inventory stock are
                  running within normal parameters.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-700 hidden sm:inline">
              Zero Exceptions
            </span>
          </div>
        )}
      </Card>

      {/* ===================================================================== */}
      {/* 4. LIVE OPERATIONS HUB: STATION STATUS & WORKSPACE SHORTCUTS         */}
      {/* ===================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-pos-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-pos-text-secondary">
              Live Operations Hub
            </h2>
          </div>
          <span className="text-[11px] text-pos-text-muted">1-click station jump</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Station 1: Tables & Floor */}
          <Link
            to="/tables"
            className="p-3.5 rounded-lg bg-pos-surface border border-pos-border hover:border-pos-primary/60 transition-all group shadow-pos hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-pos-primary-soft border border-[#FED7AA] flex items-center justify-center text-pos-primary">
                    <UtensilsCrossed size={14} />
                  </div>
                  <span className="text-xs font-bold text-pos-text group-hover:text-pos-primary transition-colors">
                    Dine-In Floor
                  </span>
                </div>
                <Badge variant={tableStats.occupied > 0 ? 'warning' : 'success'}>
                  {tableStats.occupied} Active
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-1.5 py-2 border-y border-pos-surface-subtle text-center">
                <div className="p-1 rounded bg-pos-surface-subtle">
                  <span className="text-[10px] text-pos-text-muted block">Available</span>
                  <span className="text-xs font-bold font-mono text-pos-success">
                    {tableStats.available}
                  </span>
                </div>
                <div className="p-1 rounded bg-pos-surface-subtle">
                  <span className="text-[10px] text-pos-text-muted block">Billed</span>
                  <span className="text-xs font-bold font-mono text-pos-warning">
                    {tableStats.billPrinted}
                  </span>
                </div>
                <div className="p-1 rounded bg-pos-surface-subtle">
                  <span className="text-[10px] text-pos-text-muted block">Cleaning</span>
                  <span className="text-xs font-bold font-mono text-pos-text-muted">
                    {tableStats.cleaning}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-pos-text-muted group-hover:text-pos-primary font-medium">
              <span>{tableStats.seatedGuests} Guests Seated</span>
              <span className="flex items-center gap-1">
                Open Floor <ArrowRight size={12} />
              </span>
            </div>
          </Link>

          {/* Station 2: Kitchen Display System (KDS) */}
          <Link
            to="/kitchen"
            className="p-3.5 rounded-lg bg-pos-surface border border-pos-border hover:border-pos-primary/60 transition-all group shadow-pos hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-pos-primary-soft border border-[#FED7AA] flex items-center justify-center text-pos-primary">
                    <ChefHat size={14} />
                  </div>
                  <span className="text-xs font-bold text-pos-text group-hover:text-pos-primary transition-colors">
                    Kitchen Display
                  </span>
                </div>
                <Badge
                  variant={
                    kitchenStats.delayedCount > 0
                      ? 'danger'
                      : kitchenStats.activeCount > 0
                        ? 'warning'
                        : 'success'
                  }
                >
                  {kitchenStats.activeCount} In Prep
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-1.5 py-2 border-y border-pos-surface-subtle text-center">
                <div className="p-1 rounded bg-pos-surface-subtle">
                  <span className="text-[10px] text-pos-text-muted block">In Prep</span>
                  <span className="text-xs font-bold font-mono text-pos-warning">
                    {kitchenStats.activeCount}
                  </span>
                </div>
                <div className="p-1 rounded bg-pos-surface-subtle">
                  <span className="text-[10px] text-pos-text-muted block">Ready</span>
                  <span className="text-xs font-bold font-mono text-emerald-700">
                    {kitchenStats.readyCount}
                  </span>
                </div>
                <div className="p-1 rounded bg-pos-surface-subtle">
                  <span className="text-[10px] text-pos-text-muted block">Overdue</span>
                  <span
                    className={cn(
                      'text-xs font-bold font-mono',
                      kitchenStats.delayedCount > 0
                        ? 'text-pos-danger'
                        : 'text-pos-text-muted'
                    )}
                  >
                    {kitchenStats.delayedCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-pos-text-muted group-hover:text-pos-primary font-medium">
              <span>{kitchenStats.total} Total Queue</span>
              <span className="flex items-center gap-1">
                Open KDS <ArrowRight size={12} />
              </span>
            </div>
          </Link>

          {/* Station 3: Takeaway Queue */}
          <Link
            to="/takeaway"
            className="p-3.5 rounded-lg bg-pos-surface border border-pos-border hover:border-pos-primary/60 transition-all group shadow-pos hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-pos-primary-soft border border-[#FED7AA] flex items-center justify-center text-pos-primary">
                    <Package size={14} />
                  </div>
                  <span className="text-xs font-bold text-pos-text group-hover:text-pos-primary transition-colors">
                    Takeaway Queue
                  </span>
                </div>
                <Badge variant={takeawayStats.total > 0 ? 'warning' : 'default'}>
                  {takeawayStats.total} Active
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-1.5 py-2 border-y border-pos-surface-subtle text-center">
                <div className="p-1 rounded bg-pos-surface-subtle">
                  <span className="text-[10px] text-pos-text-muted block">Preparing</span>
                  <span className="text-xs font-bold font-mono text-pos-warning">
                    {takeawayStats.preparingCount}
                  </span>
                </div>
                <div className="p-1 rounded bg-pos-surface-subtle">
                  <span className="text-[10px] text-pos-text-muted block">
                    Ready for Pickup
                  </span>
                  <span className="text-xs font-bold font-mono text-emerald-700">
                    {takeawayStats.readyCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-pos-text-muted group-hover:text-pos-primary font-medium">
              <span>Counter Pickup</span>
              <span className="flex items-center gap-1">
                Open Queue <ArrowRight size={12} />
              </span>
            </div>
          </Link>

          {/* Station 4: Delivery Dispatch */}
          <Link
            to="/delivery"
            className="p-3.5 rounded-lg bg-pos-surface border border-pos-border hover:border-pos-primary/60 transition-all group shadow-pos hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-pos-primary-soft border border-[#FED7AA] flex items-center justify-center text-pos-primary">
                    <Truck size={14} />
                  </div>
                  <span className="text-xs font-bold text-pos-text group-hover:text-pos-primary transition-colors">
                    Delivery Dispatch
                  </span>
                </div>
                <Badge
                  variant={
                    deliveryStats.unassignedCount > 0
                      ? 'danger'
                      : deliveryStats.total > 0
                        ? 'warning'
                        : 'default'
                  }
                >
                  {deliveryStats.total} Total
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-1.5 py-2 border-y border-pos-surface-subtle text-center">
                <div className="p-1 rounded bg-pos-surface-subtle">
                  <span className="text-[10px] text-pos-text-muted block">
                    Unassigned
                  </span>
                  <span
                    className={cn(
                      'text-xs font-bold font-mono',
                      deliveryStats.unassignedCount > 0
                        ? 'text-pos-danger'
                        : 'text-pos-text-muted'
                    )}
                  >
                    {deliveryStats.unassignedCount}
                  </span>
                </div>
                <div className="p-1 rounded bg-pos-surface-subtle">
                  <span className="text-[10px] text-pos-text-muted block">Ready</span>
                  <span className="text-xs font-bold font-mono text-pos-warning">
                    {deliveryStats.readyCount}
                  </span>
                </div>
                <div className="p-1 rounded bg-pos-surface-subtle">
                  <span className="text-[10px] text-pos-text-muted block">En Route</span>
                  <span className="text-xs font-bold font-mono text-pos-info">
                    {deliveryStats.outForDeliveryCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-pos-text-muted group-hover:text-pos-primary font-medium">
              <span>Rider Fleet</span>
              <span className="flex items-center gap-1">
                Dispatch <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. TODAY: HOURLY SALES TREND & CHANNELS BREAKDOWN                    */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Hourly Sales & Traffic Trend */}
        <Card className="lg:col-span-7 p-4 bg-pos-surface border-pos-border rounded-lg shadow-pos flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-pos-border">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} className="text-pos-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-pos-text">
                    Today's Hourly Sales & Volume
                  </h3>
                </div>
                <p className="text-[11px] text-pos-text-muted mt-0.5">
                  Revenue pacing across 24-hour business cycle
                </p>
              </div>

              {peakHour && peakHour.orderCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <Flame size={13} className="text-pos-primary" />
                  <span className="font-semibold">Peak: {peakHour.hourLabel}</span>
                  <span className="font-mono text-[11px]">
                    ({formatPrice(peakHour.netSales)})
                  </span>
                </div>
              )}
            </div>

            {canViewReports ? (
              <div>
                {/* 24-Hour Spark-Bar Chart */}
                <div className="mt-4 pt-2">
                  <div className="h-28 flex items-end gap-1 sm:gap-1.5 pb-2 border-b border-pos-border">
                    {hourlyData.map(h => {
                      const heightPercent =
                        h.netSales > 0
                          ? Math.max(Math.round((h.netSales / maxHourlyNet) * 100), 8)
                          : 4;
                      const isPeak =
                        peakHour && peakHour.hour === h.hour && h.netSales > 0;
                      const hasSales = h.netSales > 0;

                      return (
                        <div
                          key={h.hour}
                          className="flex-1 flex flex-col items-center h-full justify-end group relative"
                        >
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                            <div className="bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded shadow-lg whitespace-nowrap">
                              <p className="font-bold">{h.hourLabel}</p>
                              <p>Net: {formatPrice(h.netSales)}</p>
                              <p>
                                {h.orderCount} Order{h.orderCount === 1 ? '' : 's'}
                              </p>
                            </div>
                            <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-0.5" />
                          </div>

                          <div
                            className={cn(
                              'w-full rounded-t transition-all',
                              isPeak
                                ? 'bg-pos-primary group-hover:bg-pos-primary-hover'
                                : hasSales
                                  ? 'bg-[#FDBA74] group-hover:bg-pos-primary'
                                  : 'bg-pos-surface-subtle group-hover:bg-slate-200'
                            )}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Hourly X-axis Labels */}
                  <div className="flex justify-between text-[10px] font-mono text-pos-text-muted mt-1.5 px-0.5">
                    <span>12 AM</span>
                    <span>06 AM</span>
                    <span>12 PM</span>
                    <span>06 PM</span>
                    <span>11 PM</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-pos-text-muted">
                <EyeOff size={18} className="mx-auto mb-1 text-pos-text-muted" />
                Reports permission required to view hourly revenue pacing.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-pos-border flex items-center justify-between text-xs text-pos-text-muted">
            <span>Real-time calculations based on active business date ({todayStr})</span>
            {canViewReports && (
              <Link
                to="/reports"
                className="text-pos-primary hover:underline font-semibold flex items-center gap-1"
              >
                Detailed Analysis <ArrowRight size={11} />
              </Link>
            )}
          </div>
        </Card>

        {/* Right: Today's Order Channels Breakdown */}
        <Card className="lg:col-span-5 p-4 bg-pos-surface border-pos-border rounded-lg shadow-pos flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-pos-border">
              <div className="flex items-center gap-2">
                <ShoppingBag size={15} className="text-pos-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-pos-text">
                  Today's Order Channels
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-pos-text">
                {formatPrice(totalChannelRevenue)}
              </span>
            </div>

            {canViewReports ? (
              <div className="space-y-3 mt-2">
                {/* Dine-In */}
                {(() => {
                  const item = channelBreakdown.find(c => c.orderType === 'DINE_IN');
                  const count = item?.orderCount || 0;
                  const total = item?.grandTotal || 0;
                  const pct = item?.percentageOfSales || 0;
                  return (
                    <div className="p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-pos-text">
                          <UtensilsCrossed size={14} className="text-blue-600" />
                          <span>Dine-In</span>
                          <span className="text-[11px] font-mono font-normal text-pos-text-muted">
                            ({count} orders)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-pos-text">
                            {formatPrice(total)}
                          </span>
                          <span className="text-[10px] font-mono text-pos-text-muted ml-1.5">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Takeaway */}
                {(() => {
                  const item = channelBreakdown.find(c => c.orderType === 'TAKEAWAY');
                  const count = item?.orderCount || 0;
                  const total = item?.grandTotal || 0;
                  const pct = item?.percentageOfSales || 0;
                  return (
                    <div className="p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-pos-text">
                          <Package size={14} className="text-amber-600" />
                          <span>Takeaway</span>
                          <span className="text-[11px] font-mono font-normal text-pos-text-muted">
                            ({count} orders)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-pos-text">
                            {formatPrice(total)}
                          </span>
                          <span className="text-[10px] font-mono text-pos-text-muted ml-1.5">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Delivery */}
                {(() => {
                  const item = channelBreakdown.find(c => c.orderType === 'DELIVERY');
                  const count = item?.orderCount || 0;
                  const total = item?.grandTotal || 0;
                  const pct = item?.percentageOfSales || 0;
                  return (
                    <div className="p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-pos-text">
                          <Truck size={14} className="text-purple-600" />
                          <span>Delivery</span>
                          <span className="text-[11px] font-mono font-normal text-pos-text-muted">
                            ({count} orders)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-pos-text">
                            {formatPrice(total)}
                          </span>
                          <span className="text-[10px] font-mono text-pos-text-muted ml-1.5">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-purple-600 rounded-full"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-pos-text-muted">
                <EyeOff size={18} className="mx-auto mb-1 text-pos-text-muted" />
                Reports permission required to view channel distribution.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-pos-border flex items-center justify-between text-xs text-pos-text-muted">
            <span>Aggregated across active channels</span>
            <Link
              to="/orders"
              className="text-pos-primary hover:underline font-semibold flex items-center gap-1"
            >
              Open Register <ArrowRight size={11} />
            </Link>
          </div>
        </Card>
      </div>

      {/* ===================================================================== */}
      {/* 6. RECENT: LATEST OPERATIONAL ACTIVITY FEED                           */}
      {/* ===================================================================== */}
      <Card className="p-4 bg-pos-surface border-pos-border rounded-lg shadow-pos">
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-pos-border">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-pos-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-pos-text">
              Recent Operational Activity
            </h3>
            <span className="text-[10px] font-mono text-pos-text-muted px-2 py-0.5 rounded bg-pos-surface-subtle border border-pos-border">
              Live Stream
            </span>
          </div>
          <Link
            to="/orders"
            className="text-xs text-pos-primary font-bold hover:underline flex items-center gap-1"
          >
            Open POS Register <ArrowRight size={12} />
          </Link>
        </div>

        {canViewOrders ? (
          recentOrdersQuery.isLoading ? (
            <div className="py-8 text-center text-xs text-pos-text-muted flex items-center justify-center gap-2">
              <RotateCw size={14} className="animate-spin text-pos-primary" />
              Loading real-time order stream...
            </div>
          ) : recentOrdersQuery.data?.orders &&
            recentOrdersQuery.data.orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-pos-border text-pos-text-muted text-[11px] uppercase tracking-wider bg-pos-surface-subtle/50">
                    <th className="py-2.5 px-3 font-semibold">Order</th>
                    <th className="py-2.5 px-3 font-semibold">Channel</th>
                    <th className="py-2.5 px-3 font-semibold">Table / Customer</th>
                    <th className="py-2.5 px-3 font-semibold">Items</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Grand Total</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pos-border">
                  {recentOrdersQuery.data.orders.map(order => (
                    <tr
                      key={order.id}
                      className="hover:bg-pos-surface-subtle transition-colors group"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-pos-text">
                        #{order.orderCode}
                      </td>
                      <td className="py-2.5 px-3">
                        {getOrderTypeBadge(order.orderType)}
                      </td>
                      <td className="py-2.5 px-3 text-pos-text-secondary">
                        {order.table?.name ? (
                          <span className="font-semibold text-pos-text">
                            {order.table.name}
                          </span>
                        ) : order.customerName ? (
                          <span className="truncate max-w-[140px] block">
                            {order.customerName}
                          </span>
                        ) : (
                          <span className="text-pos-text-muted font-mono">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-pos-text-muted font-mono">
                        {order.items?.length || 0} item
                        {(order.items?.length || 0) === 1 ? '' : 's'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-pos-text text-right">
                        {formatPrice(order.grandTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-pos-text-muted font-mono text-[11px]">
                        {getRelativeTime(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-pos-text-muted">
              No orders recorded yet today. Click &quot;Open POS Register&quot; to place
              the first order.
            </div>
          )
        ) : (
          <div className="py-8 text-center text-xs text-pos-text-muted">
            <EyeOff size={18} className="mx-auto mb-1 text-pos-text-muted" />
            Orders permission required to view the live activity stream.
          </div>
        )}
      </Card>
    </div>
  );
};
