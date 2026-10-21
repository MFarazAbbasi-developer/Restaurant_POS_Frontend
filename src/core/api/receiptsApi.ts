import { apiClient } from './client';
import { ApiResponse } from '@/types';

export interface FormattedCustomerReceipt {
  title: string;
  isReprint: boolean;
  reprintCount: number;
  printedAt: string;
  restaurant: {
    id: string;
    name: string;
    legalName?: string | null;
    phone?: string | null;
    address?: string | null;
    logo?: string | null;
    currency: string;
    taxNumber?: string | null;
    receiptHeader?: string | null;
    receiptFooter?: string | null;
  };
  metadata: {
    orderId: string;
    orderCode: string;
    dailySequence: number;
    businessDate: string;
    orderType: string;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string;
    formattedDate: string;
    formattedTime: string;
    tableName?: string | null;
    zoneName?: string | null;
    guestCount: number;
    tokenNumber?: number | null;
    customerName?: string | null;
    customerPhone?: string | null;
    deliveryAddress?: string | null;
    cashierName: string;
    barcodePayload: string;
    qrPayload: string;
  };
  items: Array<{
    id: string;
    menuItemId: string;
    itemName: string;
    variantName?: string | null;
    quantity: number;
    unitPrice: number;
    modifiersPrice: number;
    itemGrossTotal: number;
    discountAmount: number;
    lineTotal: number;
    specialInstructions?: string | null;
    modifiers: Array<{
      id: string;
      modifierOptionName: string;
      priceAdjustment: number;
    }>;
  }>;
  totals: {
    subtotal: number;
    itemDiscountsTotal: number;
    orderDiscountAmount: number;
    totalDiscount: number;
    taxRate: number | null;
    taxInclusive: boolean;
    taxAmount: number;
    serviceChargeRate: number | null;
    serviceChargeAmount: number;
    deliveryCharge: number;
    packagingCharge: number;
    roundingAmount: number;
    grandTotal: number;
    paidAmount: number;
    changeAmount: number;
    balanceDue: number;
  };
  payments: Array<{
    id: string;
    paymentMethod: string;
    amount: number;
    amountTendered?: number | null;
    changeGiven?: number | null;
    reference?: string | null;
    cardLast4?: string | null;
    cardBrand?: string | null;
    createdAt?: string | null;
  }>;
  renderedSlip: string;
}

export interface FormattedKitchenTicket {
  title: string;
  stationId?: string | null;
  stationName?: string | null;
  printedAt: string;
  metadata: {
    orderId: string;
    orderCode: string;
    orderType: string;
    tokenNumber?: number | null;
    tableName?: string | null;
    zoneName?: string | null;
    guestCount: number;
    serverName: string;
    notes?: string | null;
    formattedTime: string;
  };
  items: Array<{
    id: string;
    itemName: string;
    variantName?: string | null;
    quantity: number;
    kitchenStatus?: string;
    specialInstructions?: string | null;
    modifiers: Array<{
      id: string;
      modifierOptionName: string;
    }>;
  }>;
  renderedSlip: string;
}

export class ReceiptsApi {
  /**
   * GET /api/v1/receipts/preview
   * Get preview customer receipt formatted DTO
   */
  public static async getPreviewReceipt(
    paperWidth: '80mm' | '58mm' = '80mm'
  ): Promise<FormattedCustomerReceipt> {
    const response = await apiClient.get<
      ApiResponse<{ receipt: FormattedCustomerReceipt } | FormattedCustomerReceipt>
    >('/receipts/preview', { params: { paperWidth } });
    if (
      response.data &&
      typeof response.data === 'object' &&
      'receipt' in response.data
    ) {
      return (response.data as { receipt: FormattedCustomerReceipt }).receipt;
    }
    return response.data as FormattedCustomerReceipt;
  }

  /**
   * GET /api/v1/receipts/orders/:orderId/customer
   * Get live customer bill / receipt formatted DTO for any order
   */
  public static async getOrderReceipt(
    orderId: string,
    paperWidth: '80mm' | '58mm' = '80mm'
  ): Promise<FormattedCustomerReceipt> {
    const response = await apiClient.get<
      ApiResponse<{ receipt: FormattedCustomerReceipt }>
    >(`/receipts/orders/${orderId}/customer`, { params: { paperWidth } });
    return response.data.receipt;
  }

  /**
   * GET /api/v1/receipts/orders/:orderId/kitchen
   * Kitchen order ticket (KOT) slip — does not create orders or payments.
   */
  public static async getKitchenTicket(
    orderId: string,
    options?: { paperWidth?: '80mm' | '58mm'; stationId?: string }
  ): Promise<FormattedKitchenTicket> {
    const response = await apiClient.get<
      ApiResponse<{ ticket: FormattedKitchenTicket }>
    >(`/receipts/orders/${orderId}/kitchen`, {
      params: {
        paperWidth: options?.paperWidth || '80mm',
        stationId: options?.stationId,
      },
    });
    return response.data.ticket;
  }

  /**
   * POST /api/v1/receipts/orders/:orderId/reprint
   * Audited customer receipt reprint — does not create orders or payments.
   */
  public static async reprintReceipt(
    orderId: string,
    payload: { reason: string; paperWidth?: '80mm' | '58mm' }
  ): Promise<FormattedCustomerReceipt> {
    const response = await apiClient.post<
      ApiResponse<{ receipt: FormattedCustomerReceipt }>,
      { reason: string; paperWidth?: '80mm' | '58mm' }
    >(`/receipts/orders/${orderId}/reprint`, payload);
    return response.data.receipt;
  }
}
