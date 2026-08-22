import React, { useState } from 'react';
import { ModifierGroupWithCount } from '@/types';
import {
  useCreateModifierGroupMutation,
  useUpdateModifierGroupMutation,
} from '../hooks/useMenuData';
import { Button } from '@/components/ui/Button';
import { X, ListFilter, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModifierGroupModalProps {
  group?: ModifierGroupWithCount | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModifierGroupModal: React.FC<ModifierGroupModalProps> = ({
  group,
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(group);
  const createGroupMutation = useCreateModifierGroupMutation();
  const updateGroupMutation = useUpdateModifierGroupMutation();

  const [name, setName] = useState<string>(group?.name || '');
  const [selectionType, setSelectionType] = useState<'SINGLE' | 'MULTIPLE'>(
    group?.selectionType || 'SINGLE'
  );
  const [minSelections, setMinSelections] = useState<string>(
    group?.minSelections !== undefined ? group.minSelections.toString() : '0'
  );
  const [maxSelections, setMaxSelections] = useState<string>(
    group?.maxSelections !== undefined ? group.maxSelections.toString() : '1'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Modifier group name is required.');
      return;
    }

    const min = parseInt(minSelections, 10);
    const max = parseInt(maxSelections, 10);

    if (isNaN(min) || min < 0) {
      setErrorMessage('Min selections must be a non-negative integer.');
      return;
    }
    if (isNaN(max) || max < 1) {
      setErrorMessage('Max selections must be at least 1.');
      return;
    }
    if (min > max) {
      setErrorMessage('Min selections cannot exceed max selections.');
      return;
    }

    setErrorMessage(null);

    try {
      if (isEditing && group) {
        await updateGroupMutation.mutateAsync({
          id: group.id,
          payload: {
            name: name.trim(),
            selectionType,
            minSelections: min,
            maxSelections: max,
          },
        });
      } else {
        await createGroupMutation.mutateAsync({
          name: name.trim(),
          selectionType,
          minSelections: min,
          maxSelections: max,
          sortOrder: 0,
          isActive: true,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save modifier group';
      setErrorMessage(msg);
    }
  };

  const isPending = createGroupMutation.isPending || updateGroupMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <ListFilter size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                {isEditing ? 'Edit Modifier Group' : 'Create Modifier Group'}
              </h3>
              <p className="text-xs text-pos-text-muted">
                Configure option choices, addons, or flavor selections
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Group Name <span className="text-pos-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Spice Level, Extra Toppings, Sauce Choice"
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
            />
          </div>

          {/* Selection Type Switcher */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Selection Type
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-pos-surface-subtle border border-pos-border">
              <button
                type="button"
                onClick={() => {
                  setSelectionType('SINGLE');
                  setMaxSelections('1');
                }}
                className={cn(
                  'py-2 rounded-md text-xs font-semibold transition-all',
                  selectionType === 'SINGLE'
                    ? 'bg-pos-primary text-white shadow-xs'
                    : 'text-pos-text-secondary hover:text-pos-text'
                )}
              >
                Single Selection (Radio)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectionType('MULTIPLE');
                  if (maxSelections === '1') setMaxSelections('5');
                }}
                className={cn(
                  'py-2 rounded-md text-xs font-semibold transition-all',
                  selectionType === 'MULTIPLE'
                    ? 'bg-pos-primary text-white shadow-xs'
                    : 'text-pos-text-secondary hover:text-pos-text'
                )}
              >
                Multi Selection (Checkbox)
              </button>
            </div>
          </div>

          {/* Min & Max Selections */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Min Selections
              </label>
              <input
                type="number"
                min="0"
                required
                value={minSelections}
                onChange={e => setMinSelections(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Max Selections
              </label>
              <input
                type="number"
                min="1"
                required
                value={maxSelections}
                onChange={e => setMaxSelections(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
              />
            </div>
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
              className="font-bold shadow-xs"
            >
              {isEditing ? 'Save Group' : 'Create Modifier Group'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
