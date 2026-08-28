import React, { useState, useMemo } from 'react';
import { PosMenuItem, OrderType, OrderRecord, PaymentResponseData } from '@/types';
import {
  usePosMenuQuery,
  useCreateOrderMutation,
} from '@/features/orders/hooks/usePosData';
import { useCartStore, useCartTotals } from '@/features/orders/store/cartStore';
import { useAuthStore } from '@/core/auth/authStore';
import { PromotionsApi } from '@/core/api/promotionsApi';
import { ItemCustomizerModal } from '@/features/orders/components/ItemCustomizerModal';
import { TableSelectorModal } from '@/features/orders/components/TableSelectorModal';
import { CustomerModal } from '@/features/orders/components/CustomerModal';
import { PaymentModal } from '@/features/orders/components/PaymentModal';
import { OrderSuccessModal } from '@/features/orders/components/OrderSuccessModal';
import { BillReceiptModal } from '@/components/receipts/BillReceiptModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  ShoppingBag,
  UtensilsCrossed,
  Package,
  Truck,
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Send,
  User,
  AlertCircle,
  FileText,
  MapPin,
  LayoutGrid,
  Tag,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const OrdersPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    data: menuData,
    isLoading: isMenuLoading,
    error: menuError,
  } = usePosMenuQuery();
  const createOrderMutation = useCreateOrderMutation();

  // Cart Store
  const {
    orderType,
    selectedTable,
    guestCount,
    customer,
    items: cartItems,
    notes: orderNotes,
    addItem,
    updateQuantity,
    removeItem,
    setOrderType,
    setSelectedTable,
    setGuestCount,
    setNotes: setOrderNotes,
    clearCart,
    resetAll,
  } = useCartStore();

  // Extract restaurant tax rate & currency from auth user state
  const restaurantTaxRate =
    user && 'restaurant' in user && user.restaurant?.taxRate
      ? Number(user.restaurant.taxRate)
      : 8.875;
  const currency =
    user && 'restaurant' in user && user.restaurant?.currency
      ? user.restaurant.currency
      : 'PKR';

  const {
    subtotal,
    itemCount,
    discountAmount,
    discountType,
    discountValue,
    discountReason,
    promoCode,
    promoName,
    taxAmount,
    deliveryCharge,
    packagingCharge,
    grandTotal,
    formatPrice,
    setDiscount,
    setPromoDiscount,
    clearDiscount,
  } = useCartTotals(restaurantTaxRate, currency);

  // Local View State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customizingItem, setCustomizingItem] = useState<PosMenuItem | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [activePaymentOrder, setActivePaymentOrder] = useState<OrderRecord | null>(null);
  const [completedPaymentResult, setCompletedPaymentResult] =
    useState<PaymentResponseData | null>(null);
  const [savedReceiptOrder, setSavedReceiptOrder] = useState<OrderRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotesExpanded, setIsNotesExpanded] = useState<boolean>(false);
  const [isDiscountExpanded, setIsDiscountExpanded] = useState<boolean>(false);
  const [discountTab, setDiscountTab] = useState<'MANUAL' | 'PROMO'>('PROMO');
  const [manualDiscountType, setManualDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [manualDiscountValue, setManualDiscountValue] = useState<string>('');
  const [manualDiscountReason, setManualDiscountReason] = useState<string>('');
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [isApplyingPromo, setIsApplyingPromo] = useState<boolean>(false);
  const [promoErrorMessage, setPromoErrorMessage] = useState<string | null>(null);

  // Filter Categories & Items
  const categories = useMemo(() => menuData?.categories || [], [menuData]);

  const allItems = useMemo(() => {
    return categories.flatMap(cat => cat.items);
  }, [categories]);

  const filteredItems = useMemo(() => {
    let itemsToFilter =
      selectedCategoryId === 'ALL'
        ? allItems
        : categories.find(c => c.id === selectedCategoryId)?.items || [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      itemsToFilter = itemsToFilter.filter(
        item =>
          item.name.toLowerCase().includes(q) ||
          item.itemCode.toLowerCase().includes(q) ||
          (item.urduName && item.urduName.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q))
      );
    }

    return itemsToFilter;
  }, [categories, allItems, selectedCategoryId, searchQuery]);

  const currentCategoryName = useMemo(() => {
    if (selectedCategoryId === 'ALL') return 'All Menu Items';
    return categories.find(c => c.id === selectedCategoryId)?.name || 'Category';
  }, [categories, selectedCategoryId]);

  // Click on menu item card
  const handleItemCardClick = (item: PosMenuItem) => {
    // If item has portion variants or modifier groups, open customizer modal
    if (item.variants.length > 0 || item.modifierGroups.length > 0) {
      setCustomizingItem(item);
    } else {
      // Direct standard item add
      addItem({
        menuItemId: item.id,
        itemCode: item.itemCode,
        itemName: item.name,
        urduName: item.urduName,
        unitPrice: item.basePrice,
        modifiersPrice: 0,
        quantity: 1,
        selectedModifiers: [],
      });
    }
  };

  // Prepare CreateOrderInput payload for backend
  const buildOrderPayload = () => {
    return {
      orderType,
      tableId: orderType === 'DINE_IN' ? selectedTable?.id : undefined,
      guestCount: orderType === 'DINE_IN' ? guestCount : undefined,
      customerName: customer?.name || undefined,
      customerPhone: customer?.phone || undefined,
      deliveryAddress: customer?.address || undefined,
      flatDeliveryFee: orderType === 'DELIVERY' ? deliveryCharge : undefined,
      packagingCharge: orderType === 'TAKEAWAY' ? packagingCharge : undefined,
      notes: orderNotes.trim() || undefined,
      promoCode: promoCode.trim() || undefined,
      orderDiscountType: discountValue > 0 && !promoCode ? discountType : undefined,
      orderDiscountValue: discountValue > 0 && !promoCode ? discountValue : undefined,
      orderDiscountReason:
        discountValue > 0 && !promoCode
          ? discountReason.trim() || 'POS Order Discount'
          : undefined,
      items: cartItems.map(item => ({
        menuItemId: item.menuItemId,
        variantId: item.variantId,
        quantity: item.quantity,
        modifierIds: item.selectedModifiers.map(m => m.modifierId),
        specialInstructions: item.specialInstructions,
      })),
    };
  };

  // Action: Validate & Apply Promo Code in real-time
  const handleApplyPromoCode = async () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    if (cartItems.length === 0) {
      setPromoErrorMessage('Please add items to cart before applying promo code.');
      return;
    }

    setIsApplyingPromo(true);
    setPromoErrorMessage(null);

    try {
      const res = await PromotionsApi.validateCode({
        code,
        orderType,
        customerId: customer?.id || undefined,
        items: cartItems.map(item => ({
          menuItemId: item.menuItemId,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          modifiersPrice: item.modifiersPrice,
          modifierIds: item.selectedModifiers.map(m => m.modifierId),
        })),
      });

      if (res && res.isValid) {
        let discountVal = res.estimatedDiscount ?? 0;
        if (discountVal === 0 && res.promotion) {
          if (res.promotion.type === 'PERCENTAGE') {
            discountVal = Math.min(
              res.promotion.maxDiscountAmount || Infinity,
              (subtotal * res.promotion.discountValue) / 100
            );
          } else if (res.promotion.type === 'FIXED_AMOUNT') {
            discountVal = Math.min(subtotal, res.promotion.discountValue);
          }
        }

        setPromoDiscount(code, discountVal, res.promotion?.name || code);
        setIsDiscountExpanded(false);
        setPromoCodeInput('');
        setPromoErrorMessage(null);
      } else {
        setPromoErrorMessage('Promo code could not be validated.');
      }
    } catch (err: unknown) {
      const apiErrMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      const msg =
        apiErrMsg || (err instanceof Error ? err.message : 'Invalid or ineligible promo code');
      setPromoErrorMessage(msg);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // 1. Action: Save / Send Order (No Immediate Tender)
  const handleSaveOrder = async () => {
    if (cartItems.length === 0) return;
    if (orderType === 'DINE_IN' && !selectedTable) {
      setErrorMessage('Please select a dining table before saving the order.');
      setIsTableModalOpen(true);
      return;
    }

    setErrorMessage(null);
    try {
      const response = await createOrderMutation.mutateAsync(buildOrderPayload());
      resetAll();
      setSavedReceiptOrder(response.order);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save order';
      setErrorMessage(msg);
    }
  };

  // 2. Action: Pay / Checkout Order (Create order and open Payment Tender modal)
  const handleCheckoutPayment = async () => {
    if (cartItems.length === 0) return;
    if (orderType === 'DINE_IN' && !selectedTable) {
      setErrorMessage('Please select a dining table before proceeding to payment.');
      setIsTableModalOpen(true);
      return;
    }

    setErrorMessage(null);
    try {
      const response = await createOrderMutation.mutateAsync(buildOrderPayload());
      setActivePaymentOrder(response.order);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create order for checkout';
      setErrorMessage(msg);
    }
  };

  const channelOptions: Array<{
    id: OrderType;
    label: string;
    icon: typeof UtensilsCrossed;
  }> = [
    { id: 'DINE_IN', label: 'Dine-In', icon: UtensilsCrossed },
    { id: 'TAKEAWAY', label: 'Takeaway', icon: Package },
    { id: 'DELIVERY', label: 'Delivery', icon: Truck },
  ];

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col xl:flex-row gap-3 overflow-hidden select-none -m-4 md:-m-6 p-2 sm:p-3 bg-pos-bg">
      {/* =========================================================================
          ZONE 1 (LEFT): Order Channel & Category Navigation (~210px)
      ========================================================================= */}
      <div className="w-full xl:w-[215px] flex flex-col bg-pos-surface border border-pos-border rounded-lg overflow-hidden shrink-0 shadow-xs">
        {/* Order Channel Selector (Dine-In / Takeaway / Delivery) */}
        <div className="p-2 border-b border-pos-border bg-pos-surface shrink-0">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-pos-text-muted mb-1.5 px-0.5">
            Order Channel
          </label>
          <div className="grid grid-cols-3 gap-1 bg-pos-surface-subtle p-1 rounded-md border border-pos-border">
            {channelOptions.map(ch => {
              const Icon = ch.icon;
              const isSelected = orderType === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setOrderType(ch.id)}
                  title={ch.label}
                  className={cn(
                    'flex flex-col items-center justify-center py-1.5 px-1 rounded transition-colors text-center min-h-[44px]',
                    isSelected
                      ? 'bg-pos-primary text-white font-semibold shadow-xs'
                      : 'text-pos-text-secondary hover:text-pos-text hover:bg-pos-surface'
                  )}
                >
                  <Icon size={16} />
                  <span className="text-[10px] mt-0.5 leading-tight">{ch.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Channel Context Summary Card (Dynamic based on selected channel) */}
        <div className="p-2 border-b border-pos-border bg-pos-surface-subtle/50 shrink-0">
          {orderType === 'DINE_IN' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted">
                  Table Context
                </span>
                {selectedTable && (
                  <button
                    type="button"
                    onClick={() => setIsTableModalOpen(true)}
                    className="text-[10px] font-semibold text-pos-primary hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsTableModalOpen(true)}
                className={cn(
                  'w-full p-2 rounded-md border text-left transition-colors flex items-center justify-between min-h-[40px]',
                  selectedTable
                    ? 'border-pos-primary/40 bg-pos-primary-soft/40 text-pos-text'
                    : 'border-dashed border-pos-warning bg-pos-warning-soft text-pos-warning font-medium'
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <UtensilsCrossed size={14} className="shrink-0 text-pos-primary" />
                  <span className="text-xs font-semibold truncate">
                    {selectedTable ? selectedTable.name : 'Select Table *'}
                  </span>
                </div>
                {selectedTable && (
                  <span className="text-[11px] font-bold font-mono text-pos-primary bg-pos-surface px-1.5 py-0.5 rounded border border-pos-border">
                    {guestCount}p
                  </span>
                )}
              </button>

              {/* Guest Count Stepper (if table selected) */}
              {selectedTable && (
                <div className="flex items-center justify-between text-xs px-0.5 pt-0.5">
                  <span className="text-[11px] text-pos-text-muted">Guests:</span>
                  <div className="flex items-center gap-1 bg-pos-surface border border-pos-border rounded p-0.5">
                    <button
                      type="button"
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      className="h-5 w-5 rounded hover:bg-pos-surface-subtle text-pos-text-muted hover:text-pos-text flex items-center justify-center"
                      title="Decrease guest count"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-5 text-center font-bold text-[11px] font-mono text-pos-text">
                      {guestCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGuestCount(guestCount + 1)}
                      className="h-5 w-5 rounded hover:bg-pos-surface-subtle text-pos-text-muted hover:text-pos-text flex items-center justify-center"
                      title="Increase guest count"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {orderType === 'TAKEAWAY' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted">
                  Takeaway Order
                </span>
                <Badge variant="warning" size="sm">
                  Pickup
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="w-full p-2 rounded-md border border-pos-border bg-pos-surface text-left transition-colors hover:border-pos-border-strong flex items-center justify-between min-h-[40px]"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <User size={14} className="shrink-0 text-pos-primary" />
                  <span className="text-xs font-medium truncate text-pos-text">
                    {customer?.name || 'Customer Name (Optional)'}
                  </span>
                </div>
              </button>
            </div>
          )}

          {orderType === 'DELIVERY' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted">
                  Delivery Details
                </span>
                <span className="text-[10px] font-bold font-mono text-pos-primary">
                  +{formatPrice(deliveryCharge)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className={cn(
                  'w-full p-2 rounded-md border text-left transition-colors flex items-center justify-between min-h-[40px]',
                  customer?.name || customer?.address
                    ? 'border-pos-primary/40 bg-pos-primary-soft/40 text-pos-text'
                    : 'border-dashed border-pos-warning bg-pos-warning-soft text-pos-warning font-medium'
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin size={14} className="shrink-0 text-pos-primary" />
                  <span className="text-xs font-medium truncate">
                    {customer?.name || 'Set Recipient & Address *'}
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Categories Header */}
        <div className="px-3 py-2 border-b border-pos-border flex items-center justify-between shrink-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-pos-text-secondary">
            Categories
          </span>
          <span className="text-[10px] font-mono text-pos-text-muted">
            {categories.length} total
          </span>
        </div>

        {/* Vertical Categories List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
          {/* All Categories Option */}
          <button
            type="button"
            onClick={() => setSelectedCategoryId('ALL')}
            className={cn(
              'w-full px-2.5 py-2 rounded-md text-left text-xs font-medium transition-colors flex items-center justify-between min-h-[42px]',
              selectedCategoryId === 'ALL'
                ? 'bg-pos-primary-soft text-pos-primary font-semibold border-l-4 border-pos-primary'
                : 'text-pos-text-secondary hover:text-pos-text hover:bg-pos-surface-subtle border-l-4 border-transparent'
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <LayoutGrid size={15} className="shrink-0" />
              <span className="truncate">All Items</span>
            </div>
            <span className="text-[11px] font-mono opacity-80 shrink-0 ml-1">
              {allItems.length}
            </span>
          </button>

          {/* Individual Categories */}
          {categories.map(cat => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={cn(
                  'w-full px-2.5 py-2 rounded-md text-left text-xs font-medium transition-colors flex items-center justify-between min-h-[42px]',
                  isSelected
                    ? 'bg-pos-primary-soft text-pos-primary font-semibold border-l-4 border-pos-primary'
                    : 'text-pos-text-secondary hover:text-pos-text hover:bg-pos-surface-subtle border-l-4 border-transparent'
                )}
              >
                <span className="truncate">{cat.name}</span>
                <span className="text-[11px] font-mono opacity-80 shrink-0 ml-1">
                  {cat.items.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          ZONE 2 (CENTER): Menu Items Catalog Grid (flex-1)
      ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-pos-surface border border-pos-border rounded-lg overflow-hidden shadow-xs">
        {/* Center Header: Search, Category Title, Item Count */}
        <div className="p-3 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-pos-text leading-tight flex items-center gap-2">
              <span>{currentCategoryName}</span>
              <span className="text-xs font-normal text-pos-text-muted">
                ({filteredItems.length} items)
              </span>
            </h2>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by item name or #code..."
              className="w-full pl-8 pr-7 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium min-h-[38px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-pos-text-muted hover:text-pos-text"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Menu Items Grid Viewport */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
          {isMenuLoading && (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
              <Spinner size="lg" />
              <span>Loading POS Menu Catalog...</span>
            </div>
          )}

          {menuError && (
            <div className="p-3.5 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span className="font-medium">
                Failed to load menu items. Please verify network connection.
              </span>
            </div>
          )}

          {!isMenuLoading && filteredItems.length === 0 && (
            <div className="py-24 text-center text-xs text-pos-text-muted">
              No menu items found matching "{searchQuery || currentCategoryName}".
            </div>
          )}

          {!isMenuLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
              {filteredItems.map(item => {
                const hasCustomizations =
                  item.variants.length > 0 || item.modifierGroups.length > 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemCardClick(item)}
                    className="p-3 rounded-lg border border-pos-border bg-pos-surface hover:border-pos-border-strong hover:bg-pos-surface-subtle transition-colors text-left flex flex-col justify-between min-h-[110px] shadow-xs relative group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] font-mono text-pos-primary font-bold bg-pos-primary-soft px-1.5 py-0.5 rounded">
                          #{item.itemCode}
                        </span>
                        {hasCustomizations && (
                          <span className="text-[9px] font-semibold text-pos-text-muted bg-pos-surface-subtle px-1.5 py-0.5 rounded border border-pos-border">
                            Custom
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-pos-text mt-1.5 line-clamp-2 leading-snug">
                        {item.name}
                      </h4>
                      {item.urduName && (
                        <p className="text-[10px] text-pos-text-muted truncate mt-0.5">
                          {item.urduName}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-pos-border mt-2">
                      <span className="text-xs font-bold font-mono text-pos-primary">
                        {formatPrice(item.basePrice)}
                      </span>
                      <div className="h-6 w-6 rounded bg-pos-primary-soft group-hover:bg-pos-primary group-hover:text-white text-pos-primary flex items-center justify-center transition-colors">
                        <Plus size={14} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          ZONE 3 (RIGHT): Persistent Cart & Tender Checkout (~390px)
      ========================================================================= */}
      <div className="w-full xl:w-[390px] flex flex-col bg-pos-surface border border-pos-border rounded-lg overflow-hidden shrink-0 shadow-xs">
        {/* Cart Header */}
        <div className="p-3 border-b border-pos-border bg-pos-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-pos-primary-soft text-pos-primary flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-pos-text leading-tight">
                Active Order Cart
              </h3>
              <p className="text-[10px] text-pos-text-muted uppercase font-medium">
                {orderType === 'DINE_IN'
                  ? selectedTable
                    ? `Dine-In • ${selectedTable.name}`
                    : 'Dine-In (No Table)'
                  : orderType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="default" size="sm">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Badge>
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                aria-label="Clear cart"
                className="p-1 rounded text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger-soft transition-colors"
                title="Clear all cart items"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-2.5 bg-pos-danger-soft border-b border-[#FECACA] text-pos-danger text-xs flex items-center gap-2 shrink-0">
            <AlertCircle size={15} className="shrink-0" />
            <span className="flex-1 font-medium">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Cart Line Items List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {cartItems.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-2.5 text-pos-text-muted text-xs">
              <div className="h-10 w-10 rounded-lg bg-pos-surface-subtle border border-pos-border flex items-center justify-center text-pos-text-muted">
                <ShoppingBag size={20} />
              </div>
              <p className="font-semibold text-pos-text">Cart is empty</p>
              <p className="text-[11px] text-pos-text-muted max-w-[200px]">
                Tap any menu item to add it to this order
              </p>
            </div>
          ) : (
            cartItems.map(item => (
              <div
                key={item.id}
                className="p-2.5 rounded-lg bg-pos-surface border border-pos-border text-xs space-y-1.5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-pos-text">{item.itemName}</span>
                    {item.variantName && (
                      <span className="text-[11px] text-pos-primary font-medium ml-1.5">
                        ({item.variantName})
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-pos-text shrink-0 font-mono">
                    {formatPrice(item.itemGrossTotal)}
                  </span>
                </div>

                {/* Modifiers List */}
                {item.selectedModifiers.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {item.selectedModifiers.map((mod, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-pos-surface-subtle border border-pos-border px-1.5 py-0.5 rounded text-pos-text-secondary font-medium"
                      >
                        +{mod.name}
                        {mod.priceAdjustment > 0 &&
                          ` (${formatPrice(mod.priceAdjustment)})`}
                      </span>
                    ))}
                  </div>
                )}

                {/* Special Instructions */}
                {item.specialInstructions && (
                  <p className="text-[11px] text-pos-text-muted italic flex items-center gap-1">
                    <FileText size={11} /> {item.specialInstructions}
                  </p>
                )}

                {/* Stepper Quantity & Remove */}
                <div className="flex items-center justify-between pt-1 border-t border-pos-border">
                  <span className="text-[11px] text-pos-text-muted font-mono">
                    {formatPrice(item.unitPrice + item.modifiersPrice)} / unit
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="h-7 w-7 rounded border border-pos-border bg-pos-surface hover:bg-pos-surface-subtle text-pos-text flex items-center justify-center active:scale-95 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center font-bold font-mono text-xs text-pos-text">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                      className="h-7 w-7 rounded border border-pos-border bg-pos-surface hover:bg-pos-surface-subtle text-pos-text flex items-center justify-center active:scale-95 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove item"
                      className="h-7 w-7 ml-1 rounded hover:bg-pos-danger-soft text-pos-text-muted hover:text-pos-danger flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Optional Order Notes (Collapsible) */}
        {cartItems.length > 0 && (
          <div className="px-3 py-1.5 border-t border-pos-border bg-pos-surface shrink-0">
            {isNotesExpanded ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-pos-text-secondary">
                    Order Kitchen Notes
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNotesExpanded(false)}
                    className="text-pos-text-muted hover:text-pos-text"
                  >
                    Close
                  </button>
                </div>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="e.g. Table request, quick prep..."
                  className="w-full px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text placeholder-pos-text-muted/60 focus:outline-none focus:ring-1 focus:ring-pos-primary"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsNotesExpanded(true)}
                className="text-[11px] text-pos-text-muted hover:text-pos-text flex items-center gap-1 font-medium"
              >
                <FileText size={12} />
                <span>{orderNotes ? `Note: ${orderNotes}` : '+ Add order note'}</span>
              </button>
            )}
          </div>
        )}

        {/* Financial Summary Calculation Panel */}
        <div className="p-3 border-t border-pos-border bg-pos-surface space-y-1.5 shrink-0 text-xs">
          <div className="flex justify-between text-pos-text-muted">
            <span>Subtotal:</span>
            <span className="font-mono text-pos-text font-semibold">
              {formatPrice(subtotal)}
            </span>
          </div>

          {/* Discount Section */}
          {discountAmount > 0 ? (
            <div className="flex items-center justify-between text-pos-success font-medium bg-pos-success-soft/30 px-2 py-1 rounded border border-pos-success/30">
              <div className="flex items-center gap-1 min-w-0">
                <Tag size={13} className="shrink-0 text-pos-success" />
                <span className="truncate text-[11px]">
                  Discount ({promoCode ? `Code: ${promoCode}${promoName ? ` - ${promoName}` : ''}` : discountType === 'PERCENTAGE' ? `${discountValue}% OFF` : 'Flat OFF'})
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-mono text-xs font-bold">-{formatPrice(discountAmount)}</span>
                <button
                  type="button"
                  onClick={clearDiscount}
                  title="Remove Discount"
                  className="text-pos-text-muted hover:text-pos-danger transition-colors ml-0.5"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              {isDiscountExpanded ? (
                <div className="p-2 rounded-md bg-pos-surface-subtle border border-pos-border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-pos-text flex items-center gap-1">
                      <Tag size={13} className="text-pos-primary" />
                      <span>Order Discount & Coupon</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDiscountExpanded(false);
                        setPromoErrorMessage(null);
                      }}
                      className="text-pos-text-muted hover:text-pos-text text-[11px]"
                    >
                      Close
                    </button>
                  </div>

                  {/* Tabs: Promo vs Manual */}
                  <div className="grid grid-cols-2 gap-1 bg-pos-surface p-0.5 rounded border border-pos-border">
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountTab('PROMO');
                        setPromoErrorMessage(null);
                      }}
                      className={cn(
                        'py-1 text-[11px] font-medium rounded text-center transition-colors',
                        discountTab === 'PROMO'
                          ? 'bg-pos-primary text-white font-semibold'
                          : 'text-pos-text-secondary hover:text-pos-text'
                      )}
                    >
                      Promo Code
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountTab('MANUAL');
                        setPromoErrorMessage(null);
                      }}
                      className={cn(
                        'py-1 text-[11px] font-medium rounded text-center transition-colors',
                        discountTab === 'MANUAL'
                          ? 'bg-pos-primary text-white font-semibold'
                          : 'text-pos-text-secondary hover:text-pos-text'
                      )}
                    >
                      Manual Discount
                    </button>
                  </div>

                  {discountTab === 'PROMO' ? (
                    <div className="space-y-1.5 pt-0.5">
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          handleApplyPromoCode();
                        }}
                        className="flex gap-1.5"
                      >
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={e => {
                            setPromoCodeInput(e.target.value.toUpperCase());
                            setPromoErrorMessage(null);
                          }}
                          placeholder="e.g. JASHAN15, BBQFEAST"
                          className="flex-1 px-2 py-1 rounded bg-pos-surface border border-pos-border text-xs text-pos-text focus:outline-none focus:border-pos-primary font-mono uppercase"
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          disabled={!promoCodeInput.trim() || isApplyingPromo}
                          isLoading={isApplyingPromo}
                        >
                          Apply Code
                        </Button>
                      </form>
                      {promoErrorMessage && (
                        <div className="text-[11px] text-pos-danger bg-pos-danger-soft/40 px-2 py-1 rounded border border-pos-danger/30 flex items-center gap-1 font-medium">
                          <AlertCircle size={12} className="shrink-0" />
                          <span>{promoErrorMessage}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setManualDiscountType('PERCENTAGE')}
                          className={cn(
                            'flex-1 py-1 text-[11px] rounded border text-center font-semibold transition-colors',
                            manualDiscountType === 'PERCENTAGE'
                              ? 'border-pos-primary bg-pos-primary-soft text-pos-primary'
                              : 'border-pos-border text-pos-text-muted hover:text-pos-text'
                          )}
                        >
                          Percentage (%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualDiscountType('FIXED_AMOUNT')}
                          className={cn(
                            'flex-1 py-1 text-[11px] rounded border text-center font-semibold transition-colors',
                            manualDiscountType === 'FIXED_AMOUNT'
                              ? 'border-pos-primary bg-pos-primary-soft text-pos-primary'
                              : 'border-pos-border text-pos-text-muted hover:text-pos-text'
                          )}
                        >
                          Flat Amount ({currency})
                        </button>
                      </div>

                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={manualDiscountValue}
                          onChange={e => setManualDiscountValue(e.target.value)}
                          placeholder={manualDiscountType === 'PERCENTAGE' ? 'e.g. 10 (%)' : `e.g. 100 (${currency})`}
                          className="flex-1 px-2 py-1 rounded bg-pos-surface border border-pos-border text-xs text-pos-text focus:outline-none focus:border-pos-primary font-mono"
                        />
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={!manualDiscountValue || parseFloat(manualDiscountValue) <= 0}
                          onClick={() => {
                            const val = parseFloat(manualDiscountValue);
                            if (val > 0) {
                              setDiscount(manualDiscountType, val, manualDiscountReason);
                              setIsDiscountExpanded(false);
                              setManualDiscountValue('');
                              setManualDiscountReason('');
                            }
                          }}
                        >
                          Apply
                        </Button>
                      </div>

                      <input
                        type="text"
                        value={manualDiscountReason}
                        onChange={e => setManualDiscountReason(e.target.value)}
                        placeholder="Discount reason (e.g. Staff / VIP / Promo)"
                        className="w-full px-2 py-1 rounded bg-pos-surface border border-pos-border text-[11px] text-pos-text focus:outline-none focus:border-pos-primary"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDiscountExpanded(true)}
                  className="w-full text-left text-[11px] text-pos-primary hover:underline font-semibold flex items-center gap-1 py-0.5"
                >
                  <Tag size={12} />
                  <span>+ Apply Discount / Coupon Code</span>
                </button>
              )}
            </div>
          )}

          <div className="flex justify-between text-pos-text-muted">
            <span>Estimated Tax ({restaurantTaxRate}%):</span>
            <span className="font-mono text-pos-text">{formatPrice(taxAmount)}</span>
          </div>

          {orderType === 'DELIVERY' && (
            <div className="flex justify-between text-pos-text-muted">
              <span>Delivery Fee:</span>
              <span className="font-mono text-pos-text">
                {formatPrice(deliveryCharge)}
              </span>
            </div>
          )}

          {orderType === 'TAKEAWAY' && packagingCharge > 0 && (
            <div className="flex justify-between text-pos-text-muted">
              <span>Packaging Charge:</span>
              <span className="font-mono text-pos-text">
                {formatPrice(packagingCharge)}
              </span>
            </div>
          )}

          {/* Prominent Grand Total Container */}
          <div className="p-3 rounded-lg bg-pos-surface-subtle border border-pos-border flex items-center justify-between mt-1 shadow-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pos-text-muted">
                Grand Total
              </span>
              <p className="text-xl font-black text-pos-primary font-mono leading-tight mt-0.5">
                {formatPrice(grandTotal)}
              </p>
            </div>
            <Badge variant="default" size="sm">
              {itemCount} Items
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleSaveOrder}
              disabled={cartItems.length === 0 || createOrderMutation.isPending}
              isLoading={createOrderMutation.isPending}
              className="text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[42px]"
            >
              <Send size={14} />
              <span>Save Order</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleCheckoutPayment}
              disabled={cartItems.length === 0 || createOrderMutation.isPending}
              isLoading={createOrderMutation.isPending}
              className="text-xs font-bold flex items-center justify-center gap-1.5 min-h-[42px] shadow-xs"
            >
              <CreditCard size={15} />
              <span>Pay Tender</span>
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODALS INTEGRATION
      ========================================================================= */}
      {/* 1. Item Customizer (Portions & Modifiers) */}
      {customizingItem && (
        <ItemCustomizerModal
          item={customizingItem}
          currency={currency}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={configuredItem => {
            addItem(configuredItem);
            setCustomizingItem(null);
          }}
        />
      )}

      {/* 2. Table Selector (Dine-In) */}
      {isTableModalOpen && (
        <TableSelectorModal
          currentTableId={selectedTable?.id}
          onSelectTable={table => {
            setSelectedTable(table);
            setErrorMessage(null);
          }}
          onClose={() => setIsTableModalOpen(false)}
        />
      )}

      {/* 3. Customer Info (Takeaway & Delivery) */}
      {isCustomerModalOpen && (
        <CustomerModal onClose={() => setIsCustomerModalOpen(false)} />
      )}

      {/* 4. Payment Tender Modal */}
      {activePaymentOrder && (
        <PaymentModal
          order={activePaymentOrder}
          currency={currency}
          onClose={() => setActivePaymentOrder(null)}
          onPaymentSuccess={result => {
            setActivePaymentOrder(null);
            resetAll();
            setCompletedPaymentResult(result);
          }}
        />
      )}

      {/* 5. Order Completed Receipt Modal */}
      {completedPaymentResult && (
        <OrderSuccessModal
          result={completedPaymentResult}
          currency={currency}
          onNewSale={() => setCompletedPaymentResult(null)}
        />
      )}

      {/* 6. Digital Thermal Bill Modal (After Save Order / KOT) */}
      {savedReceiptOrder && (
        <BillReceiptModal
          orderId={savedReceiptOrder.id}
          orderCode={savedReceiptOrder.orderCode}
          onClose={() => setSavedReceiptOrder(null)}
          onSettleBill={() => {
            const orderToPay = savedReceiptOrder;
            setSavedReceiptOrder(null);
            setActivePaymentOrder(orderToPay);
          }}
        />
      )}
    </div>
  );
};

export default OrdersPage;
