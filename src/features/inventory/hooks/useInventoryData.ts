import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryApi } from '@/core/api/inventoryApi';
import {
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  ListInventoryItemsQueryParams,
  CreateStockAdjustmentInput,
  CreateStockWastageInput,
  CreatePurchaseOrderInput,
  UpsertRecipeInput,
  ListLedgerQueryParams,
} from '@/types';

export const INVENTORY_QUERY_KEYS = {
  SUMMARY: ['inventory', 'summary'] as const,
  LOW_STOCK: ['inventory', 'low-stock'] as const,
  VALUATION: ['inventory', 'valuation'] as const,
  ITEMS: (params?: ListInventoryItemsQueryParams) =>
    ['inventory', 'items', params] as const,
  ITEM: (id: string) => ['inventory', 'item', id] as const,
  ADJUSTMENTS: (params?: Record<string, unknown>) =>
    ['inventory', 'adjustments', params] as const,
  WASTAGE: (params?: Record<string, unknown>) =>
    ['inventory', 'wastage', params] as const,
  PURCHASES: (params?: Record<string, unknown>) =>
    ['inventory', 'purchases', params] as const,
  LEDGER: (params?: ListLedgerQueryParams) => ['inventory', 'ledger', params] as const,
  RECIPES: (menuItemId: string) => ['inventory', 'recipes', menuItemId] as const,
  LOCATIONS: ['inventory', 'locations'] as const,
  SUPPLIERS: ['inventory', 'suppliers'] as const,
};

// =============================================================================
// Summaries & Reports
// =============================================================================

export const useInventorySummaryQuery = () => {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.SUMMARY,
    queryFn: () => InventoryApi.getSummary(),
    staleTime: 1000 * 30,
  });
};

export const useLowStockQuery = () => {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.LOW_STOCK,
    queryFn: () => InventoryApi.getLowStock(),
    staleTime: 1000 * 30,
  });
};

export const useValuationQuery = () => {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.VALUATION,
    queryFn: () => InventoryApi.getValuation(),
    staleTime: 1000 * 60 * 2,
  });
};

// =============================================================================
// Inventory Items
// =============================================================================

export const useInventoryItemsQuery = (params?: ListInventoryItemsQueryParams) => {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.ITEMS(params),
    queryFn: () => InventoryApi.listItems(params),
    staleTime: 1000 * 30,
  });
};

export const useInventoryItemQuery = (id: string | null) => {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.ITEM(id || ''),
    queryFn: () => InventoryApi.getItemById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
};

export const useCreateInventoryItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInventoryItemInput) => InventoryApi.createItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useUpdateInventoryItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInventoryItemInput }) =>
      InventoryApi.updateItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useDeleteInventoryItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => InventoryApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

// =============================================================================
// Stock Adjustments
// =============================================================================

export const useStockAdjustmentsQuery = (params?: {
  locationId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.ADJUSTMENTS(params),
    queryFn: () => InventoryApi.listAdjustments(params),
    staleTime: 1000 * 30,
  });
};

export const useCreateStockAdjustmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStockAdjustmentInput) =>
      InventoryApi.createAdjustment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

// =============================================================================
// Stock Wastage
// =============================================================================

export const useStockWastageQuery = (params?: {
  locationId?: string;
  reason?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.WASTAGE(params),
    queryFn: () => InventoryApi.listWastage(params),
    staleTime: 1000 * 30,
  });
};

export const useCreateStockWastageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStockWastageInput) => InventoryApi.createWastage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

// =============================================================================
// Purchases & Receiving
// =============================================================================

export const usePurchasesQuery = (params?: {
  supplierId?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.PURCHASES(params),
    queryFn: () => InventoryApi.listPurchases(params),
    staleTime: 1000 * 30,
  });
};

export const useCreatePurchaseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePurchaseOrderInput) =>
      InventoryApi.createPurchase(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

// =============================================================================
// Movement Ledger
// =============================================================================

export const useStockLedgerQuery = (params?: ListLedgerQueryParams) => {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.LEDGER(params),
    queryFn: () => InventoryApi.listLedger(params),
    staleTime: 1000 * 15,
  });
};

// =============================================================================
// Recipes & BOM
// =============================================================================

export const useMenuItemRecipesQuery = (menuItemId: string | null) => {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.RECIPES(menuItemId || ''),
    queryFn: () => InventoryApi.getMenuItemRecipes(menuItemId!),
    enabled: Boolean(menuItemId),
    staleTime: 1000 * 30,
  });
};

export const useUpsertRecipeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertRecipeInput) => InventoryApi.upsertRecipe(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.RECIPES(variables.menuItemId || ''),
      });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useDeleteRecipeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; menuItemId?: string }) =>
      InventoryApi.deleteRecipe(id),
    onSuccess: (_, variables) => {
      if (variables.menuItemId) {
        queryClient.invalidateQueries({
          queryKey: INVENTORY_QUERY_KEYS.RECIPES(variables.menuItemId),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

// =============================================================================
// Locations & Suppliers
// =============================================================================

export const useInventoryLocationsQuery = () => {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.LOCATIONS,
    queryFn: () => InventoryApi.listLocations(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useSuppliersQuery = () => {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.SUPPLIERS,
    queryFn: () => InventoryApi.listSuppliers(),
    staleTime: 1000 * 60 * 5,
  });
};
