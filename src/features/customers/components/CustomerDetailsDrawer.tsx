import React from 'react';
import { CustomerRecord } from '@/types';
import {
  useCustomerLoyaltyQuery,
  useCustomerLookupQuery,
  useEnrollCustomerLoyaltyMutation,
} from '../hooks/useCustomerData';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  X,
  User,
  MapPin,
  FileText,
  Award,
  ShoppingBag,
  Plus,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CustomerDetailsDrawerProps {
  customer: CustomerRecord;
  currency?: string;
  onClose: () => void;
  onEdit: (customer: CustomerRecord) => void;
  onAddAddress: (customer: CustomerRecord) => void;
}

export const CustomerDetailsDrawer: React.FC<CustomerDetailsDrawerProps> = ({
  customer,
  currency = 'USD',
  onClose,
  onEdit,
  onAddAddress,
}) => {
  const navigate = useNavigate();

  // Fetch full details / recent orders by phone
  const { data: lookupData, isLoading: isLookupLoading } = useCustomerLookupQuery(
    customer.phone
  );

  // Fetch loyalty account
  const { data: loyaltyData, isLoading: isLoyaltyLoading } = useCustomerLoyaltyQuery(
    customer.id
  );

  const enrollMutation = useEnrollCustomerLoyaltyMutation();

  const customerDetails = lookupData?.customer || customer;
  const addresses = customerDetails.addresses || [];
  const recentOrders = customerDetails.deliveryOrders || [];
  const loyaltyAccount = loyaltyData?.account;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleEnrollLoyalty = async () => {
    try {
      await enrollMutation.mutateAsync({
        customerId: customer.id,
      });
    } catch {
      // handled
    }
  };

  const handleStartOrder = () => {
    // Navigate to orders register
    navigate('/orders');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-pos-surface border-l border-pos-border shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-accent/15 border border-pos-accent/30 text-pos-accent flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-pos-text">{customer.name}</h3>
                <Badge
                  variant={customer.isActive ? 'success' : 'default'}
                  className="text-[10px]"
                >
                  {customer.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-pos-text-muted font-mono mt-0.5">
                {customer.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(customer)}
              className="p-2 rounded-xl text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
              title="Edit profile"
              aria-label="Edit profile"
            >
              <Edit2 size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
              aria-label="Close drawer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Quick Action Banner */}
          <div className="p-3.5 rounded-2xl bg-pos-bg border border-pos-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <ShoppingBag size={16} className="text-pos-accent" />
              <span className="font-bold text-pos-text">Create POS Order</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartOrder}
              className="text-xs font-bold shadow-xs"
            >
              Start Order
            </Button>
          </div>

          {/* Loyalty Program Card */}
          <div className="p-4 rounded-2xl bg-pos-bg border border-pos-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-pos-accent/15 text-pos-accent">
                  <Award size={16} />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-pos-text">
                  Loyalty Rewards Profile
                </h4>
              </div>

              {loyaltyAccount?.tier && (
                <Badge variant="default" className="text-[10px]">
                  {loyaltyAccount.tier.name}
                </Badge>
              )}
            </div>

            {isLoyaltyLoading ? (
              <div className="py-4 text-center text-xs text-pos-text-muted">
                <Spinner size="sm" />
              </div>
            ) : loyaltyAccount ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-pos-surface border border-pos-border">
                  <span className="text-[10px] text-pos-text-muted block">
                    Available Points
                  </span>
                  <span className="text-sm font-mono font-bold text-pos-accent mt-0.5 block">
                    {loyaltyAccount.currentPoints} pts
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-pos-surface border border-pos-border">
                  <span className="text-[10px] text-pos-text-muted block">
                    Lifetime Points
                  </span>
                  <span className="text-sm font-mono font-bold text-pos-text mt-0.5 block">
                    {loyaltyAccount.lifetimePoints}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-pos-surface border border-pos-border">
                  <span className="text-[10px] text-pos-text-muted block">
                    Lifetime Spend
                  </span>
                  <span className="text-sm font-mono font-bold text-pos-success mt-0.5 block">
                    {formatPrice(loyaltyAccount.lifetimeSpend)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-pos-surface border border-pos-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-pos-text block">
                    Not Enrolled in Loyalty
                  </span>
                  <span className="text-[11px] text-pos-text-muted">
                    Enroll to enable automatic reward points & tier perks
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={enrollMutation.isPending}
                  onClick={handleEnrollLoyalty}
                  className="text-xs font-semibold flex items-center gap-1"
                >
                  <Sparkles size={13} className="text-pos-accent" />
                  <span>Enroll</span>
                </Button>
              </div>
            )}
          </div>

          {/* Customer Notes */}
          {customer.notes && (
            <div className="p-3.5 rounded-xl bg-pos-bg border border-pos-border space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pos-text-muted flex items-center gap-1">
                <FileText size={12} /> Notes & Preferences
              </span>
              <p className="text-xs text-pos-text font-medium">{customer.notes}</p>
            </div>
          )}

          {/* Saved Delivery Addresses */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-pos-text flex items-center gap-1.5">
                <MapPin size={14} className="text-pos-accent" />
                <span>Saved Delivery Addresses ({addresses.length})</span>
              </h4>

              <button
                type="button"
                onClick={() => onAddAddress(customer)}
                className="text-xs text-pos-accent hover:underline font-bold flex items-center gap-1"
              >
                <Plus size={13} /> + Add Address
              </button>
            </div>

            {addresses.length > 0 ? (
              <div className="space-y-2">
                {addresses.map(addr => (
                  <div
                    key={addr.id}
                    className="p-3 rounded-xl bg-pos-surface border border-pos-border text-xs flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-bold text-pos-text">{addr.address}</span>
                          {addr.isDefault && (
                            <Badge variant="success" className="text-[9px]">
                              Default
                            </Badge>
                          )}
                        </div>

                        {addr.landmark && (
                          <p className="text-[11px] text-pos-text-muted">
                            Landmark: {addr.landmark}
                          </p>
                        )}
                      </div>

                      {addr.deliveryZone && (
                        <Badge variant="default" className="text-[10px]">
                          {addr.deliveryZone.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center rounded-xl bg-pos-bg border border-pos-border text-xs text-pos-text-muted">
                No delivery addresses saved for this customer yet.
              </div>
            )}
          </div>

          {/* Past Delivery Orders History */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-pos-text flex items-center gap-1.5">
              <ShoppingBag size={14} className="text-pos-accent" />
              <span>Recent Delivery Orders ({recentOrders.length})</span>
            </h4>

            {isLookupLoading ? (
              <div className="py-4 text-center text-xs text-pos-text-muted">
                <Spinner size="sm" />
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-2">
                {recentOrders.map(ord => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-xl bg-pos-surface border border-pos-border text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-pos-accent">
                          #{ord.orderCode}
                        </span>
                        <Badge variant="default" className="text-[9px]">
                          {ord.status}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-pos-text-muted mt-0.5 block">
                        {new Date(ord.createdAt).toLocaleDateString()} •{' '}
                        {ord.deliveryAddress || 'Direct delivery'}
                      </span>
                    </div>

                    <span className="font-mono font-bold text-sm text-pos-text">
                      {formatPrice(ord.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center rounded-xl bg-pos-bg border border-pos-border text-xs text-pos-text-muted">
                No delivery order history found for this phone number.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pos-border bg-pos-header flex items-center justify-end shrink-0">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
