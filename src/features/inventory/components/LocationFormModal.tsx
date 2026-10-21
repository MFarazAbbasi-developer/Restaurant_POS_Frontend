import React, { useState } from 'react';
import { InventoryLocationRecord } from '@/types';
import { ApiError } from '@/core/api/errors';
import {
  useCreateInventoryLocationMutation,
  useUpdateInventoryLocationMutation,
} from '../hooks/useInventoryData';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Warehouse, X } from 'lucide-react';

interface LocationFormModalProps {
  location?: InventoryLocationRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const LocationFormModal: React.FC<LocationFormModalProps> = ({
  location,
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(location);
  const createMutation = useCreateInventoryLocationMutation();
  const updateMutation = useUpdateInventoryLocationMutation();

  const [name, setName] = useState(location?.name || '');
  const [code, setCode] = useState(location?.code || '');
  const [isDefault, setIsDefault] = useState(location?.isDefault || false);
  const [isActive, setIsActive] = useState(location?.isActive ?? true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Location name is required.');
      return;
    }
    if (trimmedName.length > 100) {
      setErrorMessage('Location name cannot exceed 100 characters.');
      return;
    }

    const trimmedCode = code.trim();
    if (trimmedCode.length > 50) {
      setErrorMessage('Location code cannot exceed 50 characters.');
      return;
    }

    try {
      if (isEditing && location) {
        await updateMutation.mutateAsync({
          id: location.id,
          payload: {
            name: trimmedName,
            code: trimmedCode || null,
            isDefault,
            isActive,
          },
        });
        setSuccessMessage('Location updated successfully.');
      } else {
        await createMutation.mutateAsync({
          name: trimmedName,
          code: trimmedCode || undefined,
          isDefault,
        });
        setSuccessMessage('Location created successfully.');
      }
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          isEditing ? 'Failed to update location.' : 'Failed to create location.'
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 select-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-form-title"
        className="w-full max-w-md bg-pos-surface border border-pos-border rounded-xl shadow-modal overflow-hidden"
      >
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <Warehouse size={18} />
            </div>
            <div>
              <h3 id="location-form-title" className="text-base font-bold text-pos-text">
                {isEditing ? 'Edit Stock Location' : 'Add Stock Location'}
              </h3>
              <p className="text-xs text-pos-text-muted">
                Storage areas used for stock filtering and transfers
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3">
          {errorMessage && (
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-2.5 rounded-md bg-pos-success-soft border border-[#BBF7D0] text-pos-success text-xs font-medium">
              {successMessage}
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted block mb-1">
              Location Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              placeholder="e.g. Main Kitchen Pantry"
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-sm text-pos-text focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted block mb-1">
              Code (optional)
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              maxLength={50}
              placeholder="e.g. KIT-01"
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-sm text-pos-text font-mono focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-pos-text cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={e => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded accent-pos-primary cursor-pointer"
            />
            <span>Set as default receiving location</span>
          </label>

          {isEditing && (
            <label className="flex items-center gap-2 text-xs font-semibold text-pos-text cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded accent-pos-primary cursor-pointer"
              />
              <span>Location is active</span>
            </label>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isPending}>
              {isPending
                ? 'Saving...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Location'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
