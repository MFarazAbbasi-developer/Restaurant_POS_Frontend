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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-xl bg-pos-accent text-white font-black text-lg font-mono">
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
            className="p-2 rounded-xl text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* Order Channel & Dining Info */}
          <div className="p-3.5 rounded-xl bg-pos-bg border border-pos-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {ticket.orderType === 'DINE_IN' && (
                <div className="flex items-center gap-1.5 font-bold text-pos-accent">
                  <UtensilsCrossed size={16} />
                  <span>Dine-In: Table {ticket.tableName || 'N/A'}</span>
                  {ticket.zoneName && (
                    <span className="text-pos-text-muted font-normal">
                      ({ticket.zoneName})
                    </span>
                  )}
                </div>
              )}

              {ticket.orderType === 'TAKEAWAY' && (
                <div className="flex items-center gap-1.5 font-bold text-pos-warning">
                  <Package size={16} />
                  <span>Takeaway Token #{ticket.tokenNumber || 'N/A'}</span>
                </div>
              )}

              {ticket.orderType === 'DELIVERY' && (
                <div className="flex items-center gap-1.5 font-bold text-sky-400">
                  <Truck size={16} />
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-pos-text mb-2.5">
              Kitchen Items Breakdown ({ticket.items.length})
            </h4>

            <div className="space-y-2">
              {ticket.items.map(item => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-pos-bg border border-pos-border text-xs space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-pos-accent text-white font-black font-mono">
                        {item.quantity}x
                      </span>
                      <div>
                        <span className="font-bold text-sm text-pos-text">
                          {item.itemName}
                        </span>
                        {item.variantName && (
                          <span className="text-xs text-pos-accent font-semibold ml-1.5">
                            ({item.variantName})
                          </span>
                        )}
                        {item.stationName && (
                          <span className="text-[10px] text-pos-text-muted block mt-0.5">
                            Station: {item.stationName}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                        item.kitchenStatus === 'READY'
                          ? 'bg-pos-success/20 text-pos-success'
                          : item.kitchenStatus === 'PREPARING'
                            ? 'bg-pos-info/20 text-pos-info'
                            : 'bg-pos-surface text-pos-text-muted'
                      )}
                    >
                      {item.kitchenStatus}
                    </span>
                  </div>

                  {/* Modifiers */}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="pl-7 flex flex-wrap gap-1">
                      {item.modifiers.map((m, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-pos-surface border border-pos-border px-1.5 py-0.5 rounded text-pos-text-muted"
                        >
                          +{m.modifierOptionName}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Instructions */}
                  {item.specialInstructions && (
                    <p className="pl-7 text-[11px] font-semibold text-pos-warning bg-pos-warning/10 p-1.5 rounded-lg border border-pos-warning/30 flex items-center gap-1">
                      <AlertTriangle size={12} className="shrink-0" />
                      <span>{item.specialInstructions}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Notes */}
          {ticket.notes && (
            <div className="p-3 rounded-xl bg-pos-warning/10 border border-pos-warning/30 text-pos-warning text-xs space-y-1">
              <span className="font-bold flex items-center gap-1">
                <FileText size={13} /> Order Special Notes
              </span>
              <p>{ticket.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-pos-border bg-pos-header flex flex-col sm:flex-row items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => window.print()}
            className="w-full sm:w-auto text-xs font-semibold flex items-center justify-center gap-1.5"
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
                className="text-xs font-semibold text-pos-warning hover:bg-pos-warning/10"
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
                className="w-full sm:w-auto font-bold bg-pos-info hover:bg-pos-info/90 text-white"
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
                className="w-full sm:w-auto font-bold bg-pos-success hover:bg-pos-success/90 text-white shadow-sm"
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
                className="w-full sm:w-auto font-bold shadow-sm"
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
