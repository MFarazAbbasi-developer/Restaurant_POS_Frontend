import React, { useState } from 'react';
import {
  useCustomersQuery,
  useDeliveryZonesQuery,
} from '@/features/customers/hooks/useCustomerData';
import { useAuthStore } from '@/core/auth/authStore';
import { CustomerRecord } from '@/types';
import { CustomerFormModal } from '@/features/customers/components/CustomerFormModal';
import { AddAddressModal } from '@/features/customers/components/AddAddressModal';
import { CustomerDetailsDrawer } from '@/features/customers/components/CustomerDetailsDrawer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  Users,
  Search,
  RotateCw,
  Plus,
  Phone,
  MapPin,
  FileText,
  Edit2,
  ChevronRight,
  ShoppingBag,
  ChevronLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currency =
    user && 'restaurant' in user && user.restaurant?.currency
      ? user.restaurant.currency
      : 'PKR';

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 20;

  // Modals & Drawer State
  const [customerModal, setCustomerModal] = useState<{
    open: boolean;
    customer?: CustomerRecord | null;
  }>({ open: false });

  const [addressModalCustomer, setAddressModalCustomer] = useState<CustomerRecord | null>(
    null
  );

  const [selectedCustomerForDrawer, setSelectedCustomerForDrawer] =
    useState<CustomerRecord | null>(null);

  // Queries
  const {
    data: customersData,
    isLoading: isCustomersLoading,
    isRefetching: isCustomersRefetching,
    refetch: refetchCustomers,
  } = useCustomersQuery({
    search: searchQuery.trim() || undefined,
    page,
    limit,
  });

  const { data: zones = [] } = useDeliveryZonesQuery();

  const customers = customersData?.customers || [];
  const pagination = customersData?.pagination;
  const totalCustomers = pagination?.total || customers.length;
  const totalPages = pagination?.totalPages || 1;

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden select-none -m-4 md:-m-6 p-3 sm:p-4 bg-pos-bg">
      <div className="flex-1 flex flex-col min-w-0 bg-pos-surface border border-pos-border rounded-lg overflow-hidden shadow-xs">
        {/* =========================================================================
            TOP HEADER BAR: Metrics & Quick Action CTAs
        ========================================================================= */}
        <div className="p-3 sm:p-3.5 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-pos-text">
                  Customer Directory & CRM
                </h2>
                <Badge variant="default" size="sm" className="text-[10px] font-mono">
                  {totalCustomers} Registered Customers
                </Badge>
              </div>
              <p className="text-[11px] text-pos-text-muted mt-0.5 font-medium">
                Customer profiles, phone lookup, multiple saved delivery addresses, and
                CRM history
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetchCustomers()}
              disabled={isCustomersRefetching}
              className="min-h-[36px] px-3 font-medium flex items-center gap-1.5"
            >
              <RotateCw
                size={14}
                className={isCustomersRefetching ? 'animate-spin' : ''}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setCustomerModal({ open: true, customer: null })}
              className="min-h-[36px] text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={16} />
              <span>+ New Customer</span>
            </Button>
          </div>
        </div>

        {/* =========================================================================
          SEARCH & FILTER TOOLBAR
      ========================================================================= */}
        <div className="p-3 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search by customer name or phone number..."
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text placeholder-pos-text-muted focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium"
            />
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-pos-text-muted">
              Page <strong className="text-pos-text">{page}</strong> of{' '}
              <strong className="text-pos-text">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1 rounded-md bg-pos-surface border border-pos-border text-pos-text-secondary hover:text-pos-text disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1 rounded-md bg-pos-surface border border-pos-border text-pos-text-secondary hover:text-pos-text disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
          DIRECTORY CONTENT AREA
      ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-pos-bg">
          {isCustomersLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
              <Spinner size="lg" />
              <span>Loading Customer Directory...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-3">
              <Users size={40} className="text-pos-text-muted/40" />
              <p className="font-bold text-base text-pos-text">No Customers Found</p>
              <p className="text-xs max-w-sm text-pos-text-secondary">
                {searchQuery
                  ? `No customers match search term "${searchQuery}".`
                  : 'No customer profiles registered yet. Click below to add your first customer.'}
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCustomerModal({ open: true, customer: null })}
                className="font-bold mt-2 shadow-xs"
              >
                + Register Customer
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {customers.map(c => {
                const defaultAddr = c.addresses.find(a => a.isDefault) || c.addresses[0];

                return (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs hover:border-pos-primary/40 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Name, Status & Edit */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-pos-text text-sm">{c.name}</h4>
                            <Badge
                              variant={c.isActive ? 'success' : 'default'}
                              size="sm"
                              className="text-[9px]"
                            >
                              {c.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-mono font-bold text-pos-primary mt-0.5">
                            <Phone size={12} />
                            <span>{c.phone}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setCustomerModal({ open: true, customer: c })}
                          className="p-1.5 rounded-md text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
                          aria-label="Edit customer"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>

                      {/* Address Preview */}
                      <div className="my-2.5 p-2.5 rounded-md bg-pos-surface-subtle border border-pos-border text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-pos-text-muted font-semibold">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-pos-primary" />
                            <span>
                              {c.addresses.length > 0
                                ? `${c.addresses.length} Saved Address${
                                    c.addresses.length > 1 ? 'es' : ''
                                  }`
                                : 'No Saved Address'}
                            </span>
                          </span>

                          {defaultAddr?.deliveryZone && (
                            <Badge variant="default" size="sm" className="text-[9px]">
                              {defaultAddr.deliveryZone.name}
                            </Badge>
                          )}
                        </div>

                        {defaultAddr ? (
                          <p className="text-pos-text font-medium line-clamp-1">
                            {defaultAddr.address}
                            {defaultAddr.landmark && ` (${defaultAddr.landmark})`}
                          </p>
                        ) : (
                          <p className="text-pos-text-muted italic text-[11px]">
                            Click Add Address to attach a delivery location.
                          </p>
                        )}
                      </div>

                      {/* Notes Preview */}
                      {c.notes && (
                        <div className="flex items-start gap-1 text-[11px] text-pos-text-secondary line-clamp-1 mb-2">
                          <FileText size={12} className="shrink-0 mt-0.5" />
                          <span>{c.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-3 border-t border-pos-border flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setAddressModalCustomer(c)}
                        className="text-xs text-pos-primary hover:underline font-semibold flex items-center gap-1"
                      >
                        <Plus size={12} /> + Address
                      </button>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedCustomerForDrawer(c)}
                          className="text-xs font-semibold flex items-center gap-1"
                        >
                          <span>Profile & History</span>
                          <ChevronRight size={13} />
                        </Button>

                        <button
                          type="button"
                          onClick={() => navigate('/orders')}
                          className="p-1.5 rounded-md bg-pos-primary-soft text-pos-primary hover:bg-pos-primary hover:text-white transition-colors"
                          title="Start POS Order"
                          aria-label="Start POS Order"
                        >
                          <ShoppingBag size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =========================================================================
          INTERACTIVE MODALS & DRAWERS
      ========================================================================= */}
        {customerModal.open && (
          <CustomerFormModal
            customer={customerModal.customer}
            zones={zones}
            onClose={() => setCustomerModal({ open: false, customer: null })}
            onSuccess={() => refetchCustomers()}
          />
        )}

        {addressModalCustomer && (
          <AddAddressModal
            customer={addressModalCustomer}
            zones={zones}
            onClose={() => setAddressModalCustomer(null)}
            onSuccess={() => refetchCustomers()}
          />
        )}

        {selectedCustomerForDrawer && (
          <CustomerDetailsDrawer
            customer={selectedCustomerForDrawer}
            currency={currency}
            onClose={() => setSelectedCustomerForDrawer(null)}
            onEdit={c => {
              setSelectedCustomerForDrawer(null);
              setCustomerModal({ open: true, customer: c });
            }}
            onAddAddress={c => {
              setSelectedCustomerForDrawer(null);
              setAddressModalCustomer(c);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
