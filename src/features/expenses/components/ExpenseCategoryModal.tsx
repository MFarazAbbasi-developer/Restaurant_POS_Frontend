import React, { useState } from 'react';
import { ExpenseCategoryRecord } from '@/types';
import {
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
} from '../hooks/useExpensesData';
import { Button } from '@/components/ui/Button';
import { X, Tag, AlertCircle } from 'lucide-react';

interface ExpenseCategoryModalProps {
  category?: ExpenseCategoryRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExpenseCategoryModal: React.FC<ExpenseCategoryModalProps> = ({
  category,
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(category);
  const createMutation = useCreateExpenseCategoryMutation();
  const updateMutation = useUpdateExpenseCategoryMutation();

  const [name, setName] = useState<string>(category?.name || '');
  const [description, setDescription] = useState<string>(category?.description || '');
  const [isActive, setIsActive] = useState<boolean>(category ? category.isActive : true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Category name is required.');
      return;
    }

    setErrorMessage(null);

    try {
      if (isEditing && category) {
        await updateMutation.mutateAsync({
          id: category.id,
          payload: {
            name: name.trim(),
            description: description.trim() || null,
            isActive,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || null,
          isActive,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save expense category';
      setErrorMessage(msg);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-accent/15 border border-pos-accent/30 text-pos-accent flex items-center justify-center">
              <Tag size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                {isEditing ? 'Edit Expense Category' : 'New Expense Category'}
              </h3>
              <p className="text-xs text-pos-text-muted">
                {isEditing
                  ? `Update configuration for ${category?.name}`
                  : 'Define operational expenditure classification'}
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-pos-danger/10 border border-pos-danger/30 text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Category Name <span className="text-pos-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Kitchen Supplies, Utilities, Staff Meals"
              className="w-full px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pos-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Monthly gas, electricity, cleaning chemicals..."
              className="w-full p-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent resize-none font-medium"
            />
          </div>

          <label className="flex items-center gap-2 p-2.5 rounded-xl bg-pos-bg border border-pos-border cursor-pointer select-none text-xs">
            <input
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded accent-pos-accent"
            />
            <span className="font-bold text-pos-text">Active Category</span>
          </label>

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
              {isEditing ? 'Save Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
