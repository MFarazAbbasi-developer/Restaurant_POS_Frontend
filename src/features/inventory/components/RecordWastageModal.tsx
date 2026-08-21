import React, { useState } from 'react';
import { InventoryItemRecord, InventoryLocationRecord } from '@/types';
import { useCreateStockWastageMutation } from '../hooks/useInventoryData';
import { Button } from '@/components/ui/Button';
import { X, Trash2, AlertCircle, DollarSign } from 'lucide-react';

interface RecordWastageModalProps {
  initialItem?: InventoryItemRecord | null;
  allItems: InventoryItemRecord[];
  locations: InventoryLocationRecord[];
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordWastageModal: React.FC<RecordWastageModalProps> = ({
  initialItem,
  allItems,
  locations,
  currency = 'USD',
  onClose,
  onSuccess,
}) => {
  const createWastageMutation = useCreateStockWastageMutation();

  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialItem?.id || allItems[0]?.id || ''
  );
  const [locationId, setLocationId] = useState<string>(
    initialItem?.locationId || locations[0]?.id || ''
  );
  const [reason, setReason] = useState<
    'EXPIRED' | 'SPOILED' | 'PREPARATION_ERROR' | 'DAMAGED' | 'CONTAMINATED' | 'OTHER'
  >('EXPIRED');
  const [quantity, setQuantity] = useState<string>('1');
  const [itemReason, setItemReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedItem = allItems.find(i => i.id === selectedItemId) || initialItem;

  const parsedQty = parseFloat(quantity);
  const unitCost = selectedItem?.costPerUnit || 0;
  const totalWastedCost = !isNaN(parsedQty) && parsedQty > 0 ? parsedQty * unitCost : 0;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    const it = allItems.find(i => i.id === itemId);
    if (it?.locationId) {
      setLocationId(it.locationId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      setErrorMessage('Please select an inventory item.');
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setErrorMessage('Wasted quantity must be greater than 0.');
      return;
    }

    setErrorMessage(null);

    try {
      await createWastageMutation.mutateAsync({
        locationId: locationId || undefined,
        reason,
        notes: notes.trim() || undefined,
        items: [
          {
            inventoryItemId: selectedItemId,
            quantity: parsedQty,
            unitCost,
            itemReason: itemReason.trim() || undefined,
          },
        ],
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to record stock wastage';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-danger/15 border border-pos-danger/30 text-pos-danger flex items-center justify-center">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                Record Stock Wastage & Spoilage
              </h3>
              <p className="text-xs text-pos-text-muted">
                Deduct damaged, expired, or spoiled ingredients from inventory
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar"
        >
          {errorMessage && (
            <div className="p-3 rounded-xl bg-pos-danger/10 border border-pos-danger/30 text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Item Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Select Inventory Item <span className="text-pos-danger">*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={e => handleItemChange(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-semibold"
            >
              {allItems.map(i => (
                <option key={i.id} value={i.id}>
                  #{i.itemCode} - {i.name} (In stock: {i.currentStock} {i.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Reason & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Wastage Reason Category <span className="text-pos-danger">*</span>
              </label>
              <select
                value={reason}
                onChange={e =>
                  setReason(
                    e.target.value as
                      | 'EXPIRED'
                      | 'SPOILED'
                      | 'PREPARATION_ERROR'
                      | 'DAMAGED'
                      | 'CONTAMINATED'
                      | 'OTHER'
                  )
                }
                className="w-full px-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-semibold"
              >
                <option value="EXPIRED">Expired Past Best-Before</option>
                <option value="SPOILED">Spoiled / Rotten</option>
                <option value="PREPARATION_ERROR">Kitchen Prep Error / Burned</option>
                <option value="DAMAGED">Dropped / Damaged Packaging</option>
                <option value="CONTAMINATED">Contaminated / Unfit</option>
                <option value="OTHER">Other Reason</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Quantity Wasted ({selectedItem?.unit}){' '}
                <span className="text-pos-danger">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="1.0"
                className="w-full px-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pos-accent"
              />
            </div>
          </div>

          {/* Financial Loss Calculation Banner */}
          <div className="p-3.5 rounded-xl bg-pos-danger/10 border border-pos-danger/20 flex items-center justify-between text-xs">
            <div>
              <span className="text-pos-text font-bold block">Estimated Loss Value</span>
              <span className="text-pos-text-muted text-[11px]">
                Unit Cost: {formatPrice(unitCost)} / {selectedItem?.unit}
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono font-black text-base text-pos-danger">
              <DollarSign size={16} />
              <span>{formatPrice(totalWastedCost)}</span>
            </div>
          </div>

          {/* Specific Item Reason & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Specific Incident / Detail
              </label>
              <input
                type="text"
                value={itemReason}
                onChange={e => setItemReason(e.target.value)}
                placeholder="e.g. Freezer power outage incident"
                className="w-full px-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Storage Location
              </label>
              <select
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-medium"
              >
                <option value="">-- Main Location --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Disposed as per health & hygiene guidelines..."
              className="w-full p-3 rounded-xl bg-pos-bg border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent resize-none font-medium"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-pos-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={createWastageMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              isLoading={createWastageMutation.isPending}
              disabled={!selectedItemId || !quantity}
              className="font-bold shadow-sm"
            >
              Confirm & Post Wastage
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
