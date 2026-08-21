/**
 * POS Menu Models
 */
export interface PosModifier {
  id: string;
  name: string;
  priceAdjustment: number;
  sortOrder: number;
}

export interface PosModifierGroup {
  id: string;
  name: string;
  selectionType: 'SINGLE' | 'MULTIPLE';
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  sortOrder: number;
  modifiers: PosModifier[];
}

export interface PosItemVariant {
  id: string;
  name: string;
  price: number;
  sortOrder: number;
}

export interface PosMenuItem {
  id: string;
  itemCode: string;
  name: string;
  urduName?: string | null;
  description?: string | null;
  basePrice: number;
  taxRate?: number | null;
  sortOrder: number;
  variants: PosItemVariant[];
  modifierGroups: PosModifierGroup[];
}

export interface PosCategory {
  id: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  items: PosMenuItem[];
}

export interface PosMenuData {
  restaurantId: string;
  categories: PosCategory[];
}

/**
 * Floor & Tables POS Models
 */
export type TableStatus =
  'AVAILABLE' | 'OCCUPIED' | 'BILL_PRINTED' | 'RESERVED' | 'CLEANING';

export interface PosActiveTableOrder {
  id: string;
  orderCode: string;
  subBillName?: string | null;
  guestCount: number;
  status: string;
  totalAmount: number;
  openedAt: string;
}

export interface PosTable {
  id: string;
  name: string;
  capacity: number;
  sortOrder: number;
  status: TableStatus;
  mergedIntoTableId?: string | null;
  activeOrders: PosActiveTableOrder[];
}

export interface PosZone {
  id: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  tables: PosTable[];
}

export interface PosFloorViewData {
  restaurantId: string;
  summary: {
    totalZones?: number;
    totalTables: number;
    occupiedTables: number;
    availableTables: number;
    totalGuestsSeated: number;
  };
  zones: PosZone[];
}

export interface TransferTableInput {
  fromTableId: string;
  toTableId: string;
  targetStatus?: 'OCCUPIED' | 'BILL_PRINTED';
}

export interface CreateTableOrderInput {
  subBillName?: string;
  guestCount?: number;
  notes?: string;
}

export interface UpdateTableStatusInput {
  status: TableStatus;
}

/**
 * Orders & Cart Models
 */
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'VOIDED';

export type OrderPaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED';

export interface CartModifierSelection {
  modifierId: string;
  modifierGroupId: string;
  name: string;
  priceAdjustment: number;
}

export interface CartItem {
  id: string; // unique client line id
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
  itemGrossTotal: number;
}

export interface CreateOrderItemInput {
  menuItemId: string;
  variantId?: string;
  quantity: number;
  modifierIds?: string[];
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue?: number;
  specialInstructions?: string;
}

export interface CreateOrderInput {
  orderType: OrderType;
  items: CreateOrderItemInput[];
  tableId?: string;
  tableOrderId?: string;
  guestCount?: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryZoneId?: string;
  flatDeliveryFee?: number;
  packagingCharge?: number;
  notes?: string;
  promoCode?: string;
  pointsToRedeem?: number;
  paymentMethod?: string;
  isAggregator?: boolean;
  aggregatorName?: string;
  aggregatorReference?: string;
}

export interface OrderItemRecord {
  id: string;
  menuItemId: string;
  variantId?: string | null;
  itemName: string;
  variantName?: string | null;
  quantity: number;
  unitPrice: string | number;
  modifiersPrice: string | number;
  itemGrossTotal: string | number;
  itemNetTotal: string | number;
  specialInstructions?: string | null;
  modifiers?: Array<{
    id: string;
    name: string;
    priceAdjustment: string | number;
  }>;
}

export interface OrderRecord {
  id: string;
  restaurantId: string;
  orderNumber: number;
  orderCode: string;
  dailySequenceNumber: number;
  businessDate: string;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: string;
  guestCount: number;
  subtotal: string | number;
  itemDiscountsTotal: string | number;
  orderDiscountAmount: string | number;
  totalDiscount: string | number;
  discountedSubtotal: string | number;
  taxRate?: string | number | null;
  taxAmount: string | number;
  serviceChargeRate?: string | number | null;
  serviceChargeAmount: string | number;
  deliveryCharge: string | number;
  packagingCharge: string | number;
  roundingAmount: string | number;
  grandTotal: string | number;
  totalPaid: string | number;
  balanceDue: string | number;
  tableId?: string | null;
  table?: { id: string; name: string } | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  notes?: string | null;
  items: OrderItemRecord[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Payments & Tender Models
 */
export type PaymentMethod =
  'CASH' | 'CARD' | 'BANK_TRANSFER' | 'DIGITAL_WALLET' | 'OTHER';

export type PaymentStatus = 'COMPLETED' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'VOIDED';

export interface CreatePaymentInput {
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  amountTendered?: number;
  reference?: string;
  cardLast4?: string;
  cardBrand?: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  restaurantId: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  amount: string | number;
  amountTendered?: string | number | null;
  changeGiven?: string | number | null;
  reference?: string | null;
  cardLast4?: string | null;
  cardBrand?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface PaymentResponseData {
  payment: PaymentRecord;
  order: OrderRecord;
  changeAmount?: number;
}

/**
 * Takeaway Queue Models
 */
export type TakeawayOrderStatus =
  'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type TakeawayPaymentStatus = 'PAID' | 'PENDING';

export interface TakeawayOrderItem {
  id: string;
  name: string;
  variantName?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  specialInstructions?: string | null;
  modifiers?:
    | Array<{
        id: string;
        name: string;
        priceAdjustment: number;
      }>
    | unknown;
}

export interface TakeawayOrderRecord {
  id: string;
  tokenNumber: number;
  orderCode: string;
  businessDate: string;
  customerName: string;
  customerPhone?: string | null;
  status: TakeawayOrderStatus;
  paymentStatus: TakeawayPaymentStatus;
  paymentMethod: string;
  totalAmount: number;
  isPayOnPickup: boolean;
  specialInstructions?: string | null;
  createdAt: string;
  items: TakeawayOrderItem[];
}

export interface TakeawayQueueSummary {
  totalActive: number;
  pending: number;
  preparing: number;
  ready: number;
}

export interface TakeawayQueueData {
  restaurantId: string;
  summary: TakeawayQueueSummary;
  queue: TakeawayOrderRecord[];
}

export interface UpdateTakeawayStatusInput {
  status: 'PREPARING' | 'READY' | 'COMPLETED';
  markPaid?: boolean;
}

export interface CancelTakeawayOrderInput {
  reason: string;
}
