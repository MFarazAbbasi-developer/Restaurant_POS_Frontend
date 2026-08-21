import React, { useState } from 'react';
import { InventoryItemRecord, InventoryLocationRecord, SupplierRecord } from '@/types';
import {
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
} from '../hooks/useInventoryData';
import { Button } from '@/components/ui/Button';
import { X, Package, DollarSign, AlertCircle, Tag } from 'lucide-react';

interface InventoryItemModalProps {
  item?: InventoryItemRecord | null;
  locations: InventoryLocationRecord[];
  suppliers: SupplierRecord[];
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const InventoryItemModal: React.FC<InventoryItemModalProps> = ({
  item,
  locations,
  suppliers,
  currency = 'USD',
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(item);
  const createItemMutation = useCreateInventoryItemMutation();
  const updateItemMutation = useUpdateInventoryItemMutation();

  const [itemCode, setItemCode] = useState<string>(item?.itemCode || '');
  const [name, setName] = useState<string>(item?.name || '');
  const [description, setDescription] = useState<string>(item?.description || '');
  const [unit, setUnit] = useState<string>(item?.unit || 'KG');
  const [costPerUnit, setCostPerUnit] = useState<string>(
    item?.costPerUnit !== undefined ? item.costPerUnit.toString() : '0.00'
  );
  const [currentStock, setCurrentStock] = useState<string>(
    item?.currentStock !== undefined ? item.currentStock.toString() : '0'
  );
  const [minStockLevel, setMinStockLevel] = useState<string>(
    item?.minStockLevel !== undefined ? item.minStockLevel.toString() : '5'
  );
  const [targetStockLevel, setTargetStockLevel] = useState<string>(
    item?.targetStockLevel !== undefined && item?.targetStockLevel !== null
      ? item.targetStockLevel.toString()
      : '20'
  );
  const [locationId, setLocationId] = useState<string>(
    item?.locationId || locations[0]?.id || ''
  );
  const [supplierId, setSupplierId] = useState<string>(
    item?.supplierId || suppliers[0]?.id || ''
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const commonUnits = ['KG', 'GRAMS', 'LITERS', 'ML', 'PCS', 'BOX', 'PORTION'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Item / ingredient name is required.');
      return;
    }
    if (!itemCode.trim()) {
      setErrorMessage('Item SKU / Code is required.');
      return;
    }

    const parsedCost = parseFloat(costPerUnit);
    if (isNaN(parsedCost) || parsedCost < 0) {
      setErrorMessage('Please enter a valid non-negative cost per unit.');
      return;
    }

    const parsedStock = parseFloat(currentStock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      setErrorMessage('Please enter a valid non-negative stock quantity.');
      return;
    }

    const parsedMin = parseFloat(minStockLevel);
    if (isNaN(parsedMin) || parsedMin < 0) {
      setErrorMessage('Please enter a valid non-negative minimum stock level.');
      return;
    }

    const parsedTarget = targetStockLevel.trim() ? parseFloat(targetStockLevel) : null;
    if (parsedTarget !== null && (isNaN(parsedTarget) || parsedTarget < 0)) {
      setErrorMessage('Target stock level must be non-negative.');
      return;
    }

    setErrorMessage(null);

    try {
      if (isEditing && item) {
        await updateItemMutation.mutateAsync({
          id: item.id,
          payload: {
            itemCode: itemCode.trim().toUpperCase(),
            name: name.trim(),
            description: description.trim() || null,
            unit: unit.trim().toUpperCase(),
            costPerUnit: parsedCost,
            minStockLevel: parsedMin,
            targetStockLevel: parsedTarget,
            locationId: locationId || null,
            supplierId: supplierId || null,
          },
        });
      } else {
        await createItemMutation.mutateAsync({
          itemCode: itemCode.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || null,
          unit: unit.trim().toUpperCase(),
          costPerUnit: parsedCost,
          currentStock: parsedStock,
          minStockLevel: parsedMin,
          targetStockLevel: parsedTarget,
          locationId: locationId || undefined,
          supplierId: supplierId || undefined,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save inventory item';
      setErrorMessage(msg);
    }
  };

  const isPending = createItemMutation.isPending || updateItemMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-accent/15 border border-pos-accent/30 text-pos-accent flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                {isEditing ? 'Edit Inventory Item' : 'New Raw Ingredient / Item'}
              </h3>
              <p className="text-xs text-pos-text-muted">
                {isEditing
                  ? `Update #${item?.itemCode} stock parameters and unit costs`
                  : 'Add raw material, meat, beverage or packaging item'}
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

        {/* Scrollable Form Body */}
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

          {/* Name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Item Name <span className="text-pos-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Basmati Rice, Boneless Chicken"
                className="w-full px-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pos-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                SKU / Item Code <span className="text-pos-danger">*</span>
              </label>
              <div className="relative">
                <Tag
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="text"
                  required
                  value={itemCode}
                  onChange={e => setItemCode(e.target.value.toUpperCase())}
                  placeholder="e.g. RICE_BASMATI"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent"
                />
              </div>
            </div>
          </div>

          {/* Unit & Unit Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Unit of Measurement <span className="text-pos-danger">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={e => setUnit(e.target.value.toUpperCase())}
                  placeholder="KG"
                  className="w-full px-3 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent"
                />
                <select
                  value=""
                  onChange={e => {
                    if (e.target.value) setUnit(e.target.value);
                  }}
                  className="px-2 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-xs"
                >
                  <option value="">Preset</option>
                  {commonUnits.map(u => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Cost Per Unit ({currency}) <span className="text-pos-danger">*</span>
              </label>
              <div className="relative">
                <DollarSign
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={costPerUnit}
                  onChange={e => setCostPerUnit(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent"
                />
              </div>
            </div>
          </div>

          {/* Stock Levels (Initial, Min, Target) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {!isEditing && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                  Initial Stock ({unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={currentStock}
                  onChange={e => setCurrentStock(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Min Stock Alert ({unit}) <span className="text-pos-danger">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={minStockLevel}
                onChange={e => setMinStockLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent text-pos-warning"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Target Stock ({unit})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={targetStockLevel}
                onChange={e => setTargetStockLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent text-pos-success"
              />
            </div>
          </div>

          {/* Location & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Storage Location
              </label>
              <select
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-medium"
              >
                <option value="">-- None / Default --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.code ? `(${loc.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Primary Supplier
              </label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-medium"
              >
                <option value="">-- None / Direct --</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Description & Specifications (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Grade A premium long grain basmati rice, 50kg sacks..."
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
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isPending}
              disabled={!name.trim() || !itemCode.trim()}
              className="font-bold shadow-sm"
            >
              {isEditing ? 'Save Changes' : 'Create Inventory Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
