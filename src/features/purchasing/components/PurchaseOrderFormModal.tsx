import React, { useState } from 'react';
import {
  PurchasingSupplierRecord,
  InventoryItemRecord,
  InventoryLocationRecord,
  PurchasingOrderRecord,
} from '@/types';
import {
  useCreatePurchasingOrderMutation,
  useUpdatePurchasingOrderMutation,
} from '../hooks/usePurchasingData';
import { Button } from '@/components/ui/Button';
import {
  X,
  FileSpreadsheet,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { formatPrice as centralizedFormatPrice } from '@/utils/format';

interface PurchaseOrderFormModalProps {
  order?: PurchasingOrderRecord | null;
  suppliers: PurchasingSupplierRecord[];
  inventoryItems: InventoryItemRecord[];
  locations: InventoryLocationRecord[];
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormLineItem {
  id: string; // temporary key
  inventoryItemId: string;
  quantity: string;
  unitCost: string;
  taxRate: string;
  discountRate: string;
}

export const PurchaseOrderFormModal: React.FC<PurchaseOrderFormModalProps> = ({
  order,
  suppliers,
  inventoryItems,
  locations,
  currency = 'PKR',
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(order);
  const createMutation = useCreatePurchasingOrderMutation();
  const updateMutation = useUpdatePurchasingOrderMutation();

  const [supplierId, setSupplierId] = useState<string>(
    order?.supplierId || suppliers[0]?.id || ''
  );
  const [locationId, setLocationId] = useState<string>(
    order?.locationId || locations[0]?.id || ''
  );
  const [invoiceNumber, setInvoiceNumber] = useState<string>(order?.invoiceNumber || '');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    order?.expectedDeliveryDate
      ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0]
      : ''
  );
  const [notes, setNotes] = useState<string>(order?.notes || '');

  // Line items state
  const [lineItems, setLineItems] = useState<FormLineItem[]>(() => {
    if (order && order.items.length > 0) {
      return order.items.map(it => ({
        id: it.id,
        inventoryItemId: it.inventoryItemId,
        quantity: it.quantity.toString(),
        unitCost: it.unitCost.toString(),
        taxRate: it.taxRate.toString(),
        discountRate: it.discountRate.toString(),
      }));
    }
    return [
      {
        id: 'item-1',
        inventoryItemId: inventoryItems[0]?.id || '',
        quantity: '1',
        unitCost: (inventoryItems[0]?.costPerUnit || 0).toString(),
        taxRate: '0',
        discountRate: '0',
      },
    ];
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddItem = () => {
    setLineItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        inventoryItemId: inventoryItems[0]?.id || '',
        quantity: '1',
        unitCost: (inventoryItems[0]?.costPerUnit || 0).toString(),
        taxRate: '0',
        discountRate: '0',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemFieldChange = (
    index: number,
    field: keyof FormLineItem,
    value: string
  ) => {
    setLineItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // Auto-populate unit cost if item selection changed
      if (field === 'inventoryItemId') {
        const found = inventoryItems.find(it => it.id === value);
        if (found) {
          item.unitCost = found.costPerUnit.toString();
        }
      }

      updated[index] = item;
      return updated;
    });
  };

  // Financial Calculations
  const calculatedItems = lineItems.map(item => {
    const qty = parseFloat(item.quantity) || 0;
    const cost = parseFloat(item.unitCost) || 0;
    const taxRate = parseFloat(item.taxRate) || 0;
    const discRate = parseFloat(item.discountRate) || 0;

    const baseAmount = qty * cost;
    const discountAmount = (baseAmount * discRate) / 100;
    const taxableAmount = baseAmount - discountAmount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const totalAmount = taxableAmount + taxAmount;

    return {
      qty,
      cost,
      baseAmount,
      discountAmount,
      taxAmount,
      totalAmount,
    };
  });

  const subtotal = calculatedItems.reduce((acc, it) => acc + it.baseAmount, 0);
  const totalDiscount = calculatedItems.reduce((acc, it) => acc + it.discountAmount, 0);
  const totalTax = calculatedItems.reduce((acc, it) => acc + it.taxAmount, 0);
  const grandTotal = calculatedItems.reduce((acc, it) => acc + it.totalAmount, 0);

  const formatPrice = (val: number) => {
    return centralizedFormatPrice(val, currency);
  };

  const handleSubmit = async (submitStatus: 'DRAFT' | 'ORDERED') => {
    if (lineItems.length === 0) {
      setErrorMessage('Please add at least one line item.');
      return;
    }

    const payloadItems = lineItems.map(it => ({
      inventoryItemId: it.inventoryItemId,
      quantity: parseFloat(it.quantity) || 1,
      unitCost: parseFloat(it.unitCost) || 0,
      taxRate: parseFloat(it.taxRate) || 0,
      discountRate: parseFloat(it.discountRate) || 0,
    }));

    if (payloadItems.some(it => !it.inventoryItemId || it.quantity <= 0)) {
      setErrorMessage('All line items must have a valid item and quantity > 0.');
      return;
    }

    setErrorMessage(null);

    try {
      if (isEditing && order) {
        await updateMutation.mutateAsync({
          id: order.id,
          payload: {
            supplierId: supplierId || null,
            locationId: locationId || null,
            invoiceNumber: invoiceNumber.trim() || null,
            expectedDeliveryDate: expectedDeliveryDate || null,
            notes: notes.trim() || null,
            items: payloadItems,
          },
        });
      } else {
        await createMutation.mutateAsync({
          supplierId: supplierId || null,
          locationId: locationId || null,
          invoiceNumber: invoiceNumber.trim() || null,
          expectedDeliveryDate: expectedDeliveryDate || null,
          status: submitStatus,
          notes: notes.trim() || null,
          items: payloadItems,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save purchase order';
      setErrorMessage(msg);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-4xl bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                {isEditing ? `Edit PO #${order?.orderNumber}` : 'New Purchase Order'}
              </h3>
              <p className="text-xs text-pos-text-muted">
                {isEditing
                  ? 'Update line items, expected delivery, and pricing'
                  : 'Draft procurement order for ingredient replenishment'}
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
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Supplier, Location & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Supplier / Vendor
              </label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
              >
                <option value="">-- No Supplier / Direct --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Receiving Location
              </label>
              <select
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
              >
                <option value="">-- Default Kitchen --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Expected Delivery Date
              </label>
              <div className="relative">
                <Calendar
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={e => setExpectedDeliveryDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Invoice / Ref Number
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
                  placeholder="e.g. INV-9942"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs font-mono focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary">
                Purchase Order Line Items ({lineItems.length})
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-pos-primary hover:underline font-semibold flex items-center gap-1"
              >
                <Plus size={13} /> Add Item Row
              </button>
            </div>

            <div className="rounded-lg border border-pos-border overflow-hidden bg-pos-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-pos-border bg-pos-surface-subtle text-pos-text-muted font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3 min-w-[180px]">Inventory Item</th>
                      <th className="py-2.5 px-3 w-24">Qty</th>
                      <th className="py-2.5 px-3 w-28">Unit Cost ({currency})</th>
                      <th className="py-2.5 px-3 w-20">Disc %</th>
                      <th className="py-2.5 px-3 w-20">Tax %</th>
                      <th className="py-2.5 px-3 w-28 text-right">Line Total</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pos-border">
                    {lineItems.map((item, index) => {
                      const calc = calculatedItems[index];
                      const selectedInv = inventoryItems.find(
                        it => it.id === item.inventoryItemId
                      );

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-pos-surface-subtle transition-colors"
                        >
                          {/* Item Select */}
                          <td className="p-2">
                            <select
                              value={item.inventoryItemId}
                              onChange={e =>
                                handleItemFieldChange(
                                  index,
                                  'inventoryItemId',
                                  e.target.value
                                )
                              }
                              className="w-full px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
                            >
                              {inventoryItems.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.name} ({inv.unit})
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Quantity */}
                          <td className="p-2">
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                required
                                value={item.quantity}
                                onChange={e =>
                                  handleItemFieldChange(index, 'quantity', e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary text-right pr-6 shadow-xs"
                              />
                              <span className="absolute right-2 text-[10px] text-pos-text-muted pointer-events-none">
                                {selectedInv?.unit}
                              </span>
                            </div>
                          </td>

                          {/* Unit Cost */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              required
                              value={item.unitCost}
                              onChange={e =>
                                handleItemFieldChange(index, 'unitCost', e.target.value)
                              }
                              className="w-full px-2 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary text-right shadow-xs"
                            />
                          </td>

                          {/* Discount % */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discountRate}
                              onChange={e =>
                                handleItemFieldChange(
                                  index,
                                  'discountRate',
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary text-right shadow-xs"
                            />
                          </td>

                          {/* Tax % */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.taxRate}
                              onChange={e =>
                                handleItemFieldChange(index, 'taxRate', e.target.value)
                              }
                              className="w-full px-2 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary text-right shadow-xs"
                            />
                          </td>

                          {/* Line Total */}
                          <td className="p-2 text-right font-mono font-bold text-pos-text">
                            {formatPrice(calc?.totalAmount || 0)}
                          </td>

                          {/* Remove */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              disabled={lineItems.length <= 1}
                              onClick={() => handleRemoveItem(index)}
                              className="p-1 rounded-md text-pos-text-muted hover:text-pos-danger disabled:opacity-30 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Notes & Summary Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Purchase Notes / Special Instructions
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Standard delivery at rear entrance before 11 AM..."
                className="w-full p-2.5 rounded-lg bg-pos-surface border border-pos-border text-pos-text placeholder-pos-text-muted text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none font-medium shadow-xs"
              />
            </div>

            {/* Financial Summary Tile */}
            <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-2 text-xs">
              <div className="flex items-center justify-between text-pos-text-muted">
                <span>Subtotal (Base Total)</span>
                <span className="font-mono">{formatPrice(subtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex items-center justify-between text-pos-danger">
                  <span>Total Discount</span>
                  <span className="font-mono">-{formatPrice(totalDiscount)}</span>
                </div>
              )}
              {totalTax > 0 && (
                <div className="flex items-center justify-between text-pos-text-muted">
                  <span>Estimated Tax</span>
                  <span className="font-mono">+{formatPrice(totalTax)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-pos-border flex items-center justify-between text-sm font-bold text-pos-text">
                <span>Grand Total</span>
                <span className="font-mono text-pos-primary text-base font-bold">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-pos-border bg-pos-surface flex items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>

          {!isEditing && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              isLoading={isPending}
              onClick={() => handleSubmit('DRAFT')}
              className="font-semibold"
            >
              Save as Draft
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={isPending}
            onClick={() => handleSubmit('ORDERED')}
            className="font-bold shadow-xs"
          >
            {isEditing ? 'Save PO Changes' : 'Create & Send Order'}
          </Button>
        </div>
      </div>
    </div>
  );
};
