import React, { useState } from 'react';
import { CustomerRecord, DeliveryZoneRecord } from '@/types';
import { useAddCustomerAddressMutation } from '../hooks/useCustomerData';
import { Button } from '@/components/ui/Button';
import { X, MapPin, AlertCircle, Plus } from 'lucide-react';

interface AddAddressModalProps {
  customer: CustomerRecord;
  zones: DeliveryZoneRecord[];
  onClose: () => void;
  onSuccess: () => void;
}

export const AddAddressModal: React.FC<AddAddressModalProps> = ({
  customer,
  zones,
  onClose,
  onSuccess,
}) => {
  const addAddressMutation = useAddCustomerAddressMutation();

  const [address, setAddress] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [deliveryZoneId, setDeliveryZoneId] = useState<string>(zones[0]?.id || '');
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setErrorMessage('Address line is required.');
      return;
    }

    setErrorMessage(null);

    try {
      await addAddressMutation.mutateAsync({
        customerId: customer.id,
        payload: {
          address: address.trim(),
          landmark: landmark.trim() || undefined,
          deliveryZoneId: deliveryZoneId || undefined,
          isDefault,
        },
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add delivery address';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">Add Delivery Address</h3>
              <p className="text-xs text-pos-text-muted">
                For {customer.name} ({customer.phone})
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
              Street Address & Location <span className="text-pos-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. Flat 3B, Sky Heights, Block 4"
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Nearby Landmark
              </label>
              <input
                type="text"
                value={landmark}
                onChange={e => setLandmark(e.target.value)}
                placeholder="e.g. Opposite Main Park"
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Delivery Zone
              </label>
              <select
                value={deliveryZoneId}
                onChange={e => setDeliveryZoneId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
              >
                <option value="">-- None / Auto --</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border cursor-pointer select-none text-xs">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={e => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded accent-pos-primary"
            />
            <span className="font-semibold text-pos-text">
              Set as default delivery address
            </span>
          </label>

          <div className="pt-2 border-t border-pos-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={addAddressMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={addAddressMutation.isPending}
              disabled={!address.trim()}
              className="font-bold shadow-xs"
            >
              <Plus size={14} className="mr-1" />
              Add Address
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
