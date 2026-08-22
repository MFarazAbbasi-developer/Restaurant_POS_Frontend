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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger flex items-center justify-center">
              <Trash2 size={18} />
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

          {/* Item Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Select Inventory Item <span className="text-pos-danger">*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={e => handleItemChange(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
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
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
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
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
              />
            </div>
          </div>

          {/* Financial Loss Calculation Banner */}
          <div className="p-3.5 rounded-lg bg-pos-danger-soft border border-[#FECACA] flex items-center justify-between text-xs">
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Specific Incident / Detail
              </label>
              <input
                type="text"
                value={itemReason}
                onChange={e => setItemReason(e.target.value)}
                placeholder="e.g. Freezer power outage incident"
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Storage Location
              </label>
              <select
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Disposed as per health & hygiene guidelines..."
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
              className="font-bold shadow-xs"
            >
              Confirm & Post Wastage
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
