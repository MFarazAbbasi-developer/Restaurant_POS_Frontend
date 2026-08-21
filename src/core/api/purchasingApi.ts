import { apiClient } from './client';
import {
  ApiResponse,
  PurchasingSupplierRecord,
  PaginatedSuppliersData,
  PurchasingOrderRecord,
  PaginatedPurchasingOrdersData,
  PurchasingSummaryData,
  PurchasingReturnRecord,
  CreateSupplierInput,
  UpdateSupplierInput,
  CreatePurchasingOrderInput,
  UpdatePurchasingOrderInput,
  ReceivePurchasingGoodsInput,
  CreatePurchasingReturnInput,
  ListSuppliersQueryParams,
  ListPurchasingOrdersQueryParams,
} from '@/types';

export class PurchasingApi {
  // ===========================================================================
  // 1. Supplier Directory
  // ===========================================================================

  public static async listSuppliers(
    params?: ListSuppliersQueryParams
  ): Promise<PaginatedSuppliersData> {
    const response = await apiClient.get<ApiResponse<PaginatedSuppliersData>>(
      '/purchasing/suppliers',
      { params }
    );
    return response.data;
  }

  public static async createSupplier(
    payload: CreateSupplierInput
  ): Promise<PurchasingSupplierRecord> {
    const response = await apiClient.post<
      ApiResponse<PurchasingSupplierRecord>,
      CreateSupplierInput
    >('/purchasing/suppliers', payload);
    return response.data;
  }

  public static async getSupplierById(id: string): Promise<PurchasingSupplierRecord> {
    const response = await apiClient.get<ApiResponse<PurchasingSupplierRecord>>(
      `/purchasing/suppliers/${id}`
    );
    return response.data;
  }

  public static async updateSupplier(
    id: string,
    payload: UpdateSupplierInput
  ): Promise<PurchasingSupplierRecord> {
    const response = await apiClient.put<
      ApiResponse<PurchasingSupplierRecord>,
      UpdateSupplierInput
    >(`/purchasing/suppliers/${id}`, payload);
    return response.data;
  }

  public static async deleteSupplier(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/purchasing/suppliers/${id}`
    );
    return response.data;
  }

  public static async getSupplierHistory(
    id: string
  ): Promise<{ orders: PurchasingOrderRecord[] }> {
    const response = await apiClient.get<
      ApiResponse<{ orders: PurchasingOrderRecord[] }>
    >(`/purchasing/suppliers/${id}/history`);
    return response.data;
  }

  // ===========================================================================
  // 2. Purchase Orders Workflow
  // ===========================================================================

  public static async listOrders(
    params?: ListPurchasingOrdersQueryParams
  ): Promise<PaginatedPurchasingOrdersData> {
    const response = await apiClient.get<ApiResponse<PaginatedPurchasingOrdersData>>(
      '/purchasing/orders',
      { params }
    );
    return response.data;
  }

  public static async createOrder(
    payload: CreatePurchasingOrderInput
  ): Promise<PurchasingOrderRecord> {
    const response = await apiClient.post<
      ApiResponse<PurchasingOrderRecord>,
      CreatePurchasingOrderInput
    >('/purchasing/orders', payload);
    return response.data;
  }

  public static async getOrderById(id: string): Promise<PurchasingOrderRecord> {
    const response = await apiClient.get<ApiResponse<PurchasingOrderRecord>>(
      `/purchasing/orders/${id}`
    );
    return response.data;
  }

  public static async updateOrder(
    id: string,
    payload: UpdatePurchasingOrderInput
  ): Promise<PurchasingOrderRecord> {
    const response = await apiClient.put<
      ApiResponse<PurchasingOrderRecord>,
      UpdatePurchasingOrderInput
    >(`/purchasing/orders/${id}`, payload);
    return response.data;
  }

  public static async orderPurchaseOrder(id: string): Promise<PurchasingOrderRecord> {
    const response = await apiClient.post<ApiResponse<PurchasingOrderRecord>>(
      `/purchasing/orders/${id}/order`
    );
    return response.data;
  }

  public static async receiveGoods(
    id: string,
    payload: ReceivePurchasingGoodsInput
  ): Promise<PurchasingOrderRecord> {
    const response = await apiClient.post<
      ApiResponse<PurchasingOrderRecord>,
      ReceivePurchasingGoodsInput
    >(`/purchasing/orders/${id}/receive`, payload);
    return response.data;
  }

  public static async createReturn(
    id: string,
    payload: CreatePurchasingReturnInput
  ): Promise<PurchasingReturnRecord> {
    const response = await apiClient.post<
      ApiResponse<PurchasingReturnRecord>,
      CreatePurchasingReturnInput
    >(`/purchasing/orders/${id}/returns`, payload);
    return response.data;
  }

  public static async cancelOrder(id: string): Promise<PurchasingOrderRecord> {
    const response = await apiClient.post<ApiResponse<PurchasingOrderRecord>>(
      `/purchasing/orders/${id}/cancel`
    );
    return response.data;
  }

  // ===========================================================================
  // 3. Procurement Analytics & Summary
  // ===========================================================================

  public static async getSummary(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<PurchasingSummaryData> {
    const response = await apiClient.get<ApiResponse<PurchasingSummaryData>>(
      '/purchasing/summary',
      { params }
    );
    return response.data;
  }
}
