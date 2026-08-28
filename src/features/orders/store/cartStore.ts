import { create } from 'zustand';
import { CartItem, CartModifierSelection, OrderType } from '@/types';
import { formatPrice as centralizedFormatPrice } from '@/utils/format';

interface CartCustomer {
  id?: string;
  name?: string;
  phone?: string;
  address?: string;
}

interface CartTable {
  id: string;
  name: string;
}

interface CartState {
  orderType: OrderType;
  selectedTable: CartTable | null;
  guestCount: number;
  customer: CartCustomer | null;
  items: CartItem[];
  notes: string;
  flatDeliveryFee: number;
  packagingCharge: number;

  // Actions
  addItem: (item: {
    menuItemId: string;
    itemCode: string;
    itemName: string;
    urduName?: string | null;
    variantId?: string;
    variantName?: string;
    unitPrice: number;
    modifiersPrice: number;
    quantity: number;
    selectedModifiers: CartModifierSelection[];
    specialInstructions?: string;
  }) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  updateItemInstructions: (lineId: string, instructions: string) => void;
  setOrderType: (orderType: OrderType) => void;
  setSelectedTable: (table: CartTable | null) => void;
  setGuestCount: (count: number) => void;
  setCustomer: (customer: CartCustomer | null) => void;
  setNotes: (notes: string) => void;
  setDeliveryFee: (fee: number) => void;
  setPackagingCharge: (charge: number) => void;
  clearCart: () => void;
  resetAll: () => void;
}

const generateLineId = () =>
  `line_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

const areModifiersEqual = (
  modsA: CartModifierSelection[],
  modsB: CartModifierSelection[]
) => {
  if (modsA.length !== modsB.length) return false;
  const idsA = modsA.map(m => m.modifierId).sort();
  const idsB = modsB.map(m => m.modifierId).sort();
  return idsA.every((id, idx) => id === idsB[idx]);
};

export const useCartStore = create<CartState>((set, get) => ({
  orderType: 'DINE_IN',
  selectedTable: null,
  guestCount: 1,
  customer: null,
  items: [],
  notes: '',
  flatDeliveryFee: 0,
  packagingCharge: 0,

  addItem: newItem => {
    const currentItems = get().items;
    const itemPricePerUnit = newItem.unitPrice + newItem.modifiersPrice;

    // Check if an identical item exists in the cart
    const existingIndex = currentItems.findIndex(
      item =>
        item.menuItemId === newItem.menuItemId &&
        item.variantId === newItem.variantId &&
        item.specialInstructions === newItem.specialInstructions &&
        areModifiersEqual(item.selectedModifiers, newItem.selectedModifiers)
    );

    if (existingIndex > -1) {
      const updated = [...currentItems];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + newItem.quantity;
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        itemGrossTotal: itemPricePerUnit * newQty,
      };
      set({ items: updated });
    } else {
      const lineItem: CartItem = {
        ...newItem,
        id: generateLineId(),
        itemGrossTotal: itemPricePerUnit * newItem.quantity,
      };
      set({ items: [...currentItems, lineItem] });
    }
  },

  updateQuantity: (lineId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(lineId);
      return;
    }

    const updated = get().items.map(item => {
      if (item.id === lineId) {
        const itemPricePerUnit = item.unitPrice + item.modifiersPrice;
        return {
          ...item,
          quantity,
          itemGrossTotal: itemPricePerUnit * quantity,
        };
      }
      return item;
    });

    set({ items: updated });
  },

  removeItem: lineId => {
    set({ items: get().items.filter(item => item.id !== lineId) });
  },

  updateItemInstructions: (lineId, instructions) => {
    set({
      items: get().items.map(item =>
        item.id === lineId ? { ...item, specialInstructions: instructions } : item
      ),
    });
  },

  setOrderType: orderType => {
    set({
      orderType,
      flatDeliveryFee: orderType === 'DELIVERY' ? 5 : 0,
      packagingCharge: orderType === 'TAKEAWAY' ? 1 : 0,
    });
  },

  setSelectedTable: selectedTable => {
    set({ selectedTable });
  },

  setGuestCount: guestCount => {
    set({ guestCount: Math.max(1, guestCount) });
  },

  setCustomer: customer => {
    set({ customer });
  },

  setNotes: notes => {
    set({ notes });
  },

  setDeliveryFee: flatDeliveryFee => {
    set({ flatDeliveryFee });
  },

  setPackagingCharge: packagingCharge => {
    set({ packagingCharge });
  },

  clearCart: () => {
    set({ items: [], notes: '' });
  },

  resetAll: () => {
    set({
      orderType: 'DINE_IN',
      selectedTable: null,
      guestCount: 1,
      customer: null,
      items: [],
      notes: '',
      flatDeliveryFee: 0,
      packagingCharge: 0,
    });
  },
}));

/**
 * Cart Financial Calculation Selector Hook
 */
export const useCartTotals = (taxRate: number = 0, currency: string = 'PKR') => {
  const items = useCartStore(s => s.items);
  const orderType = useCartStore(s => s.orderType);
  const flatDeliveryFee = useCartStore(s => s.flatDeliveryFee);
  const packagingCharge = useCartStore(s => s.packagingCharge);

  const subtotal = items.reduce((sum, item) => sum + item.itemGrossTotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Tax calculation (tax exclusive estimate matching backend)
  const taxAmount = (subtotal * taxRate) / 100;
  const deliveryCharge = orderType === 'DELIVERY' ? flatDeliveryFee : 0;
  const packCharge = orderType === 'TAKEAWAY' ? packagingCharge : 0;

  const grandTotal = subtotal + taxAmount + deliveryCharge + packCharge;

  const formatPrice = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return centralizedFormatPrice(num, currency || 'PKR');
  };

  return {
    subtotal,
    itemCount,
    taxAmount,
    taxRate,
    deliveryCharge,
    packagingCharge: packCharge,
    grandTotal,
    formatPrice,
  };
};
