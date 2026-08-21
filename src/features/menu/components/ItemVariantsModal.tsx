import React, { useState } from 'react';
import { MenuItemRecord } from '@/types';
import { useCreateVariantMutation, useDeleteVariantMutation } from '../hooks/useMenuData';
import { Button } from '@/components/ui/Button';
import { X, Layers, Plus, Trash2, DollarSign, AlertCircle } from 'lucide-react';

interface ItemVariantsModalProps {
  item: MenuItemRecord;
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ItemVariantsModal: React.FC<ItemVariantsModalProps> = ({
  item,
  currency = 'USD',
  onClose,
  onSuccess,
}) => {
  const createVariantMutation = useCreateVariantMutation();
  const deleteVariantMutation = useDeleteVariantMutation();

  const [name, setName] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Variant name is required.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMessage('Please enter a valid non-negative variant price.');
      return;
    }

    setErrorMessage(null);

    try {
      await createVariantMutation.mutateAsync({
        itemId: item.id,
        payload: {
          name: name.trim(),
          price: parsedPrice,
          sortOrder: item.variants?.length || 0,
          isActive: true,
        },
      });
      setName('');
      setPrice('');
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add portion variant';
      setErrorMessage(msg);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!window.confirm('Are you sure you want to delete this portion variant?')) {
      return;
    }

    try {
      await deleteVariantMutation.mutateAsync(variantId);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete variant';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-info/15 border border-pos-info/30 text-pos-info flex items-center justify-center">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                Portion & Size Variants
              </h3>
              <p className="text-xs text-pos-text-muted">
                {item.name} • Base Price: {formatPrice(item.basePrice)}
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

          {/* Add Variant Form */}
          <form
            onSubmit={handleAddVariant}
            className="p-4 rounded-xl bg-pos-bg border border-pos-border space-y-3"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-pos-text flex items-center gap-1.5">
              <Plus size={14} className="text-pos-accent" />
              <span>Add New Portion Variant</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-pos-text-muted mb-1">
                  Portion Name (e.g. Regular, Large, Double)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Large / Full Plate"
                  className="w-full px-3 py-2 rounded-xl bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-pos-text-muted mb-1">
                  Variant Price ({currency})
                </label>
                <div className="relative">
                  <DollarSign
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="0.00"
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
                isLoading={createVariantMutation.isPending}
                disabled={!name.trim() || !price}
                className="font-bold text-xs"
              >
                <Plus size={14} className="mr-1" />
                Add Portion Variant
              </Button>
            </div>
          </form>

          {/* Current Variants List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-pos-text mb-2.5 flex items-center justify-between">
              <span>Configured Portions</span>
              <span className="text-[11px] text-pos-text-muted font-normal">
                {item.variants?.length || 0} variants
              </span>
            </h4>

            {item.variants && item.variants.length > 0 ? (
              <div className="space-y-2">
                {item.variants.map(v => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-pos-surface border border-pos-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-pos-text block">{v.name}</span>
                      <span className="text-[11px] text-pos-text-muted">
                        Active portion
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-pos-accent">
                        {formatPrice(v.price)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(v.id)}
                        disabled={deleteVariantMutation.isPending}
                        className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger/10 transition-colors"
                        aria-label="Delete variant"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-pos-bg border border-pos-border rounded-xl text-xs text-pos-text-muted">
                No custom portion variants added yet. This item will sell at its base
                price ({formatPrice(item.basePrice)}).
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
