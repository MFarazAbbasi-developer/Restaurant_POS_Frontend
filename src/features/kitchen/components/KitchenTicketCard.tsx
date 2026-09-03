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
  Layers,
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
  const renderChannelBadge = () => {
    switch (ticket.orderType) {
      case 'DINE_IN':
        return (
          <span className="text-[11px] font-semibold text-pos-primary bg-pos-primary-soft px-2 py-0.5 rounded flex items-center gap-1 border border-pos-primary/20">
            <UtensilsCrossed size={12} />
            <span>Table {ticket.tableName || 'Dine-In'}</span>
            {ticket.zoneName && (
              <span className="text-pos-text-muted font-normal">({ticket.zoneName})</span>
            )}
          </span>
        );
      case 'TAKEAWAY':
        return (
          <span className="text-[11px] font-semibold text-pos-warning bg-pos-warning-soft px-2 py-0.5 rounded flex items-center gap-1 border border-[#FED7AA]">
            <Package size={12} />
            <span>Takeaway {ticket.tokenNumber ? `#${ticket.tokenNumber}` : ''}</span>
          </span>
        );
      case 'DELIVERY':
        return (
          <span className="text-[11px] font-semibold text-pos-info bg-pos-info-soft px-2 py-0.5 rounded flex items-center gap-1 border border-[#BFDBFE]">
            <Truck size={12} />
            <span>Delivery</span>
          </span>
        );
      default:
        return (
          <Badge variant="default" size="sm">
            {ticket.orderType}
          </Badge>
        );
    }
  };

  // Urgency theme styling based on elapsed waiting time
  const getUrgencyCardStyles = () => {
    switch (ticket.urgencyTier) {
      case 'CRITICAL':
        return 'border-[#FECACA] bg-pos-danger-soft/30 ring-1 ring-pos-danger/50 shadow-sm';
      case 'WARNING':
        return 'border-[#FED7AA] bg-pos-warning-soft/30 shadow-xs';
      case 'NORMAL':
      default:
        return 'border-pos-border bg-pos-surface shadow-xs';
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

  // Individual item bump action (tap to advance item status)
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
        'flex flex-col rounded-lg border transition-all duration-150 overflow-hidden select-none min-h-[350px] max-h-[580px]',
        getUrgencyCardStyles()
      )}
    >
      {/* Ticket Header */}
      <div
        className={cn(
          'p-3 border-b border-pos-border flex items-start justify-between gap-2 shrink-0',
          ticket.urgencyTier === 'CRITICAL'
            ? 'bg-pos-danger-soft/80 border-[#FECACA]'
            : ticket.urgencyTier === 'WARNING'
              ? 'bg-pos-warning-soft/70 border-[#FED7AA]'
              : 'bg-pos-surface'
        )}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-pos-primary text-white font-black text-xs font-mono tracking-wider shadow-xs">
              #{ticket.dailySequence || ticket.orderCode.slice(-4)}
            </span>
            <span className="font-mono text-xs font-bold text-pos-text">
              #{ticket.orderCode}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            {renderChannelBadge()}
            {ticket.customerName && (
              <span className="text-[11px] text-pos-text-muted font-medium truncate max-w-[120px]">
                {ticket.customerName}
              </span>
            )}
          </div>
        </div>

        {/* Live Elapsed Prep Timer Pill */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div
            className={cn(
              'px-2 py-0.5 rounded text-xs font-bold font-mono flex items-center gap-1 shadow-xs',
              ticket.urgencyTier === 'CRITICAL'
                ? 'bg-pos-danger text-white'
                : ticket.urgencyTier === 'WARNING'
                  ? 'bg-pos-warning-soft text-pos-warning border border-[#FED7AA]'
                  : 'bg-pos-surface border border-pos-border text-pos-text'
            )}
          >
            {ticket.urgencyTier === 'CRITICAL' ? (
              <Flame size={12} className="shrink-0 animate-bounce" />
            ) : (
              <Clock size={12} className="shrink-0 text-pos-text-muted" />
            )}
            <span>
              {String(ticket.elapsedMinutes).padStart(2, '0')}:
              {String(ticket.elapsedSeconds % 60).padStart(2, '0')}
            </span>
          </div>

          <span className="text-[10px] font-semibold text-pos-text-muted">
            {ticket.itemsSummary.ready}/{ticket.itemsSummary.total} Items Ready
          </span>
        </div>
      </div>

      {/* Ticket Items Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-pos-bg/60">
        {ticket.items.map(item => {
          const isItemDone = item.kitchenStatus === 'SERVED';
          const isItemReady = item.kitchenStatus === 'READY';
          const isItemPrep = item.kitchenStatus === 'PREPARING';

          return (
            <div
              key={item.id}
              onClick={e => handleBumpItem(item, e)}
              className={cn(
                'p-2.5 rounded-lg border transition-colors cursor-pointer text-xs space-y-1.5 relative shadow-xs',
                isItemDone
                  ? 'bg-pos-surface-subtle/50 border-pos-border/60 opacity-50'
                  : isItemReady
                    ? 'bg-pos-success-soft border-[#BBF7D0] text-pos-text'
                    : isItemPrep
                      ? 'bg-pos-info-soft border-[#BFDBFE] text-pos-text'
                      : 'bg-pos-surface border-pos-border hover:border-pos-border-strong text-pos-text'
              )}
            >
              {/* Item Header & Qty */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded font-black text-xs font-mono shrink-0 shadow-xs',
                      isItemReady
                        ? 'bg-pos-success text-white'
                        : isItemPrep
                          ? 'bg-pos-info text-white'
                          : 'bg-pos-primary text-white'
                    )}
                  >
                    {item.quantity}x
                  </span>

                  <div className="min-w-0">
                    <span
                      className={cn(
                        'font-bold text-xs leading-snug block truncate',
                        isItemDone ? 'line-through text-pos-text-muted' : 'text-pos-text'
                      )}
                    >
                      {item.itemName}
                    </span>
                    {item.variantName && (
                      <span className="text-[10px] text-pos-primary font-semibold block">
                        Portion: {item.variantName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Indicator Pill */}
                <div className="shrink-0">
                  {item.kitchenStatus === 'PENDING' && (
                    <span className="text-[10px] font-medium text-pos-text-muted bg-pos-surface px-1.5 py-0.5 rounded border border-pos-border">
                      Pending
                    </span>
                  )}
                  {item.kitchenStatus === 'PREPARING' && (
                    <span className="text-[10px] font-semibold text-pos-info bg-pos-info-soft px-1.5 py-0.5 rounded border border-[#BFDBFE] flex items-center gap-1">
                      <ChefHat size={10} /> Cooking
                    </span>
                  )}
                  {item.kitchenStatus === 'READY' && (
                    <span className="text-[10px] font-semibold text-pos-success bg-pos-success-soft px-1.5 py-0.5 rounded border border-[#BBF7D0] flex items-center gap-1">
                      <CheckCircle2 size={10} /> Ready
                    </span>
                  )}
                  {item.kitchenStatus === 'SERVED' && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 flex items-center gap-1">
                      <CheckCircle2 size={10} className="text-emerald-600" /> Direct / Ready
                    </span>
                  )}
                </div>
              </div>

              {/* Modifiers List */}
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="pl-6 flex flex-wrap gap-1">
                  {item.modifiers.map((mod, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium bg-pos-surface-subtle px-1.5 py-0.5 rounded text-pos-text-secondary border border-pos-border"
                    >
                      +{mod.modifierOptionName}
                    </span>
                  ))}
                </div>
              )}

              {/* Special Cooking Instructions Box */}
              {item.specialInstructions && (
                <div className="pl-6">
                  <p className="text-[10px] font-semibold text-pos-warning bg-pos-warning-soft border border-[#FED7AA] px-1.5 py-0.5 rounded flex items-center gap-1">
                    <AlertTriangle size={11} className="shrink-0" />
                    <span>{item.specialInstructions}</span>
                  </p>
                </div>
              )}

              {/* Station Tag & Kitchen Notes */}
              {(item.stationName || item.kitchenNotes) && (
                <div className="pl-6 flex items-center gap-2 text-[10px] text-pos-text-muted">
                  {item.stationName && (
                    <span className="flex items-center gap-1 font-medium bg-pos-surface px-1 rounded border border-pos-border">
                      <Layers size={9} /> {item.stationName}
                    </span>
                  )}
                  {item.kitchenNotes && (
                    <span className="italic flex items-center gap-0.5">
                      <FileText size={9} /> {item.kitchenNotes}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Global Ticket Notes */}
        {ticket.notes && (
          <div className="p-2.5 rounded-lg bg-pos-warning-soft border border-[#FED7AA] text-pos-warning text-xs space-y-1">
            <span className="font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider">
              <AlertTriangle size={11} /> Ticket Note
            </span>
            <p className="text-[11px] font-medium">{ticket.notes}</p>
          </div>
        )}
      </div>

      {/* Ticket Footer: Primary Bump Bar */}
      <div className="p-2.5 border-t border-pos-border bg-pos-surface flex items-center gap-2 shrink-0">
        {/* Full Bump Action Button */}
        {(ticket.status === 'PENDING' || ticket.status === 'CONFIRMED') && (
          <button
            type="button"
            onClick={handleBumpTicket}
            disabled={isPendingMutation}
            className="flex-1 py-2.5 px-3 rounded-md bg-pos-info hover:bg-pos-info/90 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[40px] shadow-xs"
          >
            <ChefHat size={16} />
            <span>START PREP ALL</span>
          </button>
        )}

        {ticket.status === 'PREPARING' && (
          <button
            type="button"
            onClick={handleBumpTicket}
            disabled={isPendingMutation}
            className="flex-1 py-2.5 px-3 rounded-md bg-pos-success hover:bg-pos-success/90 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[40px] shadow-xs"
          >
            <CheckCircle2 size={16} />
            <span>BUMP / MARK ALL READY</span>
          </button>
        )}

        {ticket.status === 'READY' && (
          <button
            type="button"
            onClick={handleBumpTicket}
            disabled={isPendingMutation}
            className="flex-1 py-2.5 px-3 rounded-md bg-pos-primary hover:bg-pos-primary-hover text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[40px] shadow-xs"
          >
            <UtensilsCrossed size={16} />
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
            className="h-[40px] px-2.5 rounded-md bg-pos-surface hover:bg-pos-surface-subtle text-pos-text-muted hover:text-pos-warning border border-pos-border transition-colors flex items-center justify-center"
          >
            <RotateCcw size={16} />
          </button>
        )}

        {/* Expand Details Trigger */}
        <button
          type="button"
          onClick={onOpenDetails}
          className="h-[40px] px-2.5 rounded-md bg-pos-surface hover:bg-pos-surface-subtle text-pos-text-muted hover:text-pos-text border border-pos-border transition-colors flex items-center justify-center"
          title="View full ticket details"
        >
          <FileText size={16} />
        </button>
      </div>
    </div>
  );
};
