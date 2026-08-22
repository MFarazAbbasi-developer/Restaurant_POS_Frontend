import { apiClient } from './client';
import {
  ApiResponse,
  CategoryWithCount,
  CreateCategoryInput,
  UpdateCategoryInput,
  ReorderCategoriesInput,
  MenuItemRecord,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  ListMenuItemsQueryParams,
  PaginatedMenuItemsData,
  VariantRecord,
  CreateVariantInput,
  UpdateVariantInput,
  ModifierGroupWithCount,
  CreateModifierGroupInput,
  UpdateModifierGroupInput,
  ModifierRecord,
  CreateModifierInput,
  UpdateModifierInput,
  LinkItemModifierGroupInput,
} from '@/types';

export class MenuApi {
  // ===========================================================================
  // 1. Categories
  // ===========================================================================

  public static async listCategories(): Promise<CategoryWithCount[]> {
    const response =
      await apiClient.get<
        ApiResponse<CategoryWithCount[] | { categories: CategoryWithCount[] }>
      >('/menu/categories');
    if (Array.isArray(response.data)) return response.data;
    if (
      response.data &&
      'categories' in response.data &&
      Array.isArray(response.data.categories)
    ) {
      return response.data.categories;
    }
    return [];
  }

  public static async getCategoryById(id: string): Promise<CategoryWithCount> {
    const response = await apiClient.get<
      ApiResponse<CategoryWithCount | { category: CategoryWithCount }>
    >(`/menu/categories/${id}`);
    if (response.data && 'category' in response.data) return response.data.category;
    return response.data as CategoryWithCount;
  }

  public static async createCategory(
    payload: CreateCategoryInput
  ): Promise<CategoryWithCount> {
    const response = await apiClient.post<
      ApiResponse<CategoryWithCount | { category: CategoryWithCount }>,
      CreateCategoryInput
    >('/menu/categories', payload);
    if (response.data && 'category' in response.data) return response.data.category;
    return response.data as CategoryWithCount;
  }

  public static async updateCategory(
    id: string,
    payload: UpdateCategoryInput
  ): Promise<CategoryWithCount> {
    const response = await apiClient.patch<
      ApiResponse<CategoryWithCount | { category: CategoryWithCount }>,
      UpdateCategoryInput
    >(`/menu/categories/${id}`, payload);
    if (response.data && 'category' in response.data) return response.data.category;
    return response.data as CategoryWithCount;
  }

  public static async updateCategoryStatus(
    id: string,
    isActive: boolean
  ): Promise<CategoryWithCount> {
    const response = await apiClient.patch<
      ApiResponse<CategoryWithCount | { category: CategoryWithCount }>,
      { isActive: boolean }
    >(`/menu/categories/${id}/status`, { isActive });
    if (response.data && 'category' in response.data) return response.data.category;
    return response.data as CategoryWithCount;
  }

  public static async reorderCategories(
    payload: ReorderCategoriesInput
  ): Promise<CategoryWithCount[]> {
    const response = await apiClient.patch<
      ApiResponse<CategoryWithCount[] | { categories: CategoryWithCount[] }>,
      ReorderCategoriesInput
    >('/menu/categories/reorder', payload);
    if (Array.isArray(response.data)) return response.data;
    if (
      response.data &&
      'categories' in response.data &&
      Array.isArray(response.data.categories)
    ) {
      return response.data.categories;
    }
    return [];
  }

  // ===========================================================================
  // 2. Menu Items
  // ===========================================================================

  public static async listItems(
    params?: ListMenuItemsQueryParams
  ): Promise<PaginatedMenuItemsData> {
    const response = await apiClient.get<ApiResponse<PaginatedMenuItemsData>>(
      '/menu/items',
      { params }
    );
    return response.data;
  }

  public static async getItemById(id: string): Promise<MenuItemRecord> {
    const response = await apiClient.get<
      ApiResponse<MenuItemRecord | { item: MenuItemRecord }>
    >(`/menu/items/${id}`);
    if (response.data && 'item' in response.data) return response.data.item;
    return response.data as MenuItemRecord;
  }

  public static async createItem(payload: CreateMenuItemInput): Promise<MenuItemRecord> {
    const response = await apiClient.post<
      ApiResponse<MenuItemRecord | { item: MenuItemRecord }>,
      CreateMenuItemInput
    >('/menu/items', payload);
    if (response.data && 'item' in response.data) return response.data.item;
    return response.data as MenuItemRecord;
  }

  public static async updateItem(
    id: string,
    payload: UpdateMenuItemInput
  ): Promise<MenuItemRecord> {
    const response = await apiClient.patch<
      ApiResponse<MenuItemRecord | { item: MenuItemRecord }>,
      UpdateMenuItemInput
    >(`/menu/items/${id}`, payload);
    if (response.data && 'item' in response.data) return response.data.item;
    return response.data as MenuItemRecord;
  }

  public static async updateItemStatus(
    id: string,
    isActive: boolean
  ): Promise<MenuItemRecord> {
    const response = await apiClient.patch<
      ApiResponse<MenuItemRecord | { item: MenuItemRecord }>,
      { isActive: boolean }
    >(`/menu/items/${id}/status`, { isActive });
    if (response.data && 'item' in response.data) return response.data.item;
    return response.data as MenuItemRecord;
  }

  public static async updateItemAvailability(
    id: string,
    isAvailable: boolean
  ): Promise<MenuItemRecord> {
    const response = await apiClient.patch<
      ApiResponse<MenuItemRecord | { item: MenuItemRecord }>,
      { isAvailable: boolean }
    >(`/menu/items/${id}/availability`, { isAvailable });
    if (response.data && 'item' in response.data) return response.data.item;
    return response.data as MenuItemRecord;
  }

