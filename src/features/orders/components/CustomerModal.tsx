import React, { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { Button } from '@/components/ui/Button';
import { X, UserCheck, Plus, Minus, MapPin, Phone, User as UserIcon } from 'lucide-react';

interface CustomerModalProps {
  onClose: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ onClose }) => {
  const { customer, guestCount, orderType, setCustomer, setGuestCount } = useCartStore();

  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [guests, setGuests] = useState(guestCount || 1);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setGuestCount(guests);
    setCustomer({
      name: name.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
    });
    onClose();
  };

  const handleClear = () => {
    setCustomer(null);
    setGuestCount(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-pos-primary-soft border border-[#FED7AA] text-pos-primary flex items-center justify-center">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-pos-text">
                Customer & Order Info
              </h3>
              <p className="text-xs text-pos-text-muted">
                {orderType === 'DELIVERY'
                  ? 'Delivery recipient and destination address'
                  : 'Customer identification and party size'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customer modal"
            className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Guest Count for Dine-in */}
          {orderType === 'DINE_IN' && (
            <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-pos-text">
                  Party / Guest Count
                </label>
                <p className="text-xs text-pos-text-muted">
                  Total guests seated at this table
                </p>
              </div>
              <div className="flex items-center bg-pos-surface border border-pos-border rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setGuests(g => Math.max(1, g - 1))}
                  aria-label="Decrease guests"
                  className="h-8 w-8 rounded hover:bg-pos-surface-subtle text-pos-text-muted hover:text-pos-text flex items-center justify-center transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-bold text-sm text-pos-text font-mono">
                  {guests}
                </span>
                <button
                  type="button"
                  onClick={() => setGuests(g => g + 1)}
                  aria-label="Increase guests"
                  className="h-8 w-8 rounded hover:bg-pos-surface-subtle text-pos-text-muted hover:text-pos-text flex items-center justify-center transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Customer Name
            </label>
            <div className="relative">
              <UserIcon
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pos-text-muted"
              />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-pos-surface border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium"
              />
            </div>
          </div>

          {/* Customer Phone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pos-text-muted"
              />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 019-2834"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-pos-surface border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium font-mono"
              />
            </div>
          </div>

          {/* Delivery Address (if Delivery order) */}
          {orderType === 'DELIVERY' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Delivery Address <span className="text-pos-danger">*</span>
              </label>
              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-3.5 top-3 text-pos-text-muted"
                />
                <textarea
                  rows={3}
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street address, building, apartment / suite number..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-pos-surface border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium resize-none"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-pos-border flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs text-pos-text-muted hover:text-pos-danger"
            >
              Clear Details
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" className="font-semibold">
                Apply Details
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
