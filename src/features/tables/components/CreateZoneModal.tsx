import React, { useState } from 'react';
import { AlertCircle, LayoutGrid, X } from 'lucide-react';
import { ApiError } from '@/core/api/errors';
import { useCreateZoneMutation } from '../hooks/useTablesAdminData';
import { Button } from '@/components/ui/Button';

interface CreateZoneModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function fieldError(details: unknown, field: string): string | undefined {
  if (!Array.isArray(details)) return undefined;
  const match = details.find(
    item =>
      typeof item === 'object' &&
      item !== null &&
      'field' in item &&
      (item as { field: string }).field === field
  ) as { message?: string } | undefined;
  return match?.message;
}

export const CreateZoneModal: React.FC<CreateZoneModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const createMutation = useCreateZoneMutation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Zone name is required.');
      return;
    }
    if (trimmedName.length > 100) {
      setErrorMessage('Zone name cannot exceed 100 characters.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: trimmedName,
        description: description.trim() || null,
      });
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
        const details =
          err.raw && typeof err.raw === 'object' && err.raw !== null && 'error' in err.raw
            ? (err.raw as { error?: { details?: unknown } }).error?.details
            : undefined;
        const next: Record<string, string> = {};
        for (const field of ['name', 'description']) {
          const message = fieldError(details, field);
          if (message) next[field] = message;
        }
        setFieldErrors(next);
      } else {
        setErrorMessage('Failed to create zone. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-zone-title"
        className="w-full max-w-md rounded-xl bg-pos-surface border border-pos-border shadow-modal overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-pos-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-pos-primary-soft text-pos-primary flex items-center justify-center">
              <LayoutGrid size={16} />
            </div>
            <h2 id="create-zone-title" className="text-sm font-bold text-pos-text">
              Add Dining Zone
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4" autoComplete="off">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1">
              Zone name
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-pos-border bg-pos-surface text-sm text-pos-text focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
              placeholder="e.g. Main Hall, Patio, VIP"
              autoFocus
            />
            {fieldErrors.name && (
              <p className="mt-1 text-[11px] text-pos-danger">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1">
              Description <span className="font-normal normal-case">(optional)</span>
            </label>
            <textarea
              maxLength={500}
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-pos-border bg-pos-surface text-sm text-pos-text focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none"
              placeholder="Short note for staff (optional)"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-[11px] text-pos-danger">{fieldErrors.description}</p>
            )}
          </div>

          <p className="text-[11px] text-pos-text-muted leading-relaxed">
            After creating a zone, add tables to it. Dine-in on the POS Register uses these
            tables.
          </p>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createMutation.isPending}
              className="font-semibold"
            >
              {createMutation.isPending ? 'Creating…' : 'Create Zone'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
