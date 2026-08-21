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

/**
 * Delivery Dispatch Models
 */
export type DeliveryOrderStatus =
  'PENDING' | 'PREPARING' | 'READY' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | 'FAILED';

export type DeliveryPaymentStatus = 'PENDING' | 'PAID';

export interface DeliveryRiderRecord {
  id: string;
  name: string;
  username: string;
  phone?: string | null;
  isActive: boolean;
}

export interface DeliveryZoneRecord {
  id: string;
  name: string;
  deliveryCharge: number;
  estimatedMinutes?: number | null;
  isActive: boolean;
}

export interface DeliveryOrderItem {
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

export interface DeliveryOrderRecord {
  id: string;
  orderCode: string;
  businessDate: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  landmark?: string | null;
  deliveryZoneName?: string | null;
  status: DeliveryOrderStatus;
  paymentStatus: DeliveryPaymentStatus;
  paymentMethod: string;
  totalAmount: number;
  deliveryCharge: number;
  orderAgeMinutes: number;
  isAggregator: boolean;
  aggregatorName?: string | null;
  rider?: { id: string; name: string; phone?: string | null } | null;
  createdAt: string;
  items: DeliveryOrderItem[];
}

export interface DeliveryDispatcherSummary {
  totalActive: number;
  pending: number;
  preparing: number;
  ready: number;
  dispatched: number;
}

export interface DeliveryDispatcherData {
  summary: DeliveryDispatcherSummary;
  queue: DeliveryOrderRecord[];
}

export interface UpdateDeliveryStatusInput {
  status: 'PREPARING' | 'READY' | 'DISPATCHED' | 'DELIVERED' | 'FAILED';
  riderId?: string;
  markPaid?: boolean;
}

export interface AssignRiderInput {
  riderId: string;
}

export interface CancelDeliveryOrderInput {
  reason: string;
}

/**
 * Kitchen Display System (KDS) Models
 */
export type KitchenUrgencyTier = 'NORMAL' | 'WARNING' | 'CRITICAL';
export type OrderKitchenStatus = 'PREPARING' | 'READY' | 'SERVED';
export type ItemKitchenStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';

export interface KitchenStationRecord {
  id: string;
  name: string;
  code?: string | null;
  displayOrder: number;
  isActive?: boolean;
  categories?: Array<{
    category: {
      id: string;
      name: string;
      sortOrder?: number;
    };
  }>;
}

export interface KitchenTicketItem {
  id: string;
  orderId: string;
  menuItemId: string;
  itemName: string;
  variantName: string | null;
  quantity: number;
  status: string;
  kitchenStatus: ItemKitchenStatus | string;
  preparedAt: string | Date | null;
  kitchenNotes: string | null;
  specialInstructions: string | null;
  stationId: string | null;
  stationName: string | null;
  modifiers: Array<{
    id: string;
    modifierOptionName: string;
    quantity: number;
  }>;
}

export interface KitchenTicket {
  id: string;
  orderCode: string;
  dailySequence: number;
  businessDate: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  tableId: string | null;
  tableName: string | null;
  zoneName: string | null;
  tokenNumber: number | null;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  createdAt: string | Date;
  elapsedSeconds: number;
  elapsedMinutes: number;
  urgencyTier: KitchenUrgencyTier;
  itemsSummary: {
    total: number;
    pending: number;
    preparing: number;
    ready: number;
    served: number;
  };
  items: KitchenTicketItem[];
}

export interface KitchenQueueSummaryCounts {
  total: number;
  confirmed: number;
  preparing: number;
  ready: number;
}

export interface KitchenQueueData {
  tickets: KitchenTicket[];
  counts: KitchenQueueSummaryCounts;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface KitchenPerformanceData {
  activeTicketsCount: number;
  preparingTicketsCount: number;
  readyTicketsCount: number;
  delayedTicketsCount: number;
  completedTicketsToday: number;
  avgPrepTimeMinutes: number;
}

export interface KitchenQueueQueryParams {
  orderType?: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  status?: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'ALL_ACTIVE';
  stationId?: string;
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpdateOrderKitchenStatusInput {
  status: OrderKitchenStatus;
}

export interface UpdateItemKitchenStatusInput {
  status: ItemKitchenStatus;
  kitchenNotes?: string;
}

export interface RecallKitchenInput {
  reason?: string;
}
