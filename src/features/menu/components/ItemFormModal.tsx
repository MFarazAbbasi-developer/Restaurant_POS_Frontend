import React, { useState } from 'react';
import { MenuItemRecord, CategoryWithCount } from '@/types';
import {
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
} from '../hooks/useMenuData';
import { Button } from '@/components/ui/Button';
import { X, UtensilsCrossed, DollarSign, AlertCircle, Tag } from 'lucide-react';

interface ItemFormModalProps {
  item?: MenuItemRecord | null;
  categories: CategoryWithCount[];
  defaultCategoryId?: string;
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  item,
  categories,
  defaultCategoryId,
  currency = 'PKR',
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(item);
  const createItemMutation = useCreateMenuItemMutation();
  const updateItemMutation = useUpdateMenuItemMutation();

  const [categoryId, setCategoryId] = useState<string>(
    item?.categoryId || defaultCategoryId || categories[0]?.id || ''
  );
  const [name, setName] = useState<string>(item?.name || '');
  const [urduName, setUrduName] = useState<string>(item?.urduName || '');
  const [itemCode, setItemCode] = useState<string>(item?.itemCode || '');
  const [basePrice, setBasePrice] = useState<string>(
    item?.basePrice !== undefined ? item.basePrice.toString() : '0.00'
  );
  const [taxRate, setTaxRate] = useState<string>(
    item?.taxRate !== undefined && item?.taxRate !== null ? item.taxRate.toString() : '0'
  );
  const [description, setDescription] = useState<string>(item?.description || '');
  const [isAvailable, setIsAvailable] = useState<boolean>(item?.isAvailable ?? true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-generate itemCode if empty and creating
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && !itemCode) {
      const generated = val
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .slice(0, 15);
      if (generated) {
        setItemCode(generated);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Item name is required.');
      return;
    }
    if (!itemCode.trim()) {
      setErrorMessage('Item code is required.');
      return;
    }
    if (!categoryId) {
      setErrorMessage('Please select a category for this item.');
      return;
    }

    const parsedPrice = parseFloat(basePrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMessage('Please enter a valid non-negative base price.');
      return;
    }

    const parsedTax = taxRate.trim() ? parseFloat(taxRate) : null;
    if (parsedTax !== null && (isNaN(parsedTax) || parsedTax < 0 || parsedTax > 100)) {
      setErrorMessage('Tax rate must be between 0% and 100%.');
      return;
    }

    setErrorMessage(null);

    try {
      if (isEditing && item) {
        await updateItemMutation.mutateAsync({
          id: item.id,
          payload: {
            categoryId,
            itemCode: itemCode.trim(),
            name: name.trim(),
            urduName: urduName.trim() || null,
            description: description.trim() || null,
            basePrice: parsedPrice,
            taxRate: parsedTax,
          },
        });
      } else {
        await createItemMutation.mutateAsync({
          categoryId,
          itemCode: itemCode.trim(),
          name: name.trim(),
          urduName: urduName.trim() || null,
          description: description.trim() || null,
          basePrice: parsedPrice,
          taxRate: parsedTax,
          isAvailable,
          isActive: true,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save menu item';
      setErrorMessage(msg);
    }
  };

  const isPending = createItemMutation.isPending || updateItemMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <UtensilsCrossed size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <p className="text-xs text-pos-text-muted">
                {isEditing
                  ? `Update #${item?.itemCode} catalog details and pricing`
                  : 'Add a new dish or beverage to the restaurant catalog'}
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

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Menu Category <span className="text-pos-danger">*</span>
            </label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name & Urdu Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Item Name (English) <span className="text-pos-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Chicken Biryani Special"
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Urdu / Local Name (Optional)
              </label>
              <input
                type="text"
                value={urduName}
                onChange={e => setUrduName(e.target.value)}
                placeholder="e.g. چکن بریانی"
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
              />
            </div>
          </div>

          {/* Item Code & Base Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                SKU / Item Code <span className="text-pos-danger">*</span>
              </label>
              <div className="relative">
                <Tag
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="text"
                  required
                  value={itemCode}
                  onChange={e => setItemCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BIRYANI_01"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Base Price ({currency}) <span className="text-pos-danger">*</span>
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
                  value={basePrice}
                  onChange={e => setBasePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Tax Rate & Availability Switch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Tax Rate (% optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={taxRate}
                onChange={e => setTaxRate(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
              />
            </div>

            {!isEditing && (
              <div className="pt-4 flex items-center justify-between p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
                <span className="text-xs font-semibold text-pos-text">
                  Available in Register (86)
                </span>
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={e => setIsAvailable(e.target.checked)}
                  className="h-4 w-4 rounded accent-pos-primary cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Description & Preparation Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Fragrant basmati rice cooked with fresh chicken, saffron, and spices..."
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
              className="font-bold shadow-xs"
            >
              {isEditing ? 'Save Changes' : 'Create Menu Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
