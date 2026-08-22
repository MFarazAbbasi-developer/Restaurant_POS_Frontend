import React, { useState } from 'react';
import { PurchasingOrderRecord } from '@/types';
import { useCreatePurchasingReturnMutation } from '../hooks/usePurchasingData';
import { Button } from '@/components/ui/Button';
import { X, Undo2, AlertCircle } from 'lucide-react';

interface PurchaseReturnModalProps {
  order: PurchasingOrderRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export const PurchaseReturnModal: React.FC<PurchaseReturnModalProps> = ({
  order,
  onClose,
  onSuccess,
}) => {
  const returnMutation = useCreatePurchasingReturnMutation();

  const [reason, setReason] = useState<string>('Damaged / Defective Goods');
  const [notes, setNotes] = useState<string>('');

  // Return quantities per line item
  const [returnQtys, setReturnQtys] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQtyChange = (itemId: string, val: string) => {
    setReturnQtys(prev => ({ ...prev, [itemId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage('Return reason is required.');
      return;
    }

    const itemsToReturn = order.items
      .map(it => ({
        purchaseOrderItemId: it.id,
        quantity: parseFloat(returnQtys[it.id] || '0') || 0,
      }))
      .filter(it => it.quantity > 0);

    if (itemsToReturn.length === 0) {
      setErrorMessage('Please specify return quantity for at least one received item.');
      return;
    }

    setErrorMessage(null);

    try {
      await returnMutation.mutateAsync({
        id: order.id,
        payload: {
          reason: reason.trim(),
          notes: notes.trim() || undefined,
          items: itemsToReturn,
        },
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to record purchase return';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-2xl bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger flex items-center justify-center">
              <Undo2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                Record Purchase Return
              </h3>
              <p className="text-xs text-pos-text-muted">
                PO #{order.orderNumber} • Return received goods to supplier
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1">
              Return Reason <span className="text-pos-danger">*</span>
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
            >
              <option value="Damaged / Defective Goods">Damaged / Defective Goods</option>
              <option value="Expired / Near-Expiry Shipment">
                Expired / Near-Expiry Shipment
              </option>
              <option value="Incorrect Item Delivered">Incorrect Item Delivered</option>
              <option value="Quality Substandard">Quality Substandard</option>
              <option value="Excess / Over-Shipment">Excess / Over-Shipment</option>
              <option value="Other">Other Reason</option>
            </select>
          </div>

          {/* Line Items for Return */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary block">
              Received Items Available for Return
            </span>

            <div className="rounded-lg border border-pos-border overflow-hidden bg-pos-surface">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-pos-border bg-pos-surface-subtle text-pos-text-muted font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3 text-center w-28">Received Qty</th>
                    <th className="py-2.5 px-3 w-36 text-right">Return Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pos-border">
                  {order.items.map(it => {
                    const received = it.quantityReceived || 0;
                    const canReturn = received > 0;

                    return (
                      <tr
                        key={it.id}
                        className={
                          !canReturn
                            ? 'opacity-40 bg-pos-surface-subtle/50'
                            : 'hover:bg-pos-surface-subtle transition-colors'
                        }
                      >
                        <td className="p-3">
                          <span className="font-bold text-pos-text block">
                            {it.inventoryItem.name}
                          </span>
                          <span className="text-[10px] text-pos-text-muted font-mono">
                            Unit: {it.inventoryItem.unit}
                          </span>
                        </td>

                        <td className="p-3 text-center font-mono font-semibold text-pos-success">
                          {received}
                        </td>

                        <td className="p-3 text-right">
                          <input
                            type="number"
                            min="0"
                            max={received}
                            step="any"
                            disabled={!canReturn}
                            value={returnQtys[it.id] || '0'}
                            onChange={e => handleQtyChange(it.id, e.target.value)}
                            className="w-28 px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary text-right disabled:opacity-40 shadow-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1">
              Return Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Return credit note requested from vendor..."
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
              disabled={returnMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              isLoading={returnMutation.isPending}
              className="font-bold shadow-xs"
            >
              <Undo2 size={15} className="mr-1.5" />
              Confirm Return
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
