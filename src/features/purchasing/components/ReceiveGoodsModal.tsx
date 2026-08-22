import React, { useState } from 'react';
import { PurchasingOrderRecord, InventoryLocationRecord } from '@/types';
import { useReceivePurchasingGoodsMutation } from '../hooks/usePurchasingData';
import { Button } from '@/components/ui/Button';
import { X, PackageCheck, AlertCircle, Hash, MapPin, CheckCircle2 } from 'lucide-react';

interface ReceiveGoodsModalProps {
  order: PurchasingOrderRecord;
  locations: InventoryLocationRecord[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ReceiveGoodsModal: React.FC<ReceiveGoodsModalProps> = ({
  order,
  locations,
  onClose,
  onSuccess,
}) => {
  const receiveMutation = useReceivePurchasingGoodsMutation();

  const [invoiceNumber, setInvoiceNumber] = useState<string>(order.invoiceNumber || '');
  const [receivedLocationId, setReceivedLocationId] = useState<string>(
    order.locationId || locations[0]?.id || ''
  );
  const [notes, setNotes] = useState<string>('');

  // Receiving quantity per line item
  const [receiveQtys, setReceiveQtys] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const it of order.items) {
      const remaining = Math.max(0, it.quantity - it.quantityReceived);
      initial[it.id] = remaining > 0 ? remaining.toString() : '0';
    }
    return initial;
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQtyChange = (itemId: string, value: string) => {
    setReceiveQtys(prev => ({ ...prev, [itemId]: value }));
  };

  const handleFillAll = () => {
    const updated: Record<string, string> = {};
    for (const it of order.items) {
      const remaining = Math.max(0, it.quantity - it.quantityReceived);
      updated[it.id] = remaining.toString();
    }
    setReceiveQtys(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemsToReceive = order.items
      .map(it => ({
        purchaseOrderItemId: it.id,
        quantityReceived: parseFloat(receiveQtys[it.id] || '0') || 0,
      }))
      .filter(it => it.quantityReceived > 0);

    if (itemsToReceive.length === 0) {
      setErrorMessage('Please specify quantity received for at least one item.');
      return;
    }

    setErrorMessage(null);

    try {
      await receiveMutation.mutateAsync({
        id: order.id,
        payload: {
          invoiceNumber: invoiceNumber.trim() || undefined,
          receivedLocationId: receivedLocationId || undefined,
          notes: notes.trim() || undefined,
          items: itemsToReceive,
        },
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to receive goods';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-3xl bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-success-soft border border-[#BBF7D0] text-pos-success flex items-center justify-center">
              <PackageCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                Receive Shipment Goods
              </h3>
              <p className="text-xs text-pos-text-muted">
                PO #{order.orderNumber} • {order.supplier?.name || 'Direct Vendor'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar"
        >
          {errorMessage && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Receiving Details Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-pos-surface-subtle border border-pos-border">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1">
                Vendor Delivery Invoice #
              </label>
              <div className="relative">
                <Hash
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-94821"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1">
                Stock Location / Storage
              </label>
              <div className="relative">
                <MapPin
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <select
                  value={receivedLocationId}
                  onChange={e => setReceivedLocationId(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
                >
                  <option value="">-- Main Kitchen Storage --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary">
                Items to Receive
              </span>
              <button
                type="button"
                onClick={handleFillAll}
                className="text-xs text-pos-primary hover:underline font-semibold flex items-center gap-1"
              >
                <CheckCircle2 size={13} /> Fill All Remaining
              </button>
            </div>

            <div className="rounded-lg border border-pos-border overflow-hidden bg-pos-surface">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-pos-border bg-pos-surface-subtle text-pos-text-muted font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3 text-center w-24">Ordered</th>
                    <th className="py-2.5 px-3 text-center w-24">Received</th>
                    <th className="py-2.5 px-3 text-center w-24">Remaining</th>
                    <th className="py-2.5 px-3 w-36 text-right">Qty Receiving Now</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pos-border">
                  {order.items.map(it => {
                    const remaining = Math.max(0, it.quantity - it.quantityReceived);
                    const isFullyReceived = remaining <= 0;

                    return (
                      <tr
                        key={it.id}
                        className={
                          isFullyReceived
                            ? 'opacity-60 bg-pos-surface-subtle/40'
                            : 'hover:bg-pos-surface-subtle transition-colors'
                        }
                      >
                        <td className="p-3">
                          <span className="font-bold text-pos-text block">
                            {it.inventoryItem.name}
                          </span>
                          <span className="text-[10px] text-pos-text-muted font-mono">
                            Code: {it.inventoryItem.itemCode} • Unit:{' '}
                            {it.inventoryItem.unit}
                          </span>
                        </td>

                        <td className="p-3 text-center font-mono font-semibold text-pos-text">
                          {it.quantity}
                        </td>

                        <td className="p-3 text-center font-mono font-semibold text-pos-success">
                          {it.quantityReceived}
                        </td>

                        <td className="p-3 text-center font-mono font-bold text-pos-primary">
                          {remaining}
                        </td>

                        <td className="p-3 text-right">
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            step="any"
                            disabled={isFullyReceived}
                            value={receiveQtys[it.id] || '0'}
                            onChange={e => handleQtyChange(it.id, e.target.value)}
                            className="w-28 px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-success text-right disabled:opacity-40 shadow-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receiving Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1">
              Receiving Notes / Condition (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. All boxes inspected in good condition, chilled upon receipt..."
              className="w-full p-2.5 rounded-lg bg-pos-surface border border-pos-border text-pos-text placeholder-pos-text-muted text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none font-medium shadow-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-pos-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={receiveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={receiveMutation.isPending}
              className="font-bold shadow-xs bg-pos-success hover:bg-pos-success/90"
            >
              <PackageCheck size={16} className="mr-1.5" />
              Confirm Stock Receipt
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
