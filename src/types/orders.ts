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
  amount: number;
  amountTendered?: number | null;
  changeAmount?: number | null;
  changeGiven?: number | null;
  refundedAmount?: number;
  reference?: string | null;
  cardLast4?: string | null;
  cardBrand?: string | null;
  notes?: string | null;
  createdAt: string;
  order?: {
    id: string;
    orderCode: string;
    orderType: string;
    grandTotal: number;
    paymentStatus: string;
  };
  createdByUser?: {
    id: string;
    name: string;
    username: string;
  };
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

/**
 * Cashier Shift & Reconciliation Models
 */
export type ShiftStatus = 'OPEN' | 'CLOSED';
export type CashAdjustmentType = 'PAY_IN' | 'PAY_OUT';
export type CashTransactionType = 'OPENING_FLOAT' | 'CASH_DROP' | 'PAY_IN' | 'PAY_OUT';

export interface CashTransactionRecord {
  id: string;
  shiftId: string;
  type: CashTransactionType;
  amount: number;
  reason: string | null;
  createdAt: string;
  createdByUser?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface CashierShiftRecord {
  id: string;
  restaurantId: string;
  cashierId: string;
  registerName: string;
  businessDate: string;
  status: ShiftStatus;
  openedAt: string;
  closedAt?: string | null;
  openingCash: number;
  cashSales: number;
  cashRefunds: number;
  cashDrops: number;
  cashAdjustments: number;
  cashExpenses: number;
  expectedClosingCash: number | null;
  actualClosingCash: number | null;
  variance: number | null;
  currentDrawerCash: number;
  notes?: string | null;
  closingNotes?: string | null;
  cashier: {
    id: string;
    name: string;
    username: string;
  };
  closedByUser?: {
    id: string;
    name: string;
    username: string;
  } | null;
  cashTransactions?: CashTransactionRecord[];
}

export interface ShiftSummaryData {
  shiftId: string;
  businessDate: string;
  registerName: string;
  status: ShiftStatus | string;
  openedAt: string;
  closedAt: string | null;
  cashier: {
    id: string;
    name: string;
    username: string;
  };
  cashDrawer: {
    openingCash: number;
    cashSales: number;
    cashRefunds: number;
    cashDrops: number;
    cashAdjustments: number;
    cashExpenses: number;
    expectedClosingCash: number;
    actualClosingCash: number | null;
    variance: number | null;
  };
  paymentsByMethod: Record<string, { count: number; totalAmount: number }>;
  refundsByMethod: Record<string, { count: number; totalAmount: number }>;
  totals: {
    totalSales: number;
    totalRefunds: number;
    netSales: number;
    transactionsCount: number;
  };
}

export interface OpenShiftInput {
  openingCash?: number;
  registerName?: string;
  notes?: string;
}

export interface CloseShiftInput {
  actualClosingCash: number;
  closingNotes?: string;
}

export interface CashDropInput {
  amount: number;
  reason: string;
  managerPin?: string;
}

export interface CashAdjustmentInput {
  type: CashAdjustmentType;
  amount: number;
  reason: string;
  managerPin?: string;
}

export interface ListShiftsQueryParams {
  cashierId?: string;
  status?: ShiftStatus;
  businessDate?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateRefundInput {
  amount: number;
  reason: string;
  refundMethod?: PaymentMethod;
  reference?: string;
  managerPin?: string;
}

export interface ListPaymentsQueryParams {
  orderId?: string;
  shiftId?: string;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  businessDate?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPaymentsData {
  payments: PaymentRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginatedShiftsData {
  shifts: CashierShiftRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Menu Management Interfaces & Inputs
 */
export interface CategoryRecord {
  id: string;
  restaurantId: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    menuItems: number;
  };
}

export interface VariantRecord {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModifierRecord {
  id: string;
  modifierGroupId: string;
  name: string;
  priceAdjustment: number;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModifierGroupRecord {
  id: string;
  restaurantId: string;
  name: string;
  selectionType: 'SINGLE' | 'MULTIPLE';
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  modifiers?: ModifierRecord[];
  _count?: {
    menuItems: number;
  };
}

export interface ItemModifierGroupLinkRecord {
  id: string;
  menuItemId: string;
  modifierGroupId: string;
  isRequired: boolean;
  minSelections?: number | null;
  maxSelections?: number | null;
  sortOrder: number;
  modifierGroup?: ModifierGroupRecord;
}

export interface MenuItemRecord {
  id: string;
  restaurantId: string;
  categoryId: string;
  itemCode: string;
  name: string;
  urduName?: string | null;
  description?: string | null;
  basePrice: number;
  taxRate?: number | null;
  sortOrder: number;
  isActive: boolean;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
  category?: CategoryRecord;
  variants?: VariantRecord[];
  modifierGroups?: ItemModifierGroupLinkRecord[];
}

export interface CategoryWithCount extends CategoryRecord {
  _count?: {
    menuItems: number;
  };
}

export interface CreateCategoryInput {
  name: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  sortOrder?: number;
}

export interface ReorderCategoriesInput {
  items: Array<{ id: string; sortOrder: number }>;
}

export interface CreateMenuItemInput {
  categoryId: string;
  itemCode: string;
  name: string;
  urduName?: string | null;
  description?: string | null;
  basePrice?: number;
  taxRate?: number | null;
  sortOrder?: number;
  isActive?: boolean;
  isAvailable?: boolean;
}

export interface UpdateMenuItemInput {
  categoryId?: string;
  itemCode?: string;
  name?: string;
  urduName?: string | null;
  description?: string | null;
  basePrice?: number;
  taxRate?: number | null;
  sortOrder?: number;
}

export interface ListMenuItemsQueryParams {
  categoryId?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'itemCode' | 'sortOrder' | 'basePrice' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedMenuItemsData {
  items: MenuItemRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateVariantInput {
  name: string;
  price: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateVariantInput {
  name?: string;
  price?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ModifierGroupWithCount extends ModifierGroupRecord {
  _count?: {
    menuItems: number;
  };
}

export interface CreateModifierGroupInput {
  name: string;
  selectionType?: 'SINGLE' | 'MULTIPLE';
  minSelections?: number;
  maxSelections?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateModifierGroupInput {
  name?: string;
  selectionType?: 'SINGLE' | 'MULTIPLE';
  minSelections?: number;
  maxSelections?: number;
  sortOrder?: number;
}

export interface CreateModifierInput {
  name: string;
  priceAdjustment?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateModifierInput {
  name?: string;
  priceAdjustment?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface LinkItemModifierGroupInput {
  modifierGroupId: string;
  sortOrder?: number;
  isRequired?: boolean;
  minSelections?: number | null;
  maxSelections?: number | null;
}

/**
 * Inventory Management Interfaces & Inputs
 */
export interface InventoryLocationRecord {
  id: string;
  restaurantId: string;
  name: string;
  code?: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export interface SupplierRecord {
  id: string;
  restaurantId: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  isActive: boolean;
}

export interface InventoryItemRecord {
  id: string;
  restaurantId: string;
  itemCode: string;
  name: string;
  description?: string | null;
  unit: string;
  costPerUnit: number;
  currentStock: number;
  minStockLevel: number;
  targetStockLevel?: number | null;
  locationId?: string | null;
  supplierId?: string | null;
  isActive: boolean;
  location?: InventoryLocationRecord | null;
  supplier?: SupplierRecord | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedInventoryItemsData {
  items: InventoryItemRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InventorySummaryData {
  totalItemsCount: number;
  totalValuation: number;
  lowStockItemsCount: number;
  outOfStockItemsCount: number;
}

export interface LowStockItemData {
  id: string;
  itemCode: string;
  name: string;
  unit: string;
  costPerUnit: number;
  currentStock: number;
  minStockLevel: number;
  targetStockLevel: number;
  recommendedReorderQuantity: number;
  estimatedReorderCost: number;
  supplier?: SupplierRecord | null;
  location?: InventoryLocationRecord | null;
}

export interface LowStockReportData {
  totalLowStockItems: number;
  items: LowStockItemData[];
}

export interface ValuationLocationBreakdown {
  locationId: string;
  locationName: string;
  itemCount: number;
  totalValuation: number;
  percentageOfTotal: number;
}

export interface ValuationReportData {
  grandTotalValuation: number;
  locationsBreakdown: ValuationLocationBreakdown[];
  items: Array<{
    id: string;
    itemCode: string;
    name: string;
    unit: string;
    costPerUnit: number;
    currentStock: number;
    totalValuation: number;
    location?: InventoryLocationRecord | null;
  }>;
}

export interface RecipeIngredientRecord {
  id: string;
  restaurantId: string;
  menuItemId?: string | null;
  variantId?: string | null;
  modifierId?: string | null;
  inventoryItemId: string;
  quantity: number;
  wastePercentage: number;
  inventoryItem?: InventoryItemRecord;
  createdAt?: string;
}

export interface StockMovementRecord {
  id: string;
  restaurantId: string;
  inventoryItemId: string;
  type:
    | 'PURCHASE_RECEIPT'
    | 'SALE_CONSUMPTION'
    | 'ORDER_VOID_RETURN'
    | 'ADJUSTMENT_INCREASE'
    | 'ADJUSTMENT_DECREASE'
    | 'WASTAGE'
    | 'TRANSFER_IN'
    | 'TRANSFER_OUT';
  quantityChange: number;
  balanceAfter: number;
  unitCost: number;
  totalCost: number;
  referenceType?: string | null;
  referenceId?: string | null;
  reason?: string | null;
  createdAt: string;
  inventoryItem?: {
    id: string;
    itemCode: string;
    name: string;
    unit: string;
  };
  createdByUser?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface PaginatedLedgerData {
  movements: StockMovementRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StockAdjustmentItemRecord {
  id: string;
  inventoryItemId: string;
  systemStock: number;
  actualStock: number;
  variance: number;
  unitCost: number;
  totalVarianceCost: number;
  inventoryItem?: {
    id: string;
    itemCode: string;
    name: string;
    unit: string;
  };
}

export interface StockAdjustmentRecord {
  id: string;
  adjustmentNumber: string;
  reason: string;
  notes?: string | null;
  totalVarianceCost: number;
  createdAt: string;
  items: StockAdjustmentItemRecord[];
  createdByUser?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface PaginatedAdjustmentsData {
  adjustments: StockAdjustmentRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StockWastageItemRecord {
  id: string;
  inventoryItemId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  itemReason?: string | null;
  inventoryItem?: {
    id: string;
    itemCode: string;
    name: string;
    unit: string;
  };
}

export interface StockWastageRecord {
  id: string;
  wastageNumber: string;
  reason:
    'EXPIRED' | 'SPOILED' | 'PREPARATION_ERROR' | 'DAMAGED' | 'CONTAMINATED' | 'OTHER';
  notes?: string | null;
  totalWastedValue: number;
  createdAt: string;
  items: StockWastageItemRecord[];
  createdByUser?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface PaginatedWastageData {
  wastage: StockWastageRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PurchaseItemRecord {
  id: string;
  inventoryItemId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  inventoryItem?: {
    id: string;
    itemCode: string;
    name: string;
    unit: string;
  };
}

export interface PurchaseOrderRecord {
  id: string;
  purchaseNumber: string;
  invoiceNumber?: string | null;
  totalAmount: number;
  notes?: string | null;
  createdAt: string;
  supplier?: SupplierRecord | null;
  items: PurchaseItemRecord[];
  createdByUser?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface PaginatedPurchasesData {
  purchases: PurchaseOrderRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateInventoryItemInput {
  itemCode: string;
  name: string;
  description?: string | null;
  unit: string;
  costPerUnit: number;
  currentStock?: number;
  minStockLevel?: number;
  targetStockLevel?: number | null;
  locationId?: string | null;
  supplierId?: string | null;
}

export interface UpdateInventoryItemInput {
  itemCode?: string;
  name?: string;
  description?: string | null;
  unit?: string;
  costPerUnit?: number;
  minStockLevel?: number;
  targetStockLevel?: number | null;
  locationId?: string | null;
  supplierId?: string | null;
  isActive?: boolean;
}

export interface ListInventoryItemsQueryParams {
  supplierId?: string;
  locationId?: string;
  lowStock?: boolean;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateStockAdjustmentInput {
  locationId?: string;
  reason: string;
  notes?: string;
  items: Array<{
    inventoryItemId: string;
    actualStock: number;
  }>;
}

export interface CreateStockWastageInput {
  locationId?: string;
  reason:
    'EXPIRED' | 'SPOILED' | 'PREPARATION_ERROR' | 'DAMAGED' | 'CONTAMINATED' | 'OTHER';
  notes?: string;
  items: Array<{
    inventoryItemId: string;
    quantity: number;
    unitCost?: number;
    itemReason?: string;
  }>;
}

export interface CreatePurchaseOrderInput {
  supplierId?: string;
  locationId?: string;
  invoiceNumber?: string;
  notes?: string;
  items: Array<{
    inventoryItemId: string;
    quantity: number;
    unitCost: number;
  }>;
}

export interface UpsertRecipeInput {
  menuItemId?: string;
  variantId?: string;
  modifierId?: string;
  inventoryItemId: string;
  quantity: number;
  wastePercentage?: number;
}

export interface ListLedgerQueryParams {
  inventoryItemId?: string;
  locationId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Customer Directory & CRM Interfaces
 */
export interface CustomerAddressRecord {
  id: string;
  customerId: string;
  address: string;
  landmark?: string | null;
  deliveryZoneId?: string | null;
  isDefault: boolean;
  deliveryZone?: DeliveryZoneRecord | null;
  createdAt?: string;
}

export interface CustomerRecentOrderRecord {
  id: string;
  orderCode: string;
  businessDate: string;
  status: string;
  totalAmount: number;
  deliveryAddress?: string | null;
  createdAt: string;
}

export interface CustomerRecord {
  id: string;
  restaurantId: string;
  name: string;
  phone: string;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  addresses: CustomerAddressRecord[];
  deliveryOrders?: CustomerRecentOrderRecord[];
}

export interface PaginatedCustomersData {
  customers: CustomerRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerLookupData extends CustomerRecord {
  deliveryOrders: CustomerRecentOrderRecord[];
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  notes?: string | null;
  address?: string;
  landmark?: string | null;
  deliveryZoneId?: string | null;
}

export interface UpdateCustomerInput {
  name?: string;
  notes?: string | null;
  isActive?: boolean;
}

export interface AddCustomerAddressInput {
  address: string;
  landmark?: string | null;
  deliveryZoneId?: string | null;
  isDefault?: boolean;
}

export interface ListCustomersQueryParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CustomerLoyaltyAccountData {
  id: string;
  customerId: string;
  currentPoints: number;
  lifetimePoints: number;
  lifetimeSpend: number;
  tier?: {
    id: string;
    name: string;
    pointsMultiplier: number;
  } | null;
}

export interface EnrollCustomerLoyaltyInput {
  customerId: string;
  initialPoints?: number;
}

/**
 * Reservations & Table Bookings Interfaces
 */
export type ReservationStatus =
  'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface ReservationTableInfo {
  id: string;
  name: string;
  capacity: number;
  status: string;
  zone?: {
    id: string;
    name: string;
  } | null;
}

export interface ReservationRecord {
  id: string;
  restaurantId: string;
  reservationCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerId?: string | null;
  guestCount: number;
  tableId?: string | null;
  reservationDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: ReservationStatus;
  specialRequests?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  table?: ReservationTableInfo | null;
  customer?: CustomerRecord | null;
  createdByUser?: {
    id: string;
    name: string;
    username: string;
  } | null;
}

export interface PaginatedReservationsData {
  reservations: ReservationRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReservationAvailableTableItem {
  id: string;
  name: string;
  capacity: number;
  zone?: {
    id: string;
    name: string;
  } | null;
}

export interface ReservationUnavailableTableItem {
  id: string;
  name: string;
  capacity: number;
  reason: string;
  zone?: {
    id: string;
    name: string;
  } | null;
}

export interface ReservationAvailabilityData {
  startDateTime: string;
  endDateTime: string;
  durationMinutes: number;
  guestCount: number;
  totalActiveTables: number;
  availableTablesCount: number;
  availableTables: ReservationAvailableTableItem[];
  unavailableTables: ReservationUnavailableTableItem[];
}

export interface CreateReservationInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerId?: string | null;
  guestCount: number;
  tableId?: string | null;
  reservationDate: string;
  startTime: string;
  durationMinutes?: number;
  status?: ReservationStatus;
  specialRequests?: string | null;
}

export interface UpdateReservationInput {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string | null;
  guestCount?: number;
  tableId?: string | null;
  reservationDate?: string;
  startTime?: string;
  durationMinutes?: number;
  specialRequests?: string | null;
}

export interface UpdateReservationStatusInput {
  status: ReservationStatus;
  cancelReason?: string | null;
}

export interface AssignReservationTableInput {
  tableId: string;
}

export interface CheckReservationAvailabilityQueryParams {
  reservationDate: string;
  startTime: string;
  durationMinutes?: number;
  guestCount?: number;
}

export interface ListReservationsQueryParams {
  page?: number;
  limit?: number;
  reservationDate?: string;
  startDate?: string;
  endDate?: string;
  status?: ReservationStatus;
  tableId?: string;
  customerId?: string;
  search?: string;
}

/**
 * Purchasing & Supplier Management Interfaces
 */
export interface PurchasingSupplierRecord {
  id: string;
  restaurantId: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    inventoryItems: number;
    purchaseOrders: number;
  };
}

export interface PaginatedSuppliersData {
  items: PurchasingSupplierRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type PurchaseOrderStatus =
  'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchasingOrderItemRecord {
  id: string;
  purchaseOrderId: string;
  inventoryItemId: string;
  quantity: number;
  unitCost: number;
  taxRate: number;
  discountRate: number;
  totalAmount: number;
  quantityReceived: number;
  inventoryItem: {
    id: string;
    itemCode: string;
    name: string;
    unit: string;
  };
  returnItems?: Array<{
    id: string;
    quantity: number;
  }>;
}

export interface PurchasingReturnItemRecord {
  id: string;
  purchaseOrderItemId: string;
  inventoryItemId: string;
  quantity: number;
  unitCost: number;
  totalAmount: number;
  inventoryItem: {
    id: string;
    itemCode: string;
    name: string;
    unit: string;
  };
}

export interface PurchasingReturnRecord {
  id: string;
  returnNumber: string;
  reason: string;
  totalRefundAmount: number;
  status: string;
  notes?: string | null;
  createdAt: string;
  items?: PurchasingReturnItemRecord[];
}

export interface PurchasingOrderRecord {
  id: string;
  restaurantId: string;
  orderNumber: string;
  invoiceNumber?: string | null;
  supplierId?: string | null;
  locationId?: string | null;
  status: PurchaseOrderStatus;
  totalAmount: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  expectedDeliveryDate?: string | null;
  receivedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  supplier?: {
    id: string;
    name: string;
    contactPerson?: string | null;
    phone?: string | null;
  } | null;
  location?: {
    id: string;
    name: string;
  } | null;
  items: PurchasingOrderItemRecord[];
  returns?: PurchasingReturnRecord[];
  createdByUser?: {
    id: string;
    name: string;
    username: string;
  } | null;
}

export interface PaginatedPurchasingOrdersData {
  items: PurchasingOrderRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PurchasingSummaryData {
  totalOrders: number;
  totalSpend: number;
  statusBreakdown: Record<string, number>;
  topSuppliers: Array<{
    supplierId: string;
    name: string;
    totalSpend: number;
    ordersCount: number;
  }>;
  topPurchasedItems: Array<{
    inventoryItemId: string;
    name: string;
    unit: string;
    totalQuantity: number;
    totalSpend: number;
  }>;
}

export interface CreateSupplierInput {
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  isActive?: boolean;
}

export interface UpdateSupplierInput {
  name?: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  isActive?: boolean;
}

export interface CreatePurchasingOrderItemInput {
  inventoryItemId: string;
  quantity: number;
  unitCost: number;
  taxRate?: number;
  discountRate?: number;
}

export interface CreatePurchasingOrderInput {
  supplierId?: string | null;
  locationId?: string | null;
  invoiceNumber?: string | null;
  expectedDeliveryDate?: string | null;
  status?: 'DRAFT' | 'ORDERED' | 'RECEIVED';
  notes?: string | null;
  items: CreatePurchasingOrderItemInput[];
}

export interface UpdatePurchasingOrderInput {
  supplierId?: string | null;
  locationId?: string | null;
  invoiceNumber?: string | null;
  expectedDeliveryDate?: string | null;
  notes?: string | null;
  items?: CreatePurchasingOrderItemInput[];
}

export interface ReceivePurchasingGoodsItemInput {
  purchaseOrderItemId: string;
  quantityReceived: number;
}

export interface ReceivePurchasingGoodsInput {
  invoiceNumber?: string | null;
  receivedLocationId?: string | null;
  notes?: string | null;
  items: ReceivePurchasingGoodsItemInput[];
}

export interface CreatePurchasingReturnItemInput {
  purchaseOrderItemId: string;
  quantity: number;
}

export interface CreatePurchasingReturnInput {
  reason: string;
  notes?: string | null;
  items: CreatePurchasingReturnItemInput[];
}

export interface ListSuppliersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface ListPurchasingOrdersQueryParams {
  page?: number;
  limit?: number;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}
