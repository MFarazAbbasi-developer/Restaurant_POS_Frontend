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
        return (
          <Badge variant="warning" size="sm">
            Pending
          </Badge>
        );
      case 'PREPARING':
        return (
          <Badge variant="info" size="sm">
            Preparing
          </Badge>
        );
      case 'READY':
        return (
          <Badge
            variant="default"
            size="sm"
            className="bg-pos-info-soft text-pos-info border border-[#BFDBFE]"
          >
            Ready to Dispatch
          </Badge>
        );
      case 'DISPATCHED':
        return (
          <Badge
            variant="default"
            size="sm"
            className="bg-pos-primary-soft text-pos-primary border border-pos-primary/20"
          >
            Out for Delivery
          </Badge>
        );
      case 'DELIVERED':
        return (
          <Badge variant="success" size="sm">
            Delivered
          </Badge>
        );
      case 'CANCELLED':
      case 'FAILED':
        return (
          <Badge variant="danger" size="sm">
            {status}
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="sm">
            {status}
          </Badge>
        );
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
        'p-3.5 rounded-lg border text-left transition-colors relative flex flex-col justify-between min-h-[210px] shadow-xs select-none cursor-pointer group',
        isSelected
          ? 'border-pos-primary bg-pos-primary-soft/50 ring-1 ring-pos-primary shadow-sm'
          : 'border-pos-border bg-pos-surface hover:border-pos-border-strong hover:bg-pos-surface-subtle'
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
              <span className="text-[10px] font-semibold bg-pos-surface-subtle border border-pos-border px-1.5 py-0.5 rounded text-pos-primary flex items-center gap-1">
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
            <span className="text-[10px] font-semibold text-pos-success bg-pos-success-soft px-1.5 py-0.5 rounded border border-[#BBF7D0] flex items-center gap-0.5">
              <CreditCard size={10} /> Paid
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-pos-warning bg-pos-warning-soft px-1.5 py-0.5 rounded border border-[#FED7AA]">
              COD ({formatPrice(order.totalAmount)})
            </span>
          )}
        </div>
      </div>

      {/* Customer Info & Address */}
      <div className="py-2 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-pos-text flex items-center gap-1.5 truncate max-w-[170px]">
            <User size={13} className="text-pos-primary shrink-0" />
            {order.customerName}
          </span>
          <span className="text-[11px] text-pos-text-muted font-mono">
            {order.customerPhone}
          </span>
        </div>

        {/* Delivery Address */}
        <p className="text-[11px] text-pos-text-secondary line-clamp-2 flex items-start gap-1 font-medium">
          <MapPin size={12} className="shrink-0 text-pos-text-muted mt-0.5" />
          <span>
            {order.deliveryAddress}
            {order.landmark && (
              <span className="italic ml-1 text-pos-text-muted">({order.landmark})</span>
            )}
          </span>
        </p>

        {/* Zone & Rider Info Pill */}
        <div className="flex items-center justify-between text-[11px] pt-1">
          {order.deliveryZoneName ? (
            <span className="text-pos-text-secondary font-medium bg-pos-surface-subtle px-1.5 py-0.5 rounded border border-pos-border text-[10px]">
              Zone: {order.deliveryZoneName}
            </span>
          ) : (
            <span />
          )}

          {order.rider ? (
            <span className="text-pos-primary font-semibold flex items-center gap-1 bg-pos-primary-soft px-2 py-0.5 rounded text-[11px] border border-pos-primary/20">
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
      <div className="bg-pos-surface-subtle border border-pos-border rounded-md p-2 text-[11px] space-y-1 text-pos-text-muted mb-2">
        {order.items.slice(0, 2).map((item, idx) => (
          <div key={idx} className="flex justify-between items-center truncate">
            <span className="text-pos-text font-medium truncate">
              {item.quantity}x {item.name}
            </span>
            <span className="font-mono text-[10px] shrink-0 ml-1 text-pos-text-secondary">
              {formatPrice(item.subtotal)}
            </span>
          </div>
        ))}
        {order.items.length > 2 && (
          <div className="text-[10px] text-pos-primary font-semibold pt-0.5">
            +{order.items.length - 2} more item(s) ({totalItemsCount} total)
          </div>
        )}
      </div>

      {/* Footer: Price Total & Lifecycle Bump Button */}
      <div className="pt-2 border-t border-pos-border flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] uppercase font-bold text-pos-text-muted block">
            Total
          </span>
          <span className="text-base font-black font-mono text-pos-primary leading-none">
            {formatPrice(order.totalAmount)}
          </span>
        </div>

        {/* Lifecycle Advancement Button */}
        {order.status === 'PENDING' && (
          <button
            type="button"
            onClick={handleBumpStatus}
            disabled={updateStatusMutation.isPending}
            className="px-2.5 py-1.5 rounded-md bg-pos-info-soft text-pos-info hover:bg-pos-info hover:text-white border border-[#BFDBFE] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <ChefHat size={13} />
            <span>Start Prep</span>
          </button>
        )}

        {order.status === 'PREPARING' && (
          <button
            type="button"
            onClick={handleBumpStatus}
            disabled={updateStatusMutation.isPending}
            className="px-2.5 py-1.5 rounded-md bg-pos-info-soft text-pos-info hover:bg-pos-info hover:text-white border border-[#BFDBFE] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 size={13} />
            <span>Mark Ready</span>
          </button>
        )}

        {order.status === 'READY' && (
          <button
            type="button"
            onClick={handleBumpStatus}
            disabled={updateStatusMutation.isPending}
            className="px-2.5 py-1.5 rounded-md bg-pos-primary text-white hover:bg-pos-primary-hover text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Send size={13} />
            <span>{order.rider ? 'Dispatch' : 'Assign & Dispatch'}</span>
          </button>
        )}

        {order.status === 'DISPATCHED' && (
          <button
            type="button"
            onClick={handleBumpStatus}
            disabled={updateStatusMutation.isPending}
            className="px-2.5 py-1.5 rounded-md bg-pos-success text-white hover:bg-pos-success/90 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <PackageCheck size={13} />
            <span>Delivered</span>
          </button>
        )}
      </div>
    </div>
  );
};
