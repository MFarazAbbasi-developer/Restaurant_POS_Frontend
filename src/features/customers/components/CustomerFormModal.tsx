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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-accent/15 border border-pos-accent/30 text-pos-accent flex items-center justify-center">
              <User size={20} />
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

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Full Name <span className="text-pos-danger">*</span>
              </label>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ali Khan"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pos-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Phone Number <span className="text-pos-danger">*</span>
              </label>
              <div className="relative">
                <Phone
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="tel"
                  required
                  disabled={isEditing}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pos-accent disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
              Customer Notes / Dietary Preferences (Optional)
            </label>
            <div className="relative">
              <FileText size={15} className="absolute left-3 top-3 text-pos-text-muted" />
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Likes extra spicy, prefers call before arrival..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent resize-none font-medium"
              />
            </div>
          </div>

          {/* Initial Address (Only on Creation) */}
          {!isEditing && (
            <div className="p-4 rounded-xl bg-pos-bg border border-pos-border space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-pos-text flex items-center gap-1.5">
                <MapPin size={14} className="text-pos-accent" />
                <span>Primary Delivery Address (Optional)</span>
              </h4>

              <div>
                <label className="block text-[11px] font-semibold text-pos-text-muted mb-1">
                  Street Address & House / Flat #
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. House 42, Street 7, Sector F-10/2"
                  className="w-full px-3 py-2 rounded-xl bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-pos-text-muted mb-1">
                    Nearby Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    placeholder="e.g. Near Shell Pump"
                    className="w-full px-3 py-2 rounded-xl bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-pos-text-muted mb-1">
                    Delivery Zone
                  </label>
                  <select
                    value={deliveryZoneId}
                    onChange={e => setDeliveryZoneId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-medium"
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
              className="font-bold shadow-sm"
            >
              {isEditing ? 'Save Profile' : 'Register Customer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
