import React, { useState } from 'react';
import { InventoryItemRecord, MenuItemRecord } from '@/types';
import {
  useMenuItemRecipesQuery,
  useUpsertRecipeMutation,
  useDeleteRecipeMutation,
} from '../hooks/useInventoryData';
import { Button } from '@/components/ui/Button';
import { X, ChefHat, Plus, Trash2, AlertCircle, Percent } from 'lucide-react';

interface RecipeManagerModalProps {
  menuItem: MenuItemRecord;
  allItems: InventoryItemRecord[];
  onClose: () => void;
  onSuccess?: () => void;
}

export const RecipeManagerModal: React.FC<RecipeManagerModalProps> = ({
  menuItem,
  allItems,
  onClose,
  onSuccess,
}) => {
  const { data: recipeData, isLoading, refetch } = useMenuItemRecipesQuery(menuItem.id);

  const upsertMutation = useUpsertRecipeMutation();
  const deleteMutation = useDeleteRecipeMutation();

  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string>(
    allItems[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<string>('0.25');
  const [wastePercentage, setWastePercentage] = useState<string>('0');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedInventoryItem = allItems.find(i => i.id === selectedInventoryItemId);

  const recipes = recipeData?.recipes || [];

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventoryItemId) {
      setErrorMessage('Please select a raw material ingredient.');
      return;
    }

    const q = parseFloat(quantity);
    if (isNaN(q) || q <= 0) {
      setErrorMessage('Ingredient quantity must be greater than 0.');
      return;
    }

    const w = parseFloat(wastePercentage);
    if (isNaN(w) || w < 0 || w > 100) {
      setErrorMessage('Waste percentage must be between 0% and 100%.');
      return;
    }

    setErrorMessage(null);

    try {
      await upsertMutation.mutateAsync({
        menuItemId: menuItem.id,
        inventoryItemId: selectedInventoryItemId,
        quantity: q,
        wastePercentage: w,
      });
      setQuantity('0.25');
      setWastePercentage('0');
      refetch();
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to link recipe ingredient';
      setErrorMessage(msg);
    }
  };

  const handleDeleteIngredient = async (recipeId: string) => {
    if (!window.confirm('Remove this ingredient from the dish recipe?')) return;
    try {
      await deleteMutation.mutateAsync({
        id: recipeId,
        menuItemId: menuItem.id,
      });
      refetch();
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to remove recipe ingredient';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-accent/15 border border-pos-accent/30 text-pos-accent flex items-center justify-center">
              <ChefHat size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                Recipe & Bill of Materials (BOM)
              </h3>
              <p className="text-xs text-pos-text-muted">
                {menuItem.name} (#{menuItem.itemCode})
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

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-pos-danger/10 border border-pos-danger/30 text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Add Ingredient Form */}
          <form
            onSubmit={handleAddIngredient}
            className="p-4 rounded-xl bg-pos-bg border border-pos-border space-y-3"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-pos-text flex items-center gap-1.5">
              <Plus size={14} className="text-pos-accent" />
              <span>Add Raw Material Ingredient</span>
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-pos-text-muted mb-1">
                Select Ingredient
              </label>
              <select
                value={selectedInventoryItemId}
                onChange={e => setSelectedInventoryItemId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-semibold"
              >
                {allItems.map(i => (
                  <option key={i.id} value={i.id}>
                    #{i.itemCode} - {i.name} ({i.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-pos-text-muted mb-1">
                  Qty per Portion ({selectedInventoryItem?.unit || 'Units'})
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="0.25"
                  className="w-full px-3 py-2 rounded-xl bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-pos-text-muted mb-1">
                  Waste / Loss Margin (%)
                </label>
                <div className="relative">
                  <Percent
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={wastePercentage}
                    onChange={e => setWastePercentage(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={upsertMutation.isPending}
                disabled={!selectedInventoryItemId || !quantity}
                className="font-bold text-xs"
              >
                <Plus size={14} className="mr-1" />
                Add to Recipe
              </Button>
            </div>
          </form>

          {/* Current Recipe Ingredients List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-pos-text mb-2.5 flex items-center justify-between">
              <span>Configured Recipe Ingredients</span>
              <span className="text-[11px] text-pos-text-muted font-normal">
                {recipes.length} ingredients
              </span>
            </h4>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-pos-text-muted">
                Loading recipe components...
              </div>
            ) : recipes.length > 0 ? (
              <div className="space-y-2">
                {recipes.map(rec => {
                  const ing = rec.inventoryItem;
                  return (
                    <div
                      key={rec.id}
                      className="p-3 rounded-xl bg-pos-surface border border-pos-border flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-pos-text block">
                          {ing?.name || 'Raw Ingredient'}
                        </span>
                        <span className="text-[11px] text-pos-text-muted">
                          SKU: #{ing?.itemCode}
                          {rec.wastePercentage > 0 && (
                            <> • Waste: +{rec.wastePercentage}%</>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs text-pos-accent">
                          {rec.quantity} {ing?.unit}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteIngredient(rec.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger/10 transition-colors"
                          aria-label="Remove ingredient"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-pos-bg border border-pos-border rounded-xl text-xs text-pos-text-muted">
                No raw material ingredients linked to this dish yet. Add ingredients above
                to automatically deduct stock on sale.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pos-border bg-pos-header flex items-center justify-end shrink-0">
          <Button variant="secondary" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
