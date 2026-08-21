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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-accent/15 border border-pos-accent/30 text-pos-accent flex items-center justify-center">
              <MapPin size={20} />
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
              Street Address & Location <span className="text-pos-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. Flat 3B, Sky Heights, Block 4"
              className="w-full px-3 py-2.5 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Nearby Landmark
              </label>
              <input
                type="text"
                value={landmark}
                onChange={e => setLandmark(e.target.value)}
                placeholder="e.g. Opposite Main Park"
                className="w-full px-3 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                Delivery Zone
              </label>
              <select
                value={deliveryZoneId}
                onChange={e => setDeliveryZoneId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-medium"
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

          <label className="flex items-center gap-2 p-2.5 rounded-xl bg-pos-bg border border-pos-border cursor-pointer select-none text-xs">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={e => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded accent-pos-accent"
            />
            <span className="font-bold text-pos-text">
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
              className="font-bold shadow-sm"
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
