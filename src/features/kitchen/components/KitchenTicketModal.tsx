import React from 'react';
import { KitchenTicket } from '@/types';
import {
  useUpdateOrderKitchenStatusMutation,
  useRecallKitchenOrderMutation,
} from '../hooks/useKitchenData';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  X,
  Clock,
  Printer,
  ChefHat,
  CheckCircle2,
  UtensilsCrossed,
  RotateCcw,
  AlertTriangle,
  FileText,
  Package,
  Truck,
  Layers,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface KitchenTicketModalProps {
  ticket: KitchenTicket;
  onClose: () => void;
}

export const KitchenTicketModal: React.FC<KitchenTicketModalProps> = ({
  ticket,
  onClose,
}) => {
  const updateStatusMutation = useUpdateOrderKitchenStatusMutation();
  const recallMutation = useRecallKitchenOrderMutation();

  const handleUpdateStatus = async (status: 'PREPARING' | 'READY' | 'SERVED') => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId: ticket.id,
        payload: { status },
      });
      onClose();
    } catch {
      // Handled by query
    }
  };

  const handleRecall = async () => {
    try {
      await recallMutation.mutateAsync({
        orderId: ticket.id,
      });
      onClose();
    } catch {
      // Handled by query
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-md bg-pos-primary text-white font-black text-lg font-mono shadow-xs">
              #{ticket.dailySequence || ticket.orderCode.slice(-4)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-pos-text font-mono">
                  #{ticket.orderCode}
                </h3>
                <Badge
                  variant={
                    ticket.status === 'READY'
                      ? 'success'
                      : ticket.status === 'PREPARING'
                        ? 'info'
                        : 'warning'
                  }
                  size="sm"
                >
                  {ticket.status}
                </Badge>
              </div>
              <p className="text-xs text-pos-text-muted flex items-center gap-1 mt-0.5 font-mono">
                <Clock size={12} /> {ticket.elapsedMinutes}m {ticket.elapsedSeconds % 60}s
                elapsed • {ticket.businessDate}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close ticket modal"
            className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {/* Order Channel & Dining Info */}
          <div className="p-3 rounded-lg bg-pos-surface-subtle border border-pos-border flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center gap-2">
              {ticket.orderType === 'DINE_IN' && (
                <div className="flex items-center gap-1.5 font-semibold text-pos-primary">
                  <UtensilsCrossed size={15} />
                  <span>Dine-In: Table {ticket.tableName || 'N/A'}</span>
                  {ticket.zoneName && (
                    <span className="text-pos-text-muted font-normal">
                      ({ticket.zoneName})
                    </span>
                  )}
                </div>
              )}

              {ticket.orderType === 'TAKEAWAY' && (
                <div className="flex items-center gap-1.5 font-semibold text-pos-warning">
                  <Package size={15} />
                  <span>Takeaway Token #{ticket.tokenNumber || 'N/A'}</span>
                </div>
              )}

              {ticket.orderType === 'DELIVERY' && (
                <div className="flex items-center gap-1.5 font-semibold text-pos-info">
                  <Truck size={15} />
                  <span>Delivery Order</span>
                </div>
              )}
            </div>

            {ticket.customerName && (
              <span className="font-bold text-pos-text">{ticket.customerName}</span>
            )}
          </div>

          {/* Ticket Items Breakdown */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-2">
              Kitchen Items ({ticket.items.length})
            </h4>

            <div className="space-y-2">
              {ticket.items.map(item => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-pos-surface border border-pos-border text-xs space-y-1.5 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 rounded font-black text-xs font-mono bg-pos-primary text-white">
                        {item.quantity}x
                      </span>
                      <div>
                        <span className="font-bold text-xs text-pos-text">
                          {item.itemName}
                        </span>
                        {item.variantName && (
                          <span className="text-[10px] text-pos-primary font-semibold ml-1.5">
                            ({item.variantName})
                          </span>
                        )}
                        {item.stationName && (
                          <span className="text-[10px] text-pos-text-muted flex items-center gap-1 mt-0.5 font-medium">
                            <Layers size={9} /> Station: {item.stationName}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-semibold uppercase',
                        item.kitchenStatus === 'READY'
                          ? 'bg-pos-success-soft text-pos-success border border-[#BBF7D0]'
                          : item.kitchenStatus === 'PREPARING'
                            ? 'bg-pos-info-soft text-pos-info border border-[#BFDBFE]'
                            : 'bg-pos-surface-subtle text-pos-text-muted border border-pos-border'
                      )}
                    >
                      {item.kitchenStatus}
                    </span>
                  </div>

                  {/* Modifiers */}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="pl-6 flex flex-wrap gap-1">
                      {item.modifiers.map((m, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-pos-surface-subtle border border-pos-border px-1.5 py-0.5 rounded text-pos-text-secondary"
                        >
                          +{m.modifierOptionName}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Instructions */}
                  {item.specialInstructions && (
                    <p className="pl-6 text-[10px] font-semibold text-pos-warning bg-pos-warning-soft p-1.5 rounded border border-[#FED7AA] flex items-center gap-1">
                      <AlertTriangle size={11} className="shrink-0" />
                      <span>{item.specialInstructions}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Notes */}
          {ticket.notes && (
            <div className="p-3 rounded-lg bg-pos-warning-soft border border-[#FED7AA] text-pos-warning text-xs space-y-1">
              <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider">
                <FileText size={12} /> Special Ticket Notes
              </span>
              <p className="text-xs font-medium">{ticket.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-pos-border bg-pos-surface flex flex-col sm:flex-row items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => window.print()}
            className="w-full sm:w-auto text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <Printer size={15} />
            <span>Print KOT</span>
          </Button>

          <div className="flex-1 w-full flex items-center justify-end gap-2">
            {(ticket.status === 'READY' || ticket.status === 'SERVED') && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleRecall}
                isLoading={recallMutation.isPending}
                className="text-xs font-semibold text-pos-warning hover:bg-pos-warning-soft"
              >
                <RotateCcw size={14} className="mr-1" />
                Recall Ticket
              </Button>
            )}

            {(ticket.status === 'PENDING' || ticket.status === 'CONFIRMED') && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => handleUpdateStatus('PREPARING')}
                isLoading={updateStatusMutation.isPending}
                className="w-full sm:w-auto font-bold bg-pos-info hover:bg-pos-info/90 text-white shadow-xs"
              >
                <ChefHat size={16} className="mr-1.5" />
                Start Prep
              </Button>
            )}

            {ticket.status === 'PREPARING' && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => handleUpdateStatus('READY')}
                isLoading={updateStatusMutation.isPending}
                className="w-full sm:w-auto font-bold bg-pos-success hover:bg-pos-success/90 text-white shadow-xs"
              >
                <CheckCircle2 size={16} className="mr-1.5" />
                Mark Ready
              </Button>
            )}

            {ticket.status === 'READY' && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => handleUpdateStatus('SERVED')}
                isLoading={updateStatusMutation.isPending}
                className="w-full sm:w-auto font-bold shadow-xs"
              >
                <UtensilsCrossed size={16} className="mr-1.5" />
                Serve / Expedite
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
