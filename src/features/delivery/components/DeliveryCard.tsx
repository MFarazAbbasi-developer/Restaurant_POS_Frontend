import React from 'react';
import { DeliveryOrderRecord } from '@/types';
import { useUpdateDeliveryStatusMutation } from '../hooks/useDeliveryData';
import { Badge } from '@/components/ui/Badge';
import {
  Clock,
  User,
  MapPin,
  Bike,
  ChefHat,
  CheckCircle2,
  Send,
  PackageCheck,
  CreditCard,
  Building,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface DeliveryCardProps {
  order: DeliveryOrderRecord;
  currency?: string;
  isSelected?: boolean;
  onClick: () => void;
  onAssignRiderClick: () => void;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
  order,
  currency = 'USD',
  isSelected = false,
  onClick,
  onAssignRiderClick,
}) => {
  const updateStatusMutation = useUpdateDeliveryStatusMutation();

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const getStatusBadge = (status: DeliveryOrderRecord['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'PREPARING':
        return <Badge variant="info">Preparing</Badge>;
      case 'READY':
        return (
          <Badge
            variant="default"
            className="bg-sky-500/20 text-sky-400 border-sky-500/40"
          >
            Ready to Dispatch
          </Badge>
        );
      case 'DISPATCHED':
        return (
          <Badge
            variant="default"
            className="bg-indigo-500/20 text-indigo-400 border-indigo-500/40"
          >
            Out for Delivery
          </Badge>
        );
      case 'DELIVERED':
        return <Badge variant="success">Delivered</Badge>;
      case 'CANCELLED':
      case 'FAILED':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleBumpStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // If order is READY and needs to be DISPATCHED, but has no rider assigned, trigger rider assignment modal
    if (order.status === 'READY' && !order.rider) {
      onAssignRiderClick();
      return;
    }

    let nextStatus: 'PREPARING' | 'READY' | 'DISPATCHED' | 'DELIVERED' | null = null;
    if (order.status === 'PENDING') nextStatus = 'PREPARING';
    else if (order.status === 'PREPARING') nextStatus = 'READY';
    else if (order.status === 'READY') nextStatus = 'DISPATCHED';
    else if (order.status === 'DISPATCHED') nextStatus = 'DELIVERED';

    if (!nextStatus) return;

    try {
      await updateStatusMutation.mutateAsync({
        orderId: order.id,
        payload: {
          status: nextStatus,
          ...(nextStatus === 'DELIVERED' && order.paymentStatus !== 'PAID'
            ? { markPaid: true }
            : {}),
        },
      });
    } catch {
      // Handled by query state
    }
  };

  const totalItemsCount = order.items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between min-h-[210px] shadow-sm select-none cursor-pointer group',
        isSelected
          ? 'border-pos-accent bg-pos-accent/15 ring-2 ring-pos-accent shadow-md'
          : 'border-pos-border bg-pos-surface hover:border-pos-accent/40 hover:bg-pos-surface-hover active:scale-[0.99]'
      )}
    >
      {/* Header: Order Code, Aggregator & Status */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold text-pos-text">
              #{order.orderCode}
            </span>
            {order.isAggregator && (
              <span className="text-[10px] font-bold bg-pos-surface border border-pos-border px-1.5 py-0.5 rounded text-pos-accent flex items-center gap-1">
                <Building size={10} /> {order.aggregatorName || 'Aggregator'}
              </span>
            )}
          </div>
          <span className="text-[10px] text-pos-text-muted flex items-center gap-1 mt-1 font-medium">
            <Clock size={11} /> {order.orderAgeMinutes}m ago
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          {getStatusBadge(order.status)}
          {order.paymentStatus === 'PAID' ? (
            <span className="text-[10px] font-bold text-pos-success bg-pos-success/10 px-1.5 py-0.5 rounded border border-pos-success/30 flex items-center gap-0.5">
              <CreditCard size={10} /> Paid
            </span>
          ) : (
            <span className="text-[10px] font-bold text-pos-warning bg-pos-warning/10 px-1.5 py-0.5 rounded border border-pos-warning/30">
              COD ({formatPrice(order.totalAmount)})
            </span>
          )}
        </div>
      </div>

      {/* Customer Info & Address */}
      <div className="py-2 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-pos-text flex items-center gap-1.5 truncate max-w-[170px]">
            <User size={13} className="text-pos-accent shrink-0" />
            {order.customerName}
          </span>
          <span className="text-[11px] text-pos-text-muted font-mono">
            {order.customerPhone}
          </span>
        </div>

        {/* Delivery Address */}
        <p className="text-[11px] text-pos-text-muted line-clamp-2 flex items-start gap-1 font-medium">
          <MapPin size={12} className="shrink-0 text-pos-text-muted/70 mt-0.5" />
          <span>
            {order.deliveryAddress}
            {order.landmark && <span className="italic ml-1">({order.landmark})</span>}
          </span>
        </p>

        {/* Zone & Rider Info Pill */}
        <div className="flex items-center justify-between text-[11px] pt-1">
          {order.deliveryZoneName ? (
            <span className="text-pos-text-muted font-medium bg-pos-bg px-2 py-0.5 rounded border border-pos-border/60">
              Zone: {order.deliveryZoneName}
            </span>
          ) : (
            <span />
          )}

          {order.rider ? (
            <span className="text-pos-accent font-semibold flex items-center gap-1 bg-pos-accent/10 px-2 py-0.5 rounded">
              <Bike size={11} /> {order.rider.name}
            </span>
          ) : (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onAssignRiderClick();
              }}
              className="text-[10px] text-pos-warning hover:underline font-bold flex items-center gap-1"
            >
              <Bike size={11} /> + Assign Rider
            </button>
          )}
        </div>
      </div>

      {/* Items Preview */}
      <div className="bg-pos-bg/80 border border-pos-border/60 rounded-xl p-2 text-[11px] space-y-1 text-pos-text-muted mb-2">
        {order.items.slice(0, 2).map((item, idx) => (
          <div key={idx} className="flex justify-between items-center truncate">
            <span className="text-pos-text font-medium truncate">
              {item.quantity}x {item.name}
            </span>
            <span className="font-mono text-[10px] shrink-0 ml-1">
              {formatPrice(item.subtotal)}
            </span>
          </div>
        ))}
        {order.items.length > 2 && (
          <div className="text-[10px] text-pos-accent font-semibold pt-0.5">
            +{order.items.length - 2} more item(s) ({totalItemsCount} total)
          </div>
        )}
      </div>

      {/* Footer: Price Total & Lifecycle Bump Button */}
      <div className="pt-2 border-t border-pos-border/40 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] uppercase font-bold text-pos-text-muted block">
            Total
          </span>
          <span className="text-base font-black font-mono text-pos-accent leading-none">
            {formatPrice(order.totalAmount)}
          </span>
        </div>

        {/* Lifecycle Advancement Button */}
        {order.status === 'PENDING' && (
          <button
            type="button"
            onClick={handleBumpStatus}
            disabled={updateStatusMutation.isPending}
            className="px-3 py-1.5 rounded-xl bg-pos-info/15 text-pos-info hover:bg-pos-info hover:text-white border border-pos-info/30 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
          >
            <ChefHat size={14} />
            <span>Start Prep</span>
          </button>
        )}

        {order.status === 'PREPARING' && (
          <button
            type="button"
            onClick={handleBumpStatus}
            disabled={updateStatusMutation.isPending}
            className="px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-400 hover:bg-sky-500 hover:text-white border border-sky-500/30 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
          >
            <CheckCircle2 size={14} />
            <span>Mark Ready</span>
          </button>
        )}

        {order.status === 'READY' && (
          <button
            type="button"
            onClick={handleBumpStatus}
            disabled={updateStatusMutation.isPending}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
          >
            <Send size={14} />
            <span>{order.rider ? 'Dispatch Rider' : 'Assign & Dispatch'}</span>
          </button>
        )}

        {order.status === 'DISPATCHED' && (
          <button
            type="button"
            onClick={handleBumpStatus}
            disabled={updateStatusMutation.isPending}
            className="px-3 py-1.5 rounded-xl bg-pos-success text-white hover:bg-pos-success/90 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
          >
            <PackageCheck size={14} />
            <span>Delivered</span>
          </button>
        )}
      </div>
    </div>
  );
};
