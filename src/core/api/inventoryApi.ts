import { apiClient } from './client';
import {
  ApiResponse,
  InventoryItemRecord,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  ListInventoryItemsQueryParams,
  PaginatedInventoryItemsData,
  InventorySummaryData,
  LowStockReportData,
  ValuationReportData,
  CreateStockAdjustmentInput,
  StockAdjustmentRecord,
  PaginatedAdjustmentsData,
  CreateStockWastageInput,
  StockWastageRecord,
  PaginatedWastageData,
  CreatePurchaseOrderInput,
  PurchaseOrderRecord,
  PaginatedPurchasesData,
  RecipeIngredientRecord,
  UpsertRecipeInput,
  ListLedgerQueryParams,
  PaginatedLedgerData,
  InventoryLocationRecord,
  SupplierRecord,
} from '@/types';

export class InventoryApi {
  // ===========================================================================
  // 1. Summaries & Reports
  // ===========================================================================

  public static async getSummary(): Promise<InventorySummaryData> {
    const response =
      await apiClient.get<ApiResponse<InventorySummaryData>>('/inventory/summary');
    return response.data;
  }

  public static async getLowStock(): Promise<LowStockReportData> {
    const response =
      await apiClient.get<ApiResponse<LowStockReportData>>('/inventory/low-stock');
    return response.data;
  }

  public static async getValuation(): Promise<ValuationReportData> {
    const response =
      await apiClient.get<ApiResponse<ValuationReportData>>('/inventory/valuation');
    return response.data;
  }

  // ===========================================================================
  // 2. Inventory Items
  // ===========================================================================

  public static async listItems(
    params?: ListInventoryItemsQueryParams
  ): Promise<PaginatedInventoryItemsData> {
    const response = await apiClient.get<ApiResponse<PaginatedInventoryItemsData>>(
      '/inventory/items',
      { params }
    );
    return response.data;
  }

  public static async getItemById(id: string): Promise<InventoryItemRecord> {
    const response = await apiClient.get<ApiResponse<InventoryItemRecord>>(
      `/inventory/items/${id}`
    );
    return response.data;
  }

  public static async createItem(
    payload: CreateInventoryItemInput
  ): Promise<InventoryItemRecord> {
    const response = await apiClient.post<
      ApiResponse<InventoryItemRecord>,
      CreateInventoryItemInput
    >('/inventory/items', payload);
    return response.data;
  }

  public static async updateItem(
    id: string,
    payload: UpdateInventoryItemInput
  ): Promise<InventoryItemRecord> {
    const response = await apiClient.patch<
      ApiResponse<InventoryItemRecord>,
      UpdateInventoryItemInput
    >(`/inventory/items/${id}`, payload);
    return response.data;
  }

  public static async deleteItem(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(
      `/inventory/items/${id}`
    );
    return response.data;
  }

  // ===========================================================================
  // 3. Stock Adjustments
  // ===========================================================================

  public static async createAdjustment(
    payload: CreateStockAdjustmentInput
  ): Promise<StockAdjustmentRecord> {
    const response = await apiClient.post<
      ApiResponse<StockAdjustmentRecord>,
      CreateStockAdjustmentInput
    >('/inventory/adjustments', payload);
    return response.data;
  }

  public static async listAdjustments(params?: {
    locationId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedAdjustmentsData> {
    const response = await apiClient.get<ApiResponse<PaginatedAdjustmentsData>>(
      '/inventory/adjustments',
      { params }
    );
    return response.data;
  }

  // ===========================================================================
  // 4. Stock Wastage
  // ===========================================================================

  public static async createWastage(
    payload: CreateStockWastageInput
  ): Promise<StockWastageRecord> {
    const response = await apiClient.post<
      ApiResponse<StockWastageRecord>,
      CreateStockWastageInput
    >('/inventory/wastage', payload);
    return response.data;
  }

  public static async listWastage(params?: {
    locationId?: string;
    reason?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedWastageData> {
    const response = await apiClient.get<ApiResponse<PaginatedWastageData>>(
      '/inventory/wastage',
      { params }
    );
    return response.data;
  }

  // ===========================================================================
  // 5. Purchases & Receiving
  // ===========================================================================

  public static async createPurchase(
    payload: CreatePurchaseOrderInput
  ): Promise<PurchaseOrderRecord> {
    const response = await apiClient.post<
      ApiResponse<PurchaseOrderRecord>,
      CreatePurchaseOrderInput
    >('/inventory/purchases', payload);
    return response.data;
  }

  public static async listPurchases(params?: {
    supplierId?: string;
    locationId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedPurchasesData> {
    const response = await apiClient.get<ApiResponse<PaginatedPurchasesData>>(
      '/inventory/purchases',
      { params }
    );
    return response.data;
  }

  // ===========================================================================
  // 6. Movement Ledger
  // ===========================================================================

  public static async listLedger(
    params?: ListLedgerQueryParams
  ): Promise<PaginatedLedgerData> {
    const response = await apiClient.get<ApiResponse<PaginatedLedgerData>>(
      '/inventory/ledger',
      { params }
    );
    return response.data;
  }

  // ===========================================================================
  // 7. Recipes & BOM
  // ===========================================================================

  public static async getMenuItemRecipes(
    menuItemId: string
  ): Promise<{ menuItemId: string; recipes: RecipeIngredientRecord[] }> {
    const response = await apiClient.get<
      ApiResponse<{ menuItemId: string; recipes: RecipeIngredientRecord[] }>
    >(`/inventory/recipes/menu-item/${menuItemId}`);
    return response.data;
  }

  public static async upsertRecipe(
    payload: UpsertRecipeInput
  ): Promise<RecipeIngredientRecord> {
    const response = await apiClient.post<
      ApiResponse<RecipeIngredientRecord>,
      UpsertRecipeInput
    >('/inventory/recipes', payload);
    return response.data;
  }

  public static async deleteRecipe(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(
      `/inventory/recipes/${id}`
    );
    return response.data;
  }

  // ===========================================================================
  // 8. Locations & Suppliers
  // ===========================================================================

  public static async listLocations(): Promise<InventoryLocationRecord[]> {
    const response =
      await apiClient.get<ApiResponse<InventoryLocationRecord[]>>('/inventory/locations');
    return response.data;
  }

  public static async listSuppliers(): Promise<SupplierRecord[]> {
    const response =
      await apiClient.get<ApiResponse<SupplierRecord[]>>('/inventory/suppliers');
    return response.data;
  }
}
