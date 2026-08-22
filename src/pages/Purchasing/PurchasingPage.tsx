import React, { useState } from 'react';
import {
  usePurchasingOrdersQuery,
  useSuppliersQuery,
  usePurchasingSummaryQuery,
  useOrderPurchasingOrderMutation,
  useDeleteSupplierMutation,
} from '@/features/purchasing/hooks/usePurchasingData';
import {
  useInventoryItemsQuery,
  useInventoryLocationsQuery,
} from '@/features/inventory/hooks/useInventoryData';
import { useAuthStore } from '@/core/auth/authStore';
import {
  PurchasingOrderRecord,
  PurchasingSupplierRecord,
  PurchaseOrderStatus,
} from '@/types';
import { SupplierFormModal } from '@/features/purchasing/components/SupplierFormModal';
import { PurchaseOrderFormModal } from '@/features/purchasing/components/PurchaseOrderFormModal';
import { ReceiveGoodsModal } from '@/features/purchasing/components/ReceiveGoodsModal';
import { PurchaseReturnModal } from '@/features/purchasing/components/PurchaseReturnModal';
import { PurchaseOrderDetailsDrawer } from '@/features/purchasing/components/PurchaseOrderDetailsDrawer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  FileSpreadsheet,
  Truck,
  RotateCw,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Send,
  PackageCheck,
  Undo2,
  Edit2,
  Trash2,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';

type ActiveTab = 'orders' | 'suppliers' | 'analytics';

