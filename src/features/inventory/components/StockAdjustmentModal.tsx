import React, { useState } from 'react';
import { InventoryItemRecord, InventoryLocationRecord } from '@/types';
import { useCreateStockAdjustmentMutation } from '../hooks/useInventoryData';
import { Button } from '@/components/ui/Button';
import { X, Sliders, AlertCircle, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StockAdjustmentModalProps {
  initialItem?: InventoryItemRecord | null;
  allItems: InventoryItemRecord[];
  locations: InventoryLocationRecord[];
  onClose: () => void;
  onSuccess: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  initialItem,
  allItems,
  locations,
  onClose,
  onSuccess,
}) => {
  const createAdjustmentMutation = useCreateStockAdjustmentMutation();

  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialItem?.id || allItems[0]?.id || ''
  );
  const [locationId, setLocationId] = useState<string>(
    initialItem?.locationId || locations[0]?.id || ''
  );
  const [actualStock, setActualStock] = useState<string>(
    initialItem?.currentStock !== undefined ? initialItem.currentStock.toString() : '0'
  );
  const [reason, setReason] = useState<string>('Physical stock count audit');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedItem = allItems.find(i => i.id === selectedItemId) || initialItem;

  const currentSystemStock = selectedItem ? selectedItem.currentStock : 0;
  const parsedActual = parseFloat(actualStock);
  const variance = !isNaN(parsedActual) ? parsedActual - currentSystemStock : 0;

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = allItems.find(i => i.id === itemId);
    if (item) {
      setActualStock(item.currentStock.toString());
      if (item.locationId) {
        setLocationId(item.locationId);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      setErrorMessage('Please select an inventory item.');
      return;
    }
    if (isNaN(parsedActual) || parsedActual < 0) {
      setErrorMessage('Please enter a valid non-negative counted stock.');
      return;
    }
    if (!reason.trim() || reason.trim().length < 3) {
      setErrorMessage('Please provide a descriptive reason (minimum 3 characters).');
      return;
    }

    setErrorMessage(null);

    try {
      await createAdjustmentMutation.mutateAsync({
        locationId: locationId || undefined,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
        items: [
          {
            inventoryItemId: selectedItemId,
            actualStock: parsedActual,
          },
        ],
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to record stock adjustment';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                Stock Adjustment & Audit
              </h3>
              <p className="text-xs text-pos-text-muted">
                Reconcile physical inventory count against system stock
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

        {/* Scrollable Body */}
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
                  #{i.itemCode} - {i.name} (Current: {i.currentStock} {i.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Stock Counts & Variance Card */}
          <div className="p-4 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-md bg-pos-surface border border-pos-border shadow-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted block">
                  System Recorded Stock
                </span>
                <span className="text-lg font-mono font-bold text-pos-text mt-1 block">
                  {currentSystemStock} {selectedItem?.unit}
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary mb-1">
                  Actual Counted Stock <span className="text-pos-danger">*</span>
                </label>
                <div className="relative">
                  <Scale
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={actualStock}
                    onChange={e => setActualStock(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-md bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Calculated Variance */}
            <div
              className={cn(
                'p-3 rounded-md flex items-center justify-between border text-xs font-semibold',
                variance > 0
                  ? 'bg-pos-success-soft border-[#BBF7D0] text-pos-success'
                  : variance < 0
                    ? 'bg-pos-danger-soft border-[#FECACA] text-pos-danger'
                    : 'bg-pos-surface border-pos-border text-pos-text-muted'
              )}
            >
              <div className="flex items-center gap-1.5">
                {variance > 0 ? (
                  <TrendingUp size={16} />
                ) : variance < 0 ? (
                  <TrendingDown size={16} />
                ) : (
                  <Scale size={16} />
                )}
                <span>Stock Discrepancy (Variance)</span>
              </div>

              <span className="font-mono font-bold text-sm">
                {variance > 0 ? `+${variance.toFixed(2)}` : variance.toFixed(2)}{' '}
                {selectedItem?.unit}
              </span>
            </div>
          </div>

          {/* Reason & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Adjustment Reason <span className="text-pos-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Month-end physical count"
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Location (Optional)
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
              Additional Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Recounted with kitchen manager..."
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
              disabled={createAdjustmentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={createAdjustmentMutation.isPending}
              disabled={!selectedItemId || !reason.trim()}
              className="font-bold shadow-xs"
            >
              Post Stock Adjustment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
