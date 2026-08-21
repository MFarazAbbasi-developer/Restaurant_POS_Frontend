import React, { useState } from 'react';
import { PurchasingSupplierRecord } from '@/types';
import {
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
} from '../hooks/usePurchasingData';
import { Button } from '@/components/ui/Button';
import {
  X,
  Truck,
  User,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';

interface SupplierFormModalProps {
  supplier?: PurchasingSupplierRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  supplier,
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(supplier);
  const createMutation = useCreateSupplierMutation();
  const updateMutation = useUpdateSupplierMutation();

  const [name, setName] = useState<string>(supplier?.name || '');
  const [contactPerson, setContactPerson] = useState<string>(
    supplier?.contactPerson || ''
  );
  const [phone, setPhone] = useState<string>(supplier?.phone || '');
  const [email, setEmail] = useState<string>(supplier?.email || '');
  const [address, setAddress] = useState<string>(supplier?.address || '');
  const [taxNumber, setTaxNumber] = useState<string>(supplier?.taxNumber || '');
  const [isActive, setIsActive] = useState<boolean>(supplier ? supplier.isActive : true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Supplier business name is required.');
      return;
    }

    setErrorMessage(null);

    try {
      if (isEditing && supplier) {
        await updateMutation.mutateAsync({
          id: supplier.id,
          payload: {
            name: name.trim(),
            contactPerson: contactPerson.trim() || null,
            phone: phone.trim() || null,
            email: email.trim() || null,
            address: address.trim() || null,
            taxNumber: taxNumber.trim() || null,
            isActive,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          contactPerson: contactPerson.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          taxNumber: taxNumber.trim() || null,
          isActive,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save supplier record';
      setErrorMessage(msg);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-accent/15 border border-pos-accent/30 text-pos-accent flex items-center justify-center">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                {isEditing ? 'Edit Supplier Profile' : 'New Supplier Registration'}
              </h3>
              <p className="text-xs text-pos-text-muted">
                {isEditing
                  ? `Update procurement contact for ${supplier?.name}`
                  : 'Register vendor for purchase orders and inventory delivery'}
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
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar"
        >
          {errorMessage && (
            <div className="p-3 rounded-xl bg-pos-danger/10 border border-pos-danger/30 text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Supplier Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Company / Vendor Name <span className="text-pos-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Metro Wholesale Foods"
              className="w-full px-3.5 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pos-accent"
            />
          </div>

          {/* Contact Person & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Contact Person
              </label>
              <div className="relative">
                <User
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="text"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent"
                />
              </div>
            </div>
          </div>

          {/* Email & Tax Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="orders@metrowholesale.pk"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                NTN / Tax Number
              </label>
              <div className="relative">
                <FileSpreadsheet
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="text"
                  value={taxNumber}
                  onChange={e => setTaxNumber(e.target.value)}
                  placeholder="e.g. 1234567-8"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent"
                />
              </div>
            </div>
          </div>

          {/* Physical Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Warehouse / Business Address
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-3 text-pos-text-muted" />
              <textarea
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Plot 14, Industrial Area, Sector I-9"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent resize-none font-medium"
              />
            </div>
          </div>

          {/* Active Status Toggle */}
          <label className="flex items-center gap-2 p-2.5 rounded-xl bg-pos-bg border border-pos-border cursor-pointer select-none text-xs">
            <input
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded accent-pos-accent"
            />
            <span className="font-bold text-pos-text">
              Active Supplier (Eligible for PO creation)
            </span>
          </label>

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
              disabled={!name.trim()}
              className="font-bold shadow-sm"
            >
              {isEditing ? 'Save Supplier' : 'Register Supplier'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