export const PurchasingPage: React.FC = () => {
  const { user } = useAuthStore();
  const currency =
    user && 'restaurant' in user && user.restaurant?.currency
      ? user.restaurant.currency
      : 'USD';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');

  // Filters for Orders
  const [orderStatus, setOrderStatus] = useState<PurchaseOrderStatus | 'ALL'>('ALL');
  const [orderSupplierId, setOrderSupplierId] = useState<string>('');
  const [orderSearch, setOrderSearch] = useState<string>('');

  // Filters for Suppliers
  const [supplierSearch, setSupplierSearch] = useState<string>('');

  // Modals & Drawer State
  const [poFormModal, setPoFormModal] = useState<{
    open: boolean;
    order?: PurchasingOrderRecord | null;
  }>({ open: false });

  const [supplierModal, setSupplierModal] = useState<{
    open: boolean;
    supplier?: PurchasingSupplierRecord | null;
  }>({ open: false });

  const [receiveModalOrder, setReceiveModalOrder] =
    useState<PurchasingOrderRecord | null>(null);

  const [returnModalOrder, setReturnModalOrder] = useState<PurchasingOrderRecord | null>(
    null
  );

  const [selectedOrderIdForDrawer, setSelectedOrderIdForDrawer] = useState<string | null>(
    null
  );

  // Queries
  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    isRefetching: isOrdersRefetching,
    refetch: refetchOrders,
  } = usePurchasingOrdersQuery({
    status: orderStatus !== 'ALL' ? orderStatus : undefined,
    supplierId: orderSupplierId || undefined,
    search: orderSearch.trim() || undefined,
    limit: 100,
  });

  const {
    data: suppliersData,
    isLoading: isSuppliersLoading,
    refetch: refetchSuppliers,
  } = useSuppliersQuery({
    search: supplierSearch.trim() || undefined,
    limit: 100,
  });

  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = usePurchasingSummaryQuery();

  const { data: inventoryItemsData } = useInventoryItemsQuery();
  const inventoryItems = inventoryItemsData?.items || [];
  const { data: locations = [] } = useInventoryLocationsQuery();

  const orderMutation = useOrderPurchasingOrderMutation();
  const deleteSupplierMutation = useDeleteSupplierMutation();

  const orders = ordersData?.items || [];
  const suppliers = suppliersData?.items || [];

  const handleRefreshAll = () => {
    refetchOrders();
    refetchSuppliers();
    refetchSummary();
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge variant="default" size="sm" className="text-[10px]">
            Draft
          </Badge>
        );
      case 'ORDERED':
        return (
          <Badge variant="warning" size="sm" className="text-[10px]">
            Ordered
          </Badge>
        );
      case 'PARTIALLY_RECEIVED':
        return (
          <Badge variant="warning" size="sm" className="text-[10px]">
            Partial Receipt
          </Badge>
        );
      case 'RECEIVED':
        return (
          <Badge variant="success" size="sm" className="text-[10px]">
            Received
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" size="sm" className="text-[10px]">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="sm" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  const handleDeleteSupplier = async (sup: PurchasingSupplierRecord) => {
    if (!window.confirm(`Are you sure you want to delete supplier "${sup.name}"?`)) {
      return;
    }
    try {
      await deleteSupplierMutation.mutateAsync(sup.id);
    } catch {
      // handled
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden select-none -m-4 md:-m-6 p-3 sm:p-4 bg-pos-bg">
      <div className="flex-1 flex flex-col min-w-0 bg-pos-surface border border-pos-border rounded-lg overflow-hidden shadow-xs">
        {/* =========================================================================
            TOP HEADER BAR: Metrics & CTAs
        ========================================================================= */}
        <div className="p-3 sm:p-3.5 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-pos-text">
                  Purchasing & Supplier Management
                </h2>
                <Badge variant="default" size="sm" className="text-[10px] font-mono">
                  {orders.length} Purchase Orders
                </Badge>
              </div>
              <p className="text-[11px] text-pos-text-muted mt-0.5 font-medium">
                Purchase orders, vendor profiles, partial/full goods receiving, and
                procurement history
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isOrdersRefetching}
              className="min-h-[36px] px-3 font-medium flex items-center gap-1.5"
            >
              <RotateCw size={14} className={isOrdersRefetching ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {activeTab === 'suppliers' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSupplierModal({ open: true, supplier: null })}
                className="min-h-[36px] text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={16} />
                <span>+ New Supplier</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setPoFormModal({ open: true, order: null })}
                className="min-h-[36px] text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={16} />
                <span>+ New Purchase Order</span>
              </Button>
            )}
          </div>
        </div>

        {/* =========================================================================
          SUMMARY METRICS TILES
      ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 border-b border-pos-border bg-pos-surface-subtle shrink-0">
          <div className="p-2.5 rounded-md bg-pos-surface border border-pos-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted block">
              Total Purchase Orders
            </span>
            <span className="text-sm sm:text-base font-mono font-bold text-pos-text mt-0.5 block">
              {summaryData?.totalOrders || orders.length}
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-pos-surface border border-pos-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-success block">
              Total Procurement Spend
            </span>
            <span className="text-sm sm:text-base font-mono font-bold text-pos-success mt-0.5 block">
              {formatPrice(summaryData?.totalSpend || 0)}
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-pos-surface border border-pos-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-primary block">
              Awaiting Goods Receipt
            </span>
            <span className="text-sm sm:text-base font-mono font-bold text-pos-primary mt-0.5 block">
              {
                orders.filter(o => ['ORDERED', 'PARTIALLY_RECEIVED'].includes(o.status))
                  .length
              }
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-pos-surface border border-pos-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted block">
              Active Suppliers
            </span>
            <span className="text-sm sm:text-base font-mono font-bold text-pos-text mt-0.5 block">
              {suppliers.filter(s => s.isActive).length} Vendors
            </span>
          </div>
        </div>

        {/* =========================================================================
          TAB NAVIGATION & FILTERS TOOLBAR
      ========================================================================= */}
        <div className="p-3 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Navigation Tabs */}
          <div className="p-0.5 rounded-md bg-pos-surface-subtle border border-pos-border flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5',
                activeTab === 'orders'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              <FileSpreadsheet size={13} />
              <span>Purchase Orders</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('suppliers')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5',
                activeTab === 'suppliers'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              <Truck size={13} />
              <span>Suppliers Directory</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5',
                activeTab === 'analytics'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              <TrendingUp size={13} />
              <span>Analytics</span>
            </button>
          </div>

          {/* Tab Specific Filters */}
          {activeTab === 'orders' && (
            <div className="flex items-center gap-2">
              {/* Status Filter */}
              <select
                value={orderStatus}
                onChange={e =>
                  setOrderStatus(e.target.value as PurchaseOrderStatus | 'ALL')
                }
                className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="ORDERED">Ordered</option>
                <option value="PARTIALLY_RECEIVED">Partially Received</option>
                <option value="RECEIVED">Received</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {/* Supplier Filter */}
              <select
                value={orderSupplierId}
                onChange={e => setOrderSupplierId(e.target.value)}
                className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary max-w-[150px]"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Search Bar */}
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  placeholder="Search PO #, invoice..."
                  className="pl-8 pr-3 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text placeholder-pos-text-muted focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary w-40 sm:w-48 font-medium"
                />
              </div>
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
              />
              <input
                type="text"
                value={supplierSearch}
                onChange={e => setSupplierSearch(e.target.value)}
                placeholder="Search vendor name, phone..."
                className="pl-8 pr-3 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text placeholder-pos-text-muted focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary w-56 font-medium"
              />
            </div>
          )}
        </div>

        {/* =========================================================================
          CONTENT AREA PER TAB
      ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-pos-bg">
          {/* TAB 1: PURCHASE ORDERS */}
          {activeTab === 'orders' && (
            <div>
              {isOrdersLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                  <Spinner size="lg" />
                  <span>Loading Purchase Orders...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-3">
                  <FileSpreadsheet size={40} className="text-pos-text-muted/40" />
                  <p className="font-bold text-base text-pos-text">
                    No Purchase Orders Found
                  </p>
                  <p className="text-xs max-w-sm text-pos-text-secondary">
                    {orderSearch || orderStatus !== 'ALL'
                      ? 'No purchase orders match your active status or search query.'
                      : 'No procurement orders created yet. Click below to draft your first PO.'}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setPoFormModal({ open: true, order: null })}
                    className="font-bold mt-2 shadow-xs"
                  >
                    + Create Purchase Order
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {orders.map(po => {
                    const totalItemsCount = po.items.length;
                    const totalQtyOrdered = po.items.reduce(
                      (acc, it) => acc + it.quantity,
                      0
                    );
                    const totalQtyReceived = po.items.reduce(
                      (acc, it) => acc + (it.quantityReceived || 0),
                      0
                    );

                    return (
                      <div
                        key={po.id}
                        className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs hover:border-pos-primary/40 transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Top Row: PO Number, Status */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono font-bold text-sm text-pos-text">
                              #{po.orderNumber}
                            </span>
                            {getStatusBadge(po.status)}
                          </div>

                          {/* Supplier Name & Date */}
                          <div className="mb-2.5">
                            <h4 className="font-bold text-pos-text text-sm">
                              {po.supplier?.name || 'Direct Procurement'}
                            </h4>
                            <div className="flex items-center gap-3 text-[11px] text-pos-text-muted mt-0.5">
                              <span className="flex items-center gap-1 font-mono">
                                <Calendar size={11} />{' '}
                                {new Date(po.createdAt).toLocaleDateString()}
                              </span>
                              {po.invoiceNumber && (
                                <span className="font-mono font-semibold text-pos-primary">
                                  Inv: {po.invoiceNumber}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Items & Total Breakdown */}
                          <div className="p-2.5 rounded-md bg-pos-surface-subtle border border-pos-border text-xs space-y-1.5 mb-2.5">
                            <div className="flex items-center justify-between text-pos-text-muted">
                              <span>
                                {totalItemsCount} Items ({totalQtyOrdered} units)
                              </span>
                              <span className="font-mono font-semibold text-pos-success">
                                Rec: {totalQtyReceived}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-pos-border text-xs font-bold text-pos-text">
                              <span>Grand Total</span>
                              <span className="font-mono text-pos-primary text-sm">
                                {formatPrice(po.grandTotal)}
                              </span>
                            </div>
                          </div>

                          {/* Location Preview */}
                          <div className="flex items-center gap-1 text-[11px] text-pos-text-muted mb-2 font-medium">
                            <MapPin size={11} className="text-pos-primary" />
                            <span>{po.location?.name || 'Main Kitchen Storage'}</span>
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="pt-3 border-t border-pos-border flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1">
                            {po.status === 'DRAFT' && (
                              <button
                                type="button"
                                onClick={() => orderMutation.mutate(po.id)}
                                className="px-2.5 py-1 rounded-md bg-pos-primary text-white font-semibold text-[11px] hover:bg-pos-primary-hover transition-colors flex items-center gap-1 shadow-xs"
                              >
                                <Send size={11} />
                                <span>Order</span>
                              </button>
                            )}

                            {(po.status === 'ORDERED' ||
                              po.status === 'PARTIALLY_RECEIVED') && (
                              <button
                                type="button"
                                onClick={() => setReceiveModalOrder(po)}
                                className="px-2.5 py-1 rounded-md bg-pos-success text-white font-semibold text-[11px] hover:bg-pos-success/90 transition-colors flex items-center gap-1 shadow-xs"
                              >
                                <PackageCheck size={12} />
                                <span>Receive</span>
                              </button>
                            )}

                            {(po.status === 'PARTIALLY_RECEIVED' ||
                              po.status === 'RECEIVED') && (
                              <button
                                type="button"
                                onClick={() => setReturnModalOrder(po)}
                                className="px-2 py-1 rounded-md bg-pos-surface border border-pos-border text-pos-danger hover:bg-pos-danger-soft font-semibold text-[11px] transition-colors flex items-center gap-1"
                              >
                                <Undo2 size={11} />
                                <span>Return</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedOrderIdForDrawer(po.id)}
                              className="text-xs font-semibold flex items-center gap-1"
                            >
                              <span>Details</span>
                              <ChevronRight size={12} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SUPPLIERS DIRECTORY */}
          {activeTab === 'suppliers' && (
            <div>
              {isSuppliersLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                  <Spinner size="lg" />
                  <span>Loading Suppliers Directory...</span>
                </div>
              ) : suppliers.length === 0 ? (
                <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-3">
                  <Truck size={40} className="text-pos-text-muted/40" />
                  <p className="font-bold text-base text-pos-text">No Suppliers Found</p>
                  <p className="text-xs max-w-sm text-pos-text-secondary">
                    {supplierSearch
                      ? `No suppliers match "${supplierSearch}".`
                      : 'No vendor profiles registered yet. Click below to register your first supplier.'}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSupplierModal({ open: true, supplier: null })}
                    className="font-bold mt-2 shadow-xs"
                  >
                    + Register Supplier
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {suppliers.map(sup => (
                    <div
                      key={sup.id}
                      className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs hover:border-pos-primary/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Name & Active Badge */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-pos-text text-sm">
                                {sup.name}
                              </h4>
                              <Badge
                                variant={sup.isActive ? 'success' : 'default'}
                                size="sm"
                                className="text-[9px]"
                              >
                                {sup.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>

                            {sup.contactPerson && (
                              <span className="text-xs text-pos-text-muted font-medium block mt-0.5">
                                Contact: {sup.contactPerson}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setSupplierModal({ open: true, supplier: sup })
                              }
                              className="p-1.5 rounded-md text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
                              aria-label="Edit supplier"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSupplier(sup)}
                              className="p-1.5 rounded-md text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger-soft transition-colors"
                              aria-label="Delete supplier"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="p-2.5 rounded-md bg-pos-surface-subtle border border-pos-border text-xs space-y-1.5 mb-2.5">
                          {sup.phone && (
                            <div className="flex items-center gap-2 text-pos-primary font-mono font-semibold">
                              <Phone size={12} />
                              <span>{sup.phone}</span>
                            </div>
                          )}
                          {sup.email && (
                            <div className="flex items-center gap-2 text-pos-text-muted font-mono">
                              <Mail size={12} />
                              <span>{sup.email}</span>
                            </div>
                          )}
                          {sup.address && (
                            <div className="flex items-center gap-2 text-pos-text font-medium line-clamp-1">
                              <MapPin size={12} className="text-pos-text-muted" />
                              <span>{sup.address}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metrics Footer */}
                      <div className="pt-2.5 border-t border-pos-border flex items-center justify-between text-[11px] text-pos-text-muted">
                        <span>{sup._count?.purchaseOrders || 0} Purchase Orders</span>
                        <span>{sup._count?.inventoryItems || 0} Linked Items</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROCUREMENT ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              {isSummaryLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                  <Spinner size="lg" />
                  <span>Loading Analytics...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Top Suppliers by Spend */}
                  <div className="p-4 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                      <Truck size={14} className="text-pos-primary" />
                      <span>Top Vendors by Procurement Spend</span>
                    </h4>

                    {summaryData?.topSuppliers && summaryData.topSuppliers.length > 0 ? (
                      <div className="space-y-2">
                        {summaryData.topSuppliers.map((sup, i) => (
                          <div
                            key={sup.supplierId}
                            className="p-3 rounded-md bg-pos-surface-subtle border border-pos-border text-xs flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-pos-text block">
                                #{i + 1} {sup.name}
                              </span>
                              <span className="text-[10px] text-pos-text-muted font-mono">
                                {sup.ordersCount} Purchase Orders
                              </span>
                            </div>

                            <span className="font-mono font-bold text-pos-success">
                              {formatPrice(sup.totalSpend)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-pos-text-muted">
                        No supplier spend data available yet.
                      </div>
                    )}
                  </div>

                  {/* Top Purchased Items */}
                  <div className="p-4 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                      <FileSpreadsheet size={14} className="text-pos-primary" />
                      <span>Top Purchased Ingredients & Supplies</span>
                    </h4>

                    {summaryData?.topPurchasedItems &&
                    summaryData.topPurchasedItems.length > 0 ? (
                      <div className="space-y-2">
                        {summaryData.topPurchasedItems.map((it, i) => (
                          <div
                            key={it.inventoryItemId}
                            className="p-3 rounded-md bg-pos-surface-subtle border border-pos-border text-xs flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-pos-text block">
                                #{i + 1} {it.name}
                              </span>
                              <span className="text-[10px] text-pos-text-muted font-mono">
                                Total Qty: {it.totalQuantity} {it.unit}
                              </span>
                            </div>

                            <span className="font-mono font-bold text-pos-primary">
                              {formatPrice(it.totalSpend)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-pos-text-muted">
                        No purchased items data available yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =========================================================================
          INTERACTIVE MODALS & DRAWERS
      ========================================================================= */}
        {poFormModal.open && (
          <PurchaseOrderFormModal
            order={poFormModal.order}
            suppliers={suppliers}
            inventoryItems={inventoryItems}
            locations={locations}
            currency={currency}
            onClose={() => setPoFormModal({ open: false, order: null })}
            onSuccess={() => refetchOrders()}
          />
        )}

        {supplierModal.open && (
          <SupplierFormModal
            supplier={supplierModal.supplier}
            onClose={() => setSupplierModal({ open: false, supplier: null })}
            onSuccess={() => refetchSuppliers()}
          />
        )}

        {receiveModalOrder && (
          <ReceiveGoodsModal
            order={receiveModalOrder}
            locations={locations}
            onClose={() => setReceiveModalOrder(null)}
            onSuccess={() => {
              refetchOrders();
              if (selectedOrderIdForDrawer) {
                // drawer will refetch via react-query
              }
            }}
          />
        )}

        {returnModalOrder && (
          <PurchaseReturnModal
            order={returnModalOrder}
            onClose={() => setReturnModalOrder(null)}
            onSuccess={() => {
              refetchOrders();
            }}
          />
        )}

        {selectedOrderIdForDrawer && (
          <PurchaseOrderDetailsDrawer
            orderId={selectedOrderIdForDrawer}
            currency={currency}
            onClose={() => setSelectedOrderIdForDrawer(null)}
            onEdit={ord => {
              setSelectedOrderIdForDrawer(null);
              setPoFormModal({ open: true, order: ord });
            }}
            onReceive={ord => {
              setReceiveModalOrder(ord);
            }}
            onReturn={ord => {
              setReturnModalOrder(ord);
            }}
            onSuccess={() => {
              refetchOrders();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PurchasingPage;
