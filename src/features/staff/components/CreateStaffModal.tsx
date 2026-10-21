import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, KeyRound, UserPlus, X } from 'lucide-react';
import { StaffRoleRecord } from '@/types';
import { ApiError } from '@/core/api/errors';
import { useCreateStaffMutation } from '../hooks/useStaffData';
import { Button } from '@/components/ui/Button';

interface CreateStaffModalProps {
  roles: StaffRoleRecord[];
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

export const CreateStaffModal: React.FC<CreateStaffModalProps> = ({
  roles,
  onClose,
  onSuccess,
}) => {
  const createMutation = useCreateStaffMutation();

  const defaultRoleId = useMemo(() => {
    const cashier = roles.find(r => r.name.toUpperCase() === 'CASHIER');
    return cashier?.id || roles[0]?.id || '';
  }, [roles]);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!roleId && defaultRoleId) {
      setRoleId(defaultRoleId);
    }
  }, [defaultRoleId, roleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (!name.trim()) {
      setErrorMessage('Name is required.');
      return;
    }
    if (username.trim().length < 3) {
      setErrorMessage('Username must be at least 3 characters.');
      return;
    }
    if (!/^\d{4,8}$/.test(pin.trim())) {
      setErrorMessage('PIN must be 4–8 digits.');
      return;
    }
    if (!roleId) {
      setErrorMessage('Select a role for this staff member.');
      return;
    }
    if (password && password.length < 8) {
      setErrorMessage('Password must be at least 8 characters when provided.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        username: username.trim(),
        phone: phone.trim() || undefined,
        pin: pin.trim(),
        password: password.trim() || undefined,
        roleIds: [roleId],
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
        for (const field of ['name', 'username', 'phone', 'pin', 'password', 'roleIds']) {
          const message = fieldError(details, field);
          if (message) next[field] = message;
        }
        setFieldErrors(next);
      } else {
        setErrorMessage('Failed to create staff member. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-staff-title"
        className="w-full max-w-lg rounded-xl bg-pos-surface border border-pos-border shadow-modal overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-pos-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-pos-primary-soft text-pos-primary flex items-center justify-center">
              <UserPlus size={16} />
            </div>
            <h2 id="create-staff-title" className="text-sm font-bold text-pos-text">
              Add Staff Member
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1">
                Full name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-pos-border bg-pos-surface text-sm text-pos-text focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                placeholder="e.g. Sara Cashier"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-[11px] text-pos-danger">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-pos-border bg-pos-surface text-sm text-pos-text font-mono focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                placeholder="sara_cashier"
              />
              {fieldErrors.username && (
                <p className="mt-1 text-[11px] text-pos-danger">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1">
                Phone (optional)
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-pos-border bg-pos-surface text-sm text-pos-text focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                placeholder="+92 …"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1">
                Role
              </label>
              <select
                required
                value={roleId}
                onChange={e => setRoleId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-pos-border bg-pos-surface text-sm text-pos-text focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
              >
                {roles.length === 0 && <option value="">No roles available</option>}
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                    {role.description ? ` — ${role.description}` : ''}
                  </option>
                ))}
              </select>
              {fieldErrors.roleIds && (
                <p className="mt-1 text-[11px] text-pos-danger">{fieldErrors.roleIds}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1">
                Touch PIN (4–8 digits)
              </label>
              <div className="relative">
                <KeyRound
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  maxLength={8}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-pos-border bg-pos-surface text-sm text-pos-text font-mono focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                  placeholder="••••"
                />
              </div>
              {fieldErrors.pin && (
                <p className="mt-1 text-[11px] text-pos-danger">{fieldErrors.pin}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1">
                Password (optional)
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-pos-border bg-pos-surface text-sm text-pos-text focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                placeholder="Min 8 characters if set"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-[11px] text-pos-danger">{fieldErrors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-pos-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createMutation.isPending}
              className="font-semibold"
            >
              Create Staff
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
