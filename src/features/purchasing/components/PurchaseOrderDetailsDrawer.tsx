import React from 'react';
import { PurchasingOrderRecord } from '@/types';
import {
  usePurchasingOrderQuery,
  useOrderPurchasingOrderMutation,
  useCancelPurchasingOrderMutation,
} from '../hooks/usePurchasingData';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  X,
  FileSpreadsheet,
  Truck,
  Phone,
  MapPin,
  Calendar,
  Send,
  PackageCheck,
  Undo2,
  Ban,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { formatPrice as centralizedFormatPrice } from '@/utils/format';

interface PurchaseOrderDetailsDrawerProps {
  orderId: string;
  currency?: string;
  onClose: () => void;
  onEdit: (order: PurchasingOrderRecord) => void;
  onReceive: (order: PurchasingOrderRecord) => void;
  onReturn: (order: PurchasingOrderRecord) => void;
  onSuccess: () => void;
}

export const PurchaseOrderDetailsDrawer: React.FC<PurchaseOrderDetailsDrawerProps> = ({
  orderId,
  currency = 'PKR',
  onClose,
  onEdit,
  onReceive,
  onReturn,
  onSuccess,
}) => {
  const { data: order, isLoading } = usePurchasingOrderQuery(orderId);

  const orderMutation = useOrderPurchasingOrderMutation();
  const cancelMutation = useCancelPurchasingOrderMutation();

  const formatPrice = (val: number) => {
    return centralizedFormatPrice(val, currency);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge variant="default" size="sm" className="text-[10px]">
            Draft
          </Badge>
        );
      case 'ORDERED':
        return (
          <Badge variant="warning" size="sm" className="text-[10px]">
            Ordered / In Transit
          </Badge>
        );
      case 'PARTIALLY_RECEIVED':
        return (
          <Badge variant="warning" size="sm" className="text-[10px]">
            Partially Received
          </Badge>
        );
      case 'RECEIVED':
        return (
          <Badge variant="success" size="sm" className="text-[10px]">
            Fully Received
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" size="sm" className="text-[10px]">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="sm" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  const handleSendOrder = async () => {
    if (!order) return;
    try {
      await orderMutation.mutateAsync(order.id);
      onSuccess();
    } catch {
      // handled
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!window.confirm(`Are you sure you want to cancel PO #${order.orderNumber}?`)) {
      return;
    }
    try {
      await cancelMutation.mutateAsync(order.id);
      onSuccess();
    } catch {
      // handled
    }
  };

  if (isLoading || !order) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 flex justify-end">
        <div className="w-full max-w-xl bg-pos-surface border-l border-pos-border p-12 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <span className="text-xs text-pos-text-muted">
            Loading purchase order details...
          </span>
        </div>
      </div>
    );
  }

  // Progress metrics
  const totalOrderedQty = order.items.reduce((acc, it) => acc + it.quantity, 0);
  const totalReceivedQty = order.items.reduce(
    (acc, it) => acc + (it.quantityReceived || 0),
    0
  );
  const percentReceived =
    totalOrderedQty > 0
      ? Math.min(100, Math.round((totalReceivedQty / totalOrderedQty) * 100))
      : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 flex justify-end animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-2xl bg-pos-surface border-l border-pos-border shadow-drawer flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-pos-text font-mono">
                  #{order.orderNumber}
                </h3>
                {getStatusBadge(order.status)}
              </div>
              <p className="text-xs text-pos-text-muted mt-0.5 font-medium">
                {order.supplier?.name || 'Direct Vendor'} • {order.items.length} Line
                Items
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {order.status === 'DRAFT' && (
              <button
                type="button"
                onClick={() => onEdit(order)}
                className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
                title="Edit draft order"
                aria-label="Edit draft order"
              >
                <Edit2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* Action CTAs */}
          {order.status !== 'CANCELLED' && (
            <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary block">
                Workflow Actions
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {order.status === 'DRAFT' && (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={orderMutation.isPending}
                    onClick={handleSendOrder}
                    className="font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Send size={13} />
                    <span>Send / Dispatch to Supplier</span>
                  </Button>
                )}

                {(order.status === 'ORDERED' ||
                  order.status === 'PARTIALLY_RECEIVED') && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onReceive(order)}
                    className="font-bold text-xs flex items-center gap-1.5 bg-pos-success hover:bg-pos-success/90 text-white shadow-xs"
                  >
                    <PackageCheck size={14} />
                    <span>Receive Goods Shipment</span>
                  </Button>
                )}

                {(order.status === 'PARTIALLY_RECEIVED' ||
                  order.status === 'RECEIVED') && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onReturn(order)}
                    className="font-semibold text-xs text-pos-danger hover:bg-pos-danger-soft flex items-center gap-1.5"
                  >
                    <Undo2 size={13} />
                    <span>Return Received Items</span>
                  </Button>
                )}

                {['DRAFT', 'ORDERED'].includes(order.status) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={cancelMutation.isPending}
                    onClick={handleCancelOrder}
                    className="font-semibold text-xs text-pos-danger hover:bg-pos-danger-soft flex items-center gap-1.5"
                  >
                    <Ban size={13} />
                    <span>Cancel PO</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Receiving Progress */}
          <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-pos-primary" />
                <span>Receiving Progress</span>
              </span>
              <span className="font-mono font-bold text-pos-primary">
                {totalReceivedQty} / {totalOrderedQty} Units ({percentReceived}%)
              </span>
            </div>

            <div className="h-2 w-full bg-pos-surface rounded-full overflow-hidden border border-pos-border">
              <div
                className="h-full bg-pos-primary transition-all duration-300 rounded-full"
                style={{ width: `${percentReceived}%` }}
              />
            </div>
          </div>

          {/* Supplier & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border space-y-1.5 text-xs shadow-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted flex items-center gap-1">
                <Truck size={12} /> Supplier Vendor
              </span>
              <span className="font-bold text-pos-text block text-sm">
                {order.supplier?.name || 'Direct Procurement'}
              </span>
              {order.supplier?.contactPerson && (
                <span className="text-[11px] text-pos-text-muted block">
                  Contact: {order.supplier.contactPerson}
                </span>
              )}
              {order.supplier?.phone && (
                <span className="text-[11px] text-pos-primary font-mono block">
                  <Phone size={11} className="inline mr-1" />
                  {order.supplier.phone}
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border space-y-1.5 text-xs shadow-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted flex items-center gap-1">
                <MapPin size={12} /> Receiving Destination
              </span>
              <span className="font-bold text-pos-text block text-sm">
                {order.location?.name || 'Main Kitchen Storage'}
              </span>
              {order.expectedDeliveryDate && (
                <span className="text-[11px] text-pos-text-muted flex items-center gap-1 mt-1">
                  <Calendar size={11} /> Expected:{' '}
                  {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Line Items Breakdown */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary block">
              Line Items ({order.items.length})
            </span>

            <div className="rounded-lg border border-pos-border overflow-hidden bg-pos-surface">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-pos-border bg-pos-surface-subtle text-pos-text-muted font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3 text-center">Ordered</th>
                    <th className="py-2.5 px-3 text-center">Received</th>
                    <th className="py-2.5 px-3 text-right">Unit Cost</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pos-border">
                  {order.items.map(it => (
                    <tr
                      key={it.id}
                      className="hover:bg-pos-surface-subtle transition-colors"
                    >
                      <td className="p-3">
                        <span className="font-bold text-pos-text block">
                          {it.inventoryItem.name}
                        </span>
                        <span className="text-[10px] text-pos-text-muted font-mono">
                          {it.inventoryItem.unit}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-semibold text-pos-text">
                        {it.quantity}
                      </td>
                      <td className="p-3 text-center font-mono font-semibold text-pos-success">
                        {it.quantityReceived}
                      </td>
                      <td className="p-3 text-right font-mono text-pos-text-muted">
                        {formatPrice(it.unitCost)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-pos-text">
                        {formatPrice(it.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-2 text-xs">
            <div className="flex items-center justify-between text-pos-text-muted">
              <span>Subtotal</span>
              <span className="font-mono">{formatPrice(order.totalAmount)}</span>
            </div>
            {order.totalDiscount > 0 && (
              <div className="flex items-center justify-between text-pos-danger">
                <span>Discount</span>
                <span className="font-mono">-{formatPrice(order.totalDiscount)}</span>
              </div>
            )}
            {order.totalTax > 0 && (
              <div className="flex items-center justify-between text-pos-text-muted">
                <span>Tax</span>
                <span className="font-mono">+{formatPrice(order.totalTax)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-pos-border flex items-center justify-between text-sm font-bold text-pos-text">
              <span>Grand Total</span>
              <span className="font-mono text-pos-primary text-base font-bold">
                {formatPrice(order.grandTotal)}
              </span>
            </div>
          </div>

          {/* Returns Section */}
          {order.returns && order.returns.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-pos-danger flex items-center gap-1">
                <Undo2 size={13} /> Recorded Returns ({order.returns.length})
              </span>

              <div className="space-y-2">
                {order.returns.map(ret => (
                  <div
                    key={ret.id}
                    className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-pos-danger block">
                        #{ret.returnNumber} • {ret.reason}
                      </span>
                      <span className="text-[11px] text-pos-text-muted">
                        {new Date(ret.createdAt).toLocaleDateString()}
                        {ret.notes && ` • "${ret.notes}"`}
                      </span>
                    </div>

                    <span className="font-mono font-bold text-pos-danger">
                      -{formatPrice(ret.totalRefundAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pos-border bg-pos-surface flex items-center justify-end shrink-0">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
