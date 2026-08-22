import React, { useState } from 'react';
import { CustomerRecord, DeliveryZoneRecord } from '@/types';
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} from '../hooks/useCustomerData';
import { Button } from '@/components/ui/Button';
import { X, User, Phone, MapPin, FileText, AlertCircle } from 'lucide-react';

interface CustomerFormModalProps {
  customer?: CustomerRecord | null;
  zones: DeliveryZoneRecord[];
  initialPhone?: string;
  onClose: () => void;
  onSuccess: (customer?: CustomerRecord) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  customer,
  zones,
  initialPhone = '',
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(customer);
  const createCustomerMutation = useCreateCustomerMutation();
  const updateCustomerMutation = useUpdateCustomerMutation();

  const [name, setName] = useState<string>(customer?.name || '');
  const [phone, setPhone] = useState<string>(customer?.phone || initialPhone || '');
  const [notes, setNotes] = useState<string>(customer?.notes || '');

  // Address fields for new customer
  const [address, setAddress] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [deliveryZoneId, setDeliveryZoneId] = useState<string>(zones[0]?.id || '');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Customer name is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Phone number is required.');
      return;
    }

    setErrorMessage(null);

    try {
      if (isEditing && customer) {
        const res = await updateCustomerMutation.mutateAsync({
          id: customer.id,
          payload: {
            name: name.trim(),
            notes: notes.trim() || null,
          },
        });
        onSuccess(res.customer);
      } else {
        const res = await createCustomerMutation.mutateAsync({
          name: name.trim(),
          phone: phone.trim(),
          notes: notes.trim() || null,
          address: address.trim() || undefined,
          landmark: landmark.trim() || undefined,
          deliveryZoneId: deliveryZoneId || undefined,
        });
        onSuccess(res.customer);
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save customer profile';
      setErrorMessage(msg);
    }
  };

  const isPending = createCustomerMutation.isPending || updateCustomerMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                {isEditing ? 'Edit Customer Profile' : 'New Customer Registration'}
              </h3>
              <p className="text-xs text-pos-text-muted">
                {isEditing
                  ? `Update CRM details for ${customer?.name}`
                  : 'Add customer for delivery, takeaway, or loyalty tracking'}
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

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Full Name <span className="text-pos-danger">*</span>
              </label>
              <div className="relative">
                <User
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ali Khan"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Phone Number <span className="text-pos-danger">*</span>
              </label>
              <div className="relative">
                <Phone
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="tel"
                  required
                  disabled={isEditing}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary disabled:opacity-60 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Customer Notes / Dietary Preferences (Optional)
            </label>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-3 text-pos-text-muted" />
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Likes extra spicy, prefers call before arrival..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text placeholder-pos-text-muted text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none font-medium shadow-xs"
              />
            </div>
          </div>

          {/* Initial Address (Only on Creation) */}
          {!isEditing && (
            <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                <MapPin size={14} className="text-pos-primary" />
                <span>Primary Delivery Address (Optional)</span>
              </h4>

              <div>
                <label className="block text-[11px] font-semibold text-pos-text-secondary mb-1">
                  Street Address & House / Flat #
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. House 42, Street 7, Sector F-10/2"
                  className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-pos-text-secondary mb-1">
                    Nearby Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    placeholder="e.g. Near Shell Pump"
                    className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-pos-text-secondary mb-1">
                    Delivery Zone
                  </label>
                  <select
                    value={deliveryZoneId}
                    onChange={e => setDeliveryZoneId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
                  >
                    <option value="">-- Auto / None --</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

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
              disabled={!name.trim() || !phone.trim()}
              className="font-bold shadow-xs"
            >
              {isEditing ? 'Save Profile' : 'Register Customer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
