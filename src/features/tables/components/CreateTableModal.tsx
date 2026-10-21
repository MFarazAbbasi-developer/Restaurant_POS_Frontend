import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, UtensilsCrossed, X } from 'lucide-react';
import { ZoneRecord } from '@/types';
import { ApiError } from '@/core/api/errors';
import { useCreateTableMutation } from '../hooks/useTablesAdminData';
import { Button } from '@/components/ui/Button';

interface CreateTableModalProps {
  zones: ZoneRecord[];
  preferredZoneId?: string | null;
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

export const CreateTableModal: React.FC<CreateTableModalProps> = ({
  zones,
  preferredZoneId,
  onClose,
  onSuccess,
}) => {
  const createMutation = useCreateTableMutation();
  const activeZones = useMemo(
    () => zones.filter(z => z.isActive !== false),
    [zones]
  );

  const defaultZoneId = useMemo(() => {
    if (preferredZoneId && activeZones.some(z => z.id === preferredZoneId)) {
      return preferredZoneId;
    }
    return activeZones[0]?.id || '';
  }, [activeZones, preferredZoneId]);

  const [zoneId, setZoneId] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!zoneId && defaultZoneId) {
      setZoneId(defaultZoneId);
    }
  }, [defaultZoneId, zoneId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const trimmedName = name.trim();
    if (!zoneId) {
      setErrorMessage('Select a zone for this table.');
      return;
    }
    if (!trimmedName) {
      setErrorMessage('Table name or number is required.');
      return;
    }
    if (trimmedName.length > 50) {
      setErrorMessage('Table name cannot exceed 50 characters.');
      return;
    }

    const capacityNum = Number.parseInt(capacity, 10);
    if (!Number.isFinite(capacityNum) || capacityNum < 1 || capacityNum > 100) {
      setErrorMessage('Capacity must be a whole number from 1 to 100.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        zoneId,
        name: trimmedName,
        capacity: capacityNum,
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
        for (const field of ['zoneId', 'name', 'capacity']) {
          const message = fieldError(details, field);
          if (message) next[field] = message;
        }
        setFieldErrors(next);
      } else {
        setErrorMessage('Failed to create table. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-table-title"
        className="w-full max-w-md rounded-xl bg-pos-surface border border-pos-border shadow-modal overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-pos-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-pos-primary-soft text-pos-primary flex items-center justify-center">
              <UtensilsCrossed size={16} />
            </div>
            <h2 id="create-table-title" className="text-sm font-bold text-pos-text">
              Add Table
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

          {activeZones.length === 0 ? (
            <div className="p-3 rounded-lg bg-pos-warning-soft border border-[#FED7AA] text-pos-warning text-xs">
              Create a dining zone before adding tables.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1">
                  Zone
                </label>
                <select
                  required
                  value={zoneId}
                  onChange={e => setZoneId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-pos-border bg-pos-surface text-sm text-pos-text focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                >
                  {activeZones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                      {zone._count?.tables != null
                        ? ` (${zone._count.tables} tables)`
                        : ''}
                    </option>
                  ))}
                </select>
                {fieldErrors.zoneId && (
                  <p className="mt-1 text-[11px] text-pos-danger">{fieldErrors.zoneId}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1">
                    Table name / number
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-pos-border bg-pos-surface text-sm text-pos-text font-mono focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                    placeholder="e.g. T1, 12"
                    autoFocus
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-[11px] text-pos-danger">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-pos-border bg-pos-surface text-sm text-pos-text focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                  />
                  {fieldErrors.capacity && (
                    <p className="mt-1 text-[11px] text-pos-danger">{fieldErrors.capacity}</p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createMutation.isPending || activeZones.length === 0}
              className="font-semibold"
            >
              {createMutation.isPending ? 'Creating…' : 'Create Table'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
