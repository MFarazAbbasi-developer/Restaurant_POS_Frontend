import React, { useState } from 'react';
import { ModifierRecord } from '@/types';
import {
  useCreateModifierMutation,
  useUpdateModifierMutation,
} from '../hooks/useMenuData';
import { Button } from '@/components/ui/Button';
import { X, PlusCircle, DollarSign, AlertCircle } from 'lucide-react';

interface ModifierOptionModalProps {
  groupId: string;
  groupName: string;
  modifier?: ModifierRecord | null;
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModifierOptionModal: React.FC<ModifierOptionModalProps> = ({
  groupId,
  groupName,
  modifier,
  currency = 'USD',
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(modifier);
  const createModifierMutation = useCreateModifierMutation();
  const updateModifierMutation = useUpdateModifierMutation();

  const [name, setName] = useState<string>(modifier?.name || '');
  const [priceAdjustment, setPriceAdjustment] = useState<string>(
    modifier?.priceAdjustment !== undefined ? modifier.priceAdjustment.toString() : '0.00'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Modifier option name is required.');
      return;
    }

    const parsedPrice = parseFloat(priceAdjustment);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMessage('Please enter a valid non-negative price adjustment.');
      return;
    }

    setErrorMessage(null);

    try {
      if (isEditing && modifier) {
        await updateModifierMutation.mutateAsync({
          id: modifier.id,
          payload: {
            name: name.trim(),
            priceAdjustment: parsedPrice,
          },
        });
      } else {
        await createModifierMutation.mutateAsync({
          groupId,
          payload: {
            name: name.trim(),
            priceAdjustment: parsedPrice,
            sortOrder: 0,
            isActive: true,
          },
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save modifier option';
      setErrorMessage(msg);
    }
  };

  const isPending = createModifierMutation.isPending || updateModifierMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-accent/15 border border-pos-accent/30 text-pos-accent flex items-center justify-center">
              <PlusCircle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                {isEditing ? 'Edit Modifier Option' : 'Add Modifier Option'}
              </h3>
              <p className="text-xs text-pos-text-muted">In Group: {groupName}</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-pos-danger/10 border border-pos-danger/30 text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Option Name <span className="text-pos-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Extra Cheese, Spicy, Garlic Sauce"
              className="w-full px-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pos-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Price Surcharge / Adjustment ({currency})
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
                value={priceAdjustment}
                onChange={e => setPriceAdjustment(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent"
              />
            </div>
            <p className="text-[10px] text-pos-text-muted mt-1">
              Enter 0.00 for free options, or a positive amount added to item price.
            </p>
          </div>

          <div className="pt-2 border-t border-pos-border flex items-center justify-end gap-2">
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
              disabled={!name.trim()}
              className="font-bold shadow-sm"
            >
              {isEditing ? 'Save Option' : 'Add Option'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
