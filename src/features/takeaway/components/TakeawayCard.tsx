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
  CreditCard,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatPrice as centralizedFormatPrice } from '@/utils/format';

interface TakeawayCardProps {
  order: TakeawayOrderRecord;
  currency?: string;
  isSelected?: boolean;
  onClick: () => void;
}

export const TakeawayCard: React.FC<TakeawayCardProps> = ({
  order,
  currency = 'PKR',
  isSelected = false,
  onClick,
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

  // Time elapsed
  const getElapsedMinutes = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const elapsed = getElapsedMinutes(order.createdAt);
  const totalItemsCount = order.items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3.5 rounded-lg border text-left transition-colors relative flex flex-col justify-between min-h-[175px] shadow-xs select-none cursor-pointer group',
        isSelected
          ? 'border-pos-primary bg-pos-primary-soft/50 ring-1 ring-pos-primary shadow-sm'
          : 'border-pos-border bg-pos-surface hover:border-pos-border-strong hover:bg-pos-surface-subtle'
      )}
    >
      {/* Header: Token Number & Status Pill */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded bg-pos-primary text-white font-black text-sm font-mono tracking-wide shadow-xs flex items-center gap-1">
            <span>#{order.tokenNumber}</span>
          </div>
          <div>
            <span className="text-[11px] font-mono text-pos-text-muted font-bold block leading-none">
              #{order.orderCode}
            </span>
            <span className="text-[10px] text-pos-text-muted flex items-center gap-1 mt-1 font-medium">
              <Clock size={11} /> {elapsed}m ago
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {getStatusBadge(order.status)}
          {order.isPayOnPickup ? (
            <span className="text-[10px] font-semibold text-pos-warning bg-pos-warning-soft px-1.5 py-0.5 rounded border border-[#FED7AA]">
              Pay on Pickup
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-pos-success bg-pos-success-soft px-1.5 py-0.5 rounded border border-[#BBF7D0] flex items-center gap-0.5">
              <CreditCard size={10} /> Paid
            </span>
          )}
        </div>
      </div>

      {/* Customer Info & Items Summary */}
      <div className="py-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-pos-text flex items-center gap-1.5 truncate max-w-[170px]">
            <User size={13} className="text-pos-primary shrink-0" />
            {order.customerName}
          </span>
          {order.customerPhone && (
            <span className="text-[11px] text-pos-text-muted font-mono">
              {order.customerPhone}
            </span>
          )}
        </div>

        {/* Short Item List Preview */}
        <div className="bg-pos-surface-subtle border border-pos-border rounded-md p-2 text-[11px] space-y-1 text-pos-text-muted">
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
            onClick={handleBumpStatus}
            disabled={updateStatusMutation.isPending}
            className="px-2.5 py-1.5 rounded-md bg-pos-primary text-white hover:bg-pos-primary-hover text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <PackageCheck size={13} />
            <span>Handover</span>
          </button>
        )}
      </div>
    </div>
  );
};
