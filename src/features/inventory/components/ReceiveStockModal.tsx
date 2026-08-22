import React, { useState } from 'react';
import { InventoryItemRecord, InventoryLocationRecord, SupplierRecord } from '@/types';
import { useCreatePurchaseMutation } from '../hooks/useInventoryData';
import { Button } from '@/components/ui/Button';
import { X, Truck, Plus, Trash2, AlertCircle, ReceiptText } from 'lucide-react';

interface ReceiveStockModalProps {
  allItems: InventoryItemRecord[];
  locations: InventoryLocationRecord[];
  suppliers: SupplierRecord[];
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface PurchaseLine {
  inventoryItemId: string;
  quantity: string;
  unitCost: string;
}

export const ReceiveStockModal: React.FC<ReceiveStockModalProps> = ({
  allItems,
  locations,
  suppliers,
  currency = 'USD',
  onClose,
  onSuccess,
}) => {
  const createPurchaseMutation = useCreatePurchaseMutation();

  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [locationId, setLocationId] = useState<string>(locations[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [lines, setLines] = useState<PurchaseLine[]>([
    {
      inventoryItemId: allItems[0]?.id || '',
      quantity: '10',
      unitCost: allItems[0]?.costPerUnit?.toString() || '0.00',
    },
  ]);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleAddLine = () => {
    setLines(prev => [
      ...prev,
      {
        inventoryItemId: allItems[0]?.id || '',
        quantity: '1',
        unitCost: allItems[0]?.costPerUnit?.toString() || '0.00',
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length === 1) return;
    setLines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: keyof PurchaseLine, value: string) => {
    setLines(prev =>
      prev.map((line, i) => {
        if (i !== idx) return line;
        const updated = { ...line, [field]: value };
        if (field === 'inventoryItemId') {
          const item = allItems.find(it => it.id === value);
          if (item) {
            updated.unitCost = item.costPerUnit.toString();
          }
        }
        return updated;
      })
    );
  };

  const grandTotal = lines.reduce((acc, line) => {
    const q = parseFloat(line.quantity);
    const c = parseFloat(line.unitCost);
    return !isNaN(q) && !isNaN(c) && q > 0 && c >= 0 ? acc + q * c : acc;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      setErrorMessage('At least one item is required.');
      return;
    }

    const payloadItems = [];
    for (const l of lines) {
      if (!l.inventoryItemId) {
        setErrorMessage('Please select an item for all lines.');
        return;
      }
      const q = parseFloat(l.quantity);
      const c = parseFloat(l.unitCost);
      if (isNaN(q) || q <= 0) {
        setErrorMessage('Quantity must be greater than 0 for all items.');
        return;
      }
      if (isNaN(c) || c < 0) {
        setErrorMessage('Unit cost cannot be negative.');
        return;
      }
      payloadItems.push({
        inventoryItemId: l.inventoryItemId,
        quantity: q,
        unitCost: c,
      });
    }

    setErrorMessage(null);

    try {
      await createPurchaseMutation.mutateAsync({
        supplierId: supplierId || undefined,
        locationId: locationId || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        items: payloadItems,
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to receive stock delivery';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-2xl bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-success-soft border border-[#BBF7D0] text-pos-success flex items-center justify-center">
              <Truck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                Receive Stock & Invoices
              </h3>
              <p className="text-xs text-pos-text-muted">
                Add received purchase order items to warehouse / kitchen balance
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

        {/* Scrollable Form Body */}
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

          {/* Supplier, Invoice, Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Supplier
              </label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
              >
                <option value="">-- Direct / Walk-in --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Invoice / Delivery #
              </label>
              <div className="relative">
                <ReceiptText
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-9842"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Destination Storage
              </label>
              <select
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
              >
                <option value="">-- Default Location --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Received Items Lines */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary">
                Received Line Items <span className="text-pos-danger">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs text-pos-primary hover:underline font-semibold flex items-center gap-1"
              >
                <Plus size={14} /> + Add Item Line
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => {
                const q = parseFloat(line.quantity) || 0;
                const c = parseFloat(line.unitCost) || 0;
                const lineTotal = q * c;

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-pos-surface-subtle border border-pos-border grid grid-cols-12 gap-2 items-center"
                  >
                    {/* Item Select */}
                    <div className="col-span-5">
                      <select
                        value={line.inventoryItemId}
                        onChange={e =>
                          handleLineChange(idx, 'inventoryItemId', e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                      >
                        {allItems.map(i => (
                          <option key={i.id} value={i.id}>
                            #{i.itemCode} - {i.name} ({i.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={line.quantity}
                        onChange={e => handleLineChange(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-full px-2 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                      />
                    </div>

                    {/* Unit Cost */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={line.unitCost}
                        onChange={e => handleLineChange(idx, 'unitCost', e.target.value)}
                        placeholder="Cost"
                        className="w-full px-2 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                      />
                    </div>

                    {/* Total & Remove */}
                    <div className="col-span-3 flex items-center justify-between gap-1 pl-1">
                      <span className="font-mono font-bold text-xs text-pos-text truncate">
                        {formatPrice(lineTotal)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={lines.length === 1}
                        className="p-1 rounded text-pos-text-muted hover:text-pos-danger transition-colors disabled:opacity-30"
                        aria-label="Remove line"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grand Total Summary */}
          <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border flex items-center justify-between shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary">
              Total Purchase Cost
            </span>
            <span className="font-mono font-black text-lg text-pos-success">
              {formatPrice(grandTotal)}
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Receiving Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Delivered by refrigerated truck, quality inspected..."
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
              disabled={createPurchaseMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={createPurchaseMutation.isPending}
              disabled={lines.length === 0}
              className="font-bold shadow-xs"
            >
              Receive & Update Stock
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
