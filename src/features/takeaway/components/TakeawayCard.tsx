import React from 'react';
import { TakeawayOrderRecord } from '@/types';
import { useUpdateTakeawayStatusMutation } from '../hooks/useTakeawayData';
import { Badge } from '@/components/ui/Badge';
import {
  Clock,
  User,
  ChefHat,
  CheckCircle2,
  PackageCheck,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatPrice as centralizedFormatPrice } from '@/utils/format';

interface TakeawayCardProps {
  order: TakeawayOrderRecord;
  currency?: string;
  isSelected?: boolean;
  onClick: () => void;
  onSettle?: (order: TakeawayOrderRecord) => void;
}

export const TakeawayCard: React.FC<TakeawayCardProps> = ({
  order,
  currency = 'PKR',
  isSelected = false,
  onClick,
  onSettle,
}) => {
  const updateStatusMutation = useUpdateTakeawayStatusMutation();

  const formatPrice = (val: number) => {
    return centralizedFormatPrice(val, currency);
  };

  const getStatusBadge = (status: TakeawayOrderRecord['status']) => {
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
          <Badge variant="success" size="sm">
            Ready
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="default" size="sm">
            Completed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" size="sm">
            Cancelled
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

  // One-touch bump status advancement
  const handleBumpStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();

    let nextStatus: 'PREPARING' | 'READY' | 'COMPLETED' | null = null;
    if (order.status === 'PENDING') nextStatus = 'PREPARING';
    else if (order.status === 'PREPARING') nextStatus = 'READY';
    else if (order.status === 'READY') nextStatus = 'COMPLETED';

    if (!nextStatus) return;

    try {
      await updateStatusMutation.mutateAsync({
        orderId: order.id,
        payload: {
          status: nextStatus,
          ...(nextStatus === 'COMPLETED' && order.isPayOnPickup
            ? { markPaid: true }
            : {}),
        },
      });
    } catch {
      // Error handled by query state
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col justify-between p-3.5 rounded-xl border bg-pos-surface transition-all duration-150 cursor-pointer shadow-xs hover:shadow-card hover:border-pos-primary/40 select-none',
        isSelected
          ? 'ring-2 ring-pos-primary border-pos-primary bg-pos-primary/5'
          : 'border-pos-border'
      )}
    >
      {/* Header: Token Badge, Order Code & Status */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg bg-pos-primary text-white font-black text-sm font-mono tracking-wide shadow-xs">
              #{order.tokenNumber}
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-pos-text block leading-tight">
                #{order.orderCode}
              </span>
              <span className="text-[10px] text-pos-text-muted flex items-center gap-1 mt-0.5">
                <Clock size={11} />
                {new Date(order.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          {getStatusBadge(order.status)}
        </div>

        {/* Customer & Tender Info */}
        <div className="py-1.5 border-y border-pos-border/60 mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-pos-text truncate flex items-center gap-1.5 max-w-[140px]">
            <User size={13} className="text-pos-text-muted shrink-0" />
            {order.customerName}
          </span>
          {order.isPayOnPickup ? (
            <Badge variant="warning" size="sm" className="font-semibold">
              Pay on Pickup
            </Badge>
          ) : (
            <Badge variant="success" size="sm" className="font-semibold">
              Paid
            </Badge>
          )}
        </div>

        {/* Items Preview */}
        <div className="space-y-1 mb-3">
          {order.items.slice(0, 3).map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex justify-between items-center text-xs text-pos-text-secondary"
            >
              <div className="flex items-center gap-1.5 truncate pr-2">
                <span className="font-bold text-pos-primary font-mono text-[11px]">
                  {item.quantity}x
                </span>
                <span className="truncate">{item.name}</span>
              </div>
              <span className="font-mono text-[11px] text-pos-text-muted shrink-0">
                {formatPrice(item.subtotal)}
              </span>
            </div>
          ))}

          {order.items.length > 3 && (
            <p className="text-[10px] text-pos-text-muted font-medium pt-0.5">
              +{order.items.length - 3} more items...
            </p>
          )}

          {order.specialInstructions && (
            <div className="mt-1.5 p-1.5 rounded bg-pos-surface-subtle border border-pos-border text-[10px] text-pos-text-muted italic truncate">
              <span className="font-semibold not-italic">Note:</span>{' '}
              {order.specialInstructions}
            </div>
          )}
        </div>
      </div>

      {/* Footer: Total Amount & Status Bump Action */}
      <div className="pt-2 border-t border-pos-border flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] uppercase font-bold text-pos-text-muted block">
            Total
          </span>
          <span className="text-base font-black font-mono text-pos-primary leading-none">
            {formatPrice(order.totalAmount)}
          </span>
        </div>

        {/* Quick Lifecycle Advance Button */}
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
            className="px-2.5 py-1.5 rounded-md bg-pos-success-soft text-pos-success hover:bg-pos-success hover:text-white border border-[#BBF7D0] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 size={13} />
            <span>Mark Ready</span>
          </button>
        )}

        {order.status === 'READY' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (order.isPayOnPickup || order.paymentStatus !== 'PAID') {
                onSettle?.(order);
              } else {
                handleBumpStatus(e);
              }
            }}
            disabled={updateStatusMutation.isPending}
            className="px-2.5 py-1.5 rounded-md bg-pos-primary text-white hover:bg-pos-primary-hover text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <PackageCheck size={13} />
            <span>
              {order.isPayOnPickup || order.paymentStatus !== 'PAID'
                ? 'Settle & Handover'
                : 'Handover'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
