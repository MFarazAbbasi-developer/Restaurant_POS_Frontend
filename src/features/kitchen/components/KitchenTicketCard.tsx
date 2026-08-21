import React from 'react';
import { KitchenTicket, KitchenTicketItem } from '@/types';
import {
  useUpdateOrderKitchenStatusMutation,
  useUpdateItemKitchenStatusMutation,
  useRecallKitchenOrderMutation,
} from '../hooks/useKitchenData';
import { Badge } from '@/components/ui/Badge';
import {
  Clock,
  ChefHat,
  CheckCircle2,
  RotateCcw,
  UtensilsCrossed,
  Package,
  Truck,
  AlertTriangle,
  FileText,
  Flame,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface KitchenTicketCardProps {
  ticket: KitchenTicket;
  onOpenDetails: () => void;
}

export const KitchenTicketCard: React.FC<KitchenTicketCardProps> = ({
  ticket,
  onOpenDetails,
}) => {
  const updateOrderStatusMutation = useUpdateOrderKitchenStatusMutation();
  const updateItemStatusMutation = useUpdateItemKitchenStatusMutation();
  const recallOrderMutation = useRecallKitchenOrderMutation();

  // Channel badge helper
  const getChannelBadge = () => {
    switch (ticket.orderType) {
      case 'DINE_IN':
        return (
          <span className="text-[11px] font-bold text-pos-accent bg-pos-accent/10 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-pos-accent/20">
            <UtensilsCrossed size={12} />
            <span>Table {ticket.tableName || 'Dine-In'}</span>
            {ticket.zoneName && <span className="opacity-70">({ticket.zoneName})</span>}
          </span>
        );
      case 'TAKEAWAY':
        return (
          <span className="text-[11px] font-bold text-pos-warning bg-pos-warning/10 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-pos-warning/20">
            <Package size={12} />
            <span>Takeaway {ticket.tokenNumber ? `#${ticket.tokenNumber}` : ''}</span>
          </span>
        );
      case 'DELIVERY':
        return (
          <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-sky-500/20">
            <Truck size={12} />
            <span>Delivery</span>
          </span>
        );
      default:
        return <Badge variant="default">{ticket.orderType}</Badge>;
    }
  };

  // Urgency theme styling
  const getUrgencyStyles = () => {
    switch (ticket.urgencyTier) {
      case 'CRITICAL':
        return 'border-pos-danger/80 bg-pos-danger/5 ring-1 ring-pos-danger/50 shadow-lg shadow-pos-danger/10';
      case 'WARNING':
        return 'border-pos-warning/70 bg-pos-warning/5 ring-1 ring-pos-warning/30 shadow-md';
      case 'NORMAL':
      default:
        return 'border-pos-border bg-pos-surface hover:border-pos-accent/40';
    }
  };

  // Whole ticket bump action
  const handleBumpTicket = async () => {
    let nextStatus: 'PREPARING' | 'READY' | 'SERVED' | null = null;
    if (ticket.status === 'PENDING' || ticket.status === 'CONFIRMED') {
      nextStatus = 'PREPARING';
    } else if (ticket.status === 'PREPARING') {
      nextStatus = 'READY';
    } else if (ticket.status === 'READY') {
      nextStatus = 'SERVED';
    }

    if (!nextStatus) return;

    try {
      await updateOrderStatusMutation.mutateAsync({
        orderId: ticket.id,
        payload: { status: nextStatus },
      });
    } catch {
      // Handled by query
    }
  };

  // Recall whole ticket
  const handleRecallTicket = async () => {
    try {
      await recallOrderMutation.mutateAsync({
        orderId: ticket.id,
      });
    } catch {
      // Handled by query
    }
  };

  // Individual item bump action
  const handleBumpItem = async (item: KitchenTicketItem, e: React.MouseEvent) => {
    e.stopPropagation();
    let nextStatus: 'PREPARING' | 'READY' | 'SERVED' | null = null;
    if (item.kitchenStatus === 'PENDING') nextStatus = 'PREPARING';
    else if (item.kitchenStatus === 'PREPARING') nextStatus = 'READY';
    else if (item.kitchenStatus === 'READY') nextStatus = 'SERVED';

    if (!nextStatus) return;

    try {
      await updateItemStatusMutation.mutateAsync({
        orderId: ticket.id,
        itemId: item.id,
        payload: { status: nextStatus },
      });
    } catch {
      // Handled by query
    }
  };

  const isPendingMutation =
    updateOrderStatusMutation.isPending ||
    updateItemStatusMutation.isPending ||
    recallOrderMutation.isPending;

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border transition-all duration-150 overflow-hidden select-none min-h-[360px] max-h-[580px]',
        getUrgencyStyles()
      )}
    >
      {/* Ticket Header */}
      <div
        className={cn(
          'p-3.5 border-b border-pos-border/80 flex items-start justify-between gap-2 shrink-0',
          ticket.urgencyTier === 'CRITICAL'
            ? 'bg-pos-danger/15'
            : ticket.urgencyTier === 'WARNING'
              ? 'bg-pos-warning/10'
              : 'bg-pos-header'
        )}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-pos-accent text-white font-black text-xs sm:text-sm font-mono tracking-wider shadow-sm">
              #{ticket.dailySequence || ticket.orderCode.slice(-4)}
            </span>
            <span className="font-mono text-xs font-bold text-pos-text">
              #{ticket.orderCode}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            {getChannelBadge()}
            {ticket.customerName && (
              <span className="text-[11px] text-pos-text-muted font-medium truncate max-w-[130px]">
                {ticket.customerName}
              </span>
            )}
          </div>
        </div>

        {/* Live Elapsed Prep Timer Pill */}
        <div className="flex flex-col items-end gap-1">
          <div
            className={cn(
              'px-2.5 py-1 rounded-xl text-xs font-black font-mono flex items-center gap-1.5 shadow-sm',
              ticket.urgencyTier === 'CRITICAL'
                ? 'bg-pos-danger text-white animate-pulse'
                : ticket.urgencyTier === 'WARNING'
                  ? 'bg-pos-warning/20 text-pos-warning border border-pos-warning/40'
                  : 'bg-pos-surface text-pos-text border border-pos-border'
            )}
          >
            {ticket.urgencyTier === 'CRITICAL' ? (
              <Flame size={13} className="shrink-0 animate-bounce" />
            ) : (
              <Clock size={13} className="shrink-0" />
            )}
            <span>
              {String(ticket.elapsedMinutes).padStart(2, '0')}:
              {String(ticket.elapsedSeconds % 60).padStart(2, '0')}
            </span>
          </div>

          <span className="text-[10px] font-bold text-pos-text-muted uppercase tracking-wider">
            {ticket.itemsSummary.ready}/{ticket.itemsSummary.total} Ready
          </span>
        </div>
      </div>

      {/* Ticket Items Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 custom-scrollbar bg-pos-bg/40">
        {ticket.items.map(item => {
          const isItemDone = item.kitchenStatus === 'SERVED';
          const isItemReady = item.kitchenStatus === 'READY';
          const isItemPrep = item.kitchenStatus === 'PREPARING';

          return (
            <div
              key={item.id}
              onClick={e => handleBumpItem(item, e)}
              className={cn(
                'p-3 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 relative group',
                isItemDone
                  ? 'bg-pos-surface/40 border-pos-border/40 opacity-50'
                  : isItemReady
                    ? 'bg-pos-success/10 border-pos-success/40 text-pos-text'
                    : isItemPrep
                      ? 'bg-pos-info/10 border-pos-info/40 text-pos-text'
                      : 'bg-pos-surface border-pos-border hover:border-pos-accent/40 text-pos-text'
              )}
            >
              {/* Item Header & Qty */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-lg font-black text-xs font-mono shrink-0 shadow-xs',
                      isItemReady
                        ? 'bg-pos-success text-white'
                        : isItemPrep
                          ? 'bg-pos-info text-white'
                          : 'bg-pos-accent text-white'
                    )}
                  >
                    {item.quantity}x
                  </span>

                  <div className="min-w-0">
                    <span
                      className={cn(
                        'font-bold text-sm leading-tight block truncate',
                        isItemDone ? 'line-through text-pos-text-muted' : 'text-pos-text'
                      )}
                    >
                      {item.itemName}
                    </span>
                    {item.variantName && (
                      <span className="text-[11px] text-pos-accent font-semibold block">
                        Portion: {item.variantName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Indicator Pill */}
                <div className="shrink-0">
                  {item.kitchenStatus === 'PENDING' && (
                    <span className="text-[10px] font-bold text-pos-text-muted bg-pos-bg px-2 py-0.5 rounded border border-pos-border/60">
                      Pending
                    </span>
                  )}
                  {item.kitchenStatus === 'PREPARING' && (
                    <span className="text-[10px] font-bold text-pos-info bg-pos-info/15 px-2 py-0.5 rounded border border-pos-info/30 flex items-center gap-1">
                      <ChefHat size={10} /> Cooking
                    </span>
                  )}
                  {item.kitchenStatus === 'READY' && (
                    <span className="text-[10px] font-bold text-pos-success bg-pos-success/15 px-2 py-0.5 rounded border border-pos-success/30 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Ready
                    </span>
                  )}
                  {item.kitchenStatus === 'SERVED' && (
                    <span className="text-[10px] font-bold text-pos-text-muted bg-pos-bg px-2 py-0.5 rounded">
                      Served
                    </span>
                  )}
                </div>
              </div>

              {/* Modifiers List */}
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="pl-7 flex flex-wrap gap-1">
                  {item.modifiers.map((mod, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium bg-pos-bg px-1.5 py-0.5 rounded text-pos-text-muted border border-pos-border/60"
                    >
                      +{mod.modifierOptionName}
                    </span>
                  ))}
                </div>
              )}

              {/* Special Cooking Instructions Box */}
              {item.specialInstructions && (
                <div className="pl-7">
                  <p className="text-[11px] font-semibold text-pos-warning bg-pos-warning/10 border border-pos-warning/30 px-2 py-1 rounded-lg flex items-center gap-1">
                    <AlertTriangle size={11} className="shrink-0" />
                    <span>{item.specialInstructions}</span>
                  </p>
                </div>
              )}

              {/* Kitchen Notes */}
              {item.kitchenNotes && (
                <p className="pl-7 text-[10px] text-pos-text-muted italic flex items-center gap-1">
                  <FileText size={10} /> {item.kitchenNotes}
                </p>
              )}
            </div>
          );
        })}

        {/* Global Ticket Notes */}
        {ticket.notes && (
          <div className="p-2.5 rounded-xl bg-pos-warning/10 border border-pos-warning/30 text-pos-warning text-xs space-y-1">
            <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider">
              <AlertTriangle size={12} /> Ticket Note
            </span>
            <p className="text-[11px] font-medium">{ticket.notes}</p>
          </div>
        )}
      </div>

      {/* Ticket Footer: Primary Bump Bar */}
      <div className="p-3 border-t border-pos-border bg-pos-header flex items-center gap-2 shrink-0">
        {/* Full Bump Action Button */}
        {(ticket.status === 'PENDING' || ticket.status === 'CONFIRMED') && (
          <button
            type="button"
            onClick={handleBumpTicket}
            disabled={isPendingMutation}
            className="flex-1 py-3 px-4 rounded-xl bg-pos-info hover:bg-pos-info/90 text-white font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-98 shadow-sm"
          >
            <ChefHat size={18} />
            <span>START PREP ALL</span>
          </button>
        )}

        {ticket.status === 'PREPARING' && (
          <button
            type="button"
            onClick={handleBumpTicket}
            disabled={isPendingMutation}
            className="flex-1 py-3 px-4 rounded-xl bg-pos-success hover:bg-pos-success/90 text-white font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-98 shadow-md shadow-pos-success/20"
          >
            <CheckCircle2 size={18} />
            <span>BUMP / MARK ALL READY</span>
          </button>
        )}

        {ticket.status === 'READY' && (
          <button
            type="button"
            onClick={handleBumpTicket}
            disabled={isPendingMutation}
            className="flex-1 py-3 px-4 rounded-xl bg-pos-accent hover:bg-pos-accent/90 text-white font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-98 shadow-md"
          >
            <UtensilsCrossed size={18} />
            <span>SERVE / EXPEDITE</span>
          </button>
        )}

        {/* Recall Button */}
        {(ticket.status === 'READY' || ticket.status === 'SERVED') && (
          <button
            type="button"
            onClick={handleRecallTicket}
            disabled={isPendingMutation}
            title="Recall ticket back to preparing"
            className="p-3 rounded-xl bg-pos-bg hover:bg-pos-surface-hover text-pos-text-muted hover:text-pos-warning border border-pos-border transition-all flex items-center justify-center"
          >
            <RotateCcw size={18} />
          </button>
        )}

        {/* Expand Details Trigger */}
        <button
          type="button"
          onClick={onOpenDetails}
          className="p-3 rounded-xl bg-pos-bg hover:bg-pos-surface-hover text-pos-text-muted hover:text-pos-text border border-pos-border transition-all flex items-center justify-center"
          title="View full ticket details"
        >
          <FileText size={18} />
        </button>
      </div>
    </div>
  );
};