  // ===========================================================================
  // 3. Portion / Price Variants
  // ===========================================================================

  public static async createVariant(
    itemId: string,
    payload: CreateVariantInput
  ): Promise<VariantRecord> {
    const response = await apiClient.post<
      ApiResponse<VariantRecord | { variant: VariantRecord }>,
      CreateVariantInput
    >(`/menu/items/${itemId}/variants`, payload);
    if (response.data && 'variant' in response.data) return response.data.variant;
    return response.data as VariantRecord;
  }

  public static async updateVariant(
    id: string,
    payload: UpdateVariantInput
  ): Promise<VariantRecord> {
    const response = await apiClient.patch<
      ApiResponse<VariantRecord | { variant: VariantRecord }>,
      UpdateVariantInput
    >(`/menu/variants/${id}`, payload);
    if (response.data && 'variant' in response.data) return response.data.variant;
    return response.data as VariantRecord;
  }

  public static async deleteVariant(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(
      `/menu/variants/${id}`
    );
    return response.data;
  }

  // ===========================================================================
  // 4. Modifier Groups
  // ===========================================================================

  public static async listModifierGroups(): Promise<ModifierGroupWithCount[]> {
    const response = await apiClient.get<
      ApiResponse<ModifierGroupWithCount[] | { modifierGroups: ModifierGroupWithCount[] }>
    >('/menu/modifier-groups');
    if (Array.isArray(response.data)) return response.data;
    if (
      response.data &&
      'modifierGroups' in response.data &&
      Array.isArray(response.data.modifierGroups)
    ) {
      return response.data.modifierGroups;
    }
    return [];
  }

  public static async getModifierGroupById(id: string): Promise<ModifierGroupWithCount> {
    const response = await apiClient.get<
      ApiResponse<ModifierGroupWithCount | { modifierGroup: ModifierGroupWithCount }>
    >(`/menu/modifier-groups/${id}`);
    if (response.data && 'modifierGroup' in response.data)
      return response.data.modifierGroup;
    return response.data as ModifierGroupWithCount;
  }

  public static async createModifierGroup(
    payload: CreateModifierGroupInput
  ): Promise<ModifierGroupWithCount> {
    const response = await apiClient.post<
      ApiResponse<ModifierGroupWithCount | { modifierGroup: ModifierGroupWithCount }>,
      CreateModifierGroupInput
    >('/menu/modifier-groups', payload);
    if (response.data && 'modifierGroup' in response.data)
      return response.data.modifierGroup;
    return response.data as ModifierGroupWithCount;
  }

  public static async updateModifierGroup(
    id: string,
    payload: UpdateModifierGroupInput
  ): Promise<ModifierGroupWithCount> {
    const response = await apiClient.patch<
      ApiResponse<ModifierGroupWithCount | { modifierGroup: ModifierGroupWithCount }>,
      UpdateModifierGroupInput
    >(`/menu/modifier-groups/${id}`, payload);
    if (response.data && 'modifierGroup' in response.data)
      return response.data.modifierGroup;
    return response.data as ModifierGroupWithCount;
  }

  public static async updateModifierGroupStatus(
    id: string,
    isActive: boolean
  ): Promise<ModifierGroupWithCount> {
    const response = await apiClient.patch<
      ApiResponse<ModifierGroupWithCount | { modifierGroup: ModifierGroupWithCount }>,
      { isActive: boolean }
    >(`/menu/modifier-groups/${id}/status`, { isActive });
    if (response.data && 'modifierGroup' in response.data)
      return response.data.modifierGroup;
    return response.data as ModifierGroupWithCount;
  }

  // ===========================================================================
  // 5. Modifiers / Options
  // ===========================================================================

  public static async createModifier(
    groupId: string,
    payload: CreateModifierInput
  ): Promise<ModifierRecord> {
    const response = await apiClient.post<
      ApiResponse<ModifierRecord | { modifier: ModifierRecord }>,
      CreateModifierInput
    >(`/menu/modifier-groups/${groupId}/modifiers`, payload);
    if (response.data && 'modifier' in response.data) return response.data.modifier;
    return response.data as ModifierRecord;
  }

  public static async updateModifier(
    id: string,
    payload: UpdateModifierInput
  ): Promise<ModifierRecord> {
    const response = await apiClient.patch<
      ApiResponse<ModifierRecord | { modifier: ModifierRecord }>,
      UpdateModifierInput
    >(`/menu/modifiers/${id}`, payload);
    if (response.data && 'modifier' in response.data) return response.data.modifier;
    return response.data as ModifierRecord;
  }

  public static async deleteModifier(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(
      `/menu/modifiers/${id}`
    );
    return response.data;
  }

  // ===========================================================================
  // 6. Item ↔ Modifier Group Linking
  // ===========================================================================

  public static async linkItemModifierGroup(
    itemId: string,
    payload: LinkItemModifierGroupInput
  ): Promise<{ success: boolean }> {
    const response = await apiClient.post<
      ApiResponse<{ success: boolean }>,
      LinkItemModifierGroupInput
    >(`/menu/items/${itemId}/modifier-groups`, payload);
    return response.data;
  }

  public static async unlinkItemModifierGroup(
    itemId: string,
    groupId: string
  ): Promise<{ success: boolean }> {
    const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(
      `/menu/items/${itemId}/modifier-groups/${groupId}`
    );
    return response.data;
  }
}
