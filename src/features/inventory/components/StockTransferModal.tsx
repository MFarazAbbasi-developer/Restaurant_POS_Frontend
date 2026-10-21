import React, { useMemo, useState } from 'react';
import { InventoryItemRecord, InventoryLocationRecord } from '@/types';
import { ApiError } from '@/core/api/errors';
import { useCreateStockTransferMutation } from '../hooks/useInventoryData';
import { Button } from '@/components/ui/Button';
import { AlertCircle, ArrowRightLeft, CheckCircle2, X } from 'lucide-react';

interface StockTransferModalProps {
  allItems: InventoryItemRecord[];
  locations: InventoryLocationRecord[];
  initialItem?: InventoryItemRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  allItems,
  locations,
  initialItem,
  onClose,
  onSuccess,
}) => {
  const createTransferMutation = useCreateStockTransferMutation();
  const activeLocations = useMemo(
    () => locations.filter(loc => loc.isActive !== false),
    [locations]
  );

  const [fromLocationId, setFromLocationId] = useState<string>(
    initialItem?.locationId || activeLocations[0]?.id || ''
  );
  const [toLocationId, setToLocationId] = useState<string>(() => {
    const fallback = activeLocations.find(
      loc => loc.id !== (initialItem?.locationId || activeLocations[0]?.id)
    );
    return fallback?.id || '';
  });
  const [selectedItemId, setSelectedItemId] = useState<string>(initialItem?.id || '');
  const [quantity, setQuantity] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const itemsAtSource = useMemo(() => {
    if (!fromLocationId) return [];
    return allItems.filter(
      item => item.isActive !== false && item.locationId === fromLocationId
    );
  }, [allItems, fromLocationId]);

  const selectedItem =
    itemsAtSource.find(i => i.id === selectedItemId) ||
    allItems.find(i => i.id === selectedItemId) ||
    initialItem ||
    null;

  const parsedQty = parseFloat(quantity);

  const handleFromLocationChange = (id: string) => {
    setFromLocationId(id);
    setSelectedItemId('');
    setQuantity('1');
    if (toLocationId === id) {
      const other = activeLocations.find(loc => loc.id !== id);
      setToLocationId(other?.id || '');
    }
  };

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = itemsAtSource.find(i => i.id === itemId);
    if (item && item.currentStock > 0) {
      setQuantity(Math.min(1, item.currentStock).toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fromLocationId || !toLocationId) {
      setErrorMessage('Select both source and destination locations.');
      return;
    }
    if (fromLocationId === toLocationId) {
      setErrorMessage('Destination location must be different from source location.');
      return;
    }
    if (!selectedItemId) {
      setErrorMessage('Select an inventory item to transfer.');
      return;
    }
    if (!selectedItem || selectedItem.locationId !== fromLocationId) {
      setErrorMessage(
        'Selected item is not assigned to the source location. Only stock at the source can be transferred.'
      );
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setErrorMessage('Transfer quantity must be greater than 0.');
      return;
    }
    if (parsedQty > selectedItem.currentStock) {
      setErrorMessage(
        `Insufficient stock. Available: ${selectedItem.currentStock} ${selectedItem.unit}.`
      );
      return;
    }

    try {
      const transfer = await createTransferMutation.mutateAsync({
        fromLocationId,
        toLocationId,
        notes: notes.trim() || undefined,
        items: [
          {
            inventoryItemId: selectedItemId,
            quantity: parsedQty,
          },
        ],
      });
      setSuccessMessage(
        `Transfer ${transfer.transferNumber} recorded successfully.`
      );
      onSuccess();
      window.setTimeout(() => onClose(), 600);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to complete stock transfer.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 select-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-transfer-title"
        className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h3 id="stock-transfer-title" className="text-base font-bold text-pos-text">
                Transfer Stock Between Locations
              </h3>
              <p className="text-xs text-pos-text-muted">
                Moves are recorded in the ledger; quantity must not exceed available stock
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 overflow-y-auto">
          {errorMessage && (
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-pos-success-soft border border-[#BBF7D0] text-pos-success text-xs font-medium">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted block mb-1">
                From Location *
              </label>
              <select
                value={fromLocationId}
                onChange={e => handleFromLocationChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-sm text-pos-text focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
              >
                <option value="">Select source...</option>
                {activeLocations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                    {loc.isDefault ? ' (Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted block mb-1">
                To Location *
              </label>
              <select
                value={toLocationId}
                onChange={e => setToLocationId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-sm text-pos-text focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
              >
                <option value="">Select destination...</option>
                {activeLocations
                  .filter(loc => loc.id !== fromLocationId)
                  .map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                      {loc.isDefault ? ' (Default)' : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted block mb-1">
              Item at Source *
            </label>
            <select
              value={selectedItemId}
              onChange={e => handleItemChange(e.target.value)}
              disabled={!fromLocationId}
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-sm text-pos-text focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary disabled:opacity-60"
            >
              <option value="">
                {!fromLocationId
                  ? 'Select a source location first'
                  : itemsAtSource.length === 0
                    ? 'No items assigned to this location'
                    : 'Select item...'}
              </option>
              {itemsAtSource.map(item => (
                <option key={item.id} value={item.id}>
                  #{item.itemCode} — {item.name} ({item.currentStock} {item.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted block mb-1">
              Quantity *
            </label>
            <input
              type="number"
              min="0.0001"
              step="any"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-sm font-mono text-pos-text focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
            />
            {selectedItem && (
              <p className="text-[11px] text-pos-text-muted mt-1">
                Available at source: {selectedItem.currentStock} {selectedItem.unit}
              </p>
            )}
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted block mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="e.g. Daily kitchen replenishment"
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-sm text-pos-text focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createTransferMutation.isPending || Boolean(successMessage)}
            >
              {createTransferMutation.isPending ? 'Transferring...' : 'Confirm Transfer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
