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
      await apiClient.get<ApiResponse<CategoryWithCount[]>>('/menu/categories');
    return response.data;
  }

  public static async getCategoryById(id: string): Promise<CategoryWithCount> {
    const response = await apiClient.get<ApiResponse<CategoryWithCount>>(
      `/menu/categories/${id}`
    );
    return response.data;
  }

  public static async createCategory(
    payload: CreateCategoryInput
  ): Promise<CategoryWithCount> {
    const response = await apiClient.post<
      ApiResponse<CategoryWithCount>,
      CreateCategoryInput
    >('/menu/categories', payload);
    return response.data;
  }

  public static async updateCategory(
    id: string,
    payload: UpdateCategoryInput
  ): Promise<CategoryWithCount> {
    const response = await apiClient.patch<
      ApiResponse<CategoryWithCount>,
      UpdateCategoryInput
    >(`/menu/categories/${id}`, payload);
    return response.data;
  }

  public static async updateCategoryStatus(
    id: string,
    isActive: boolean
  ): Promise<CategoryWithCount> {
    const response = await apiClient.patch<
      ApiResponse<CategoryWithCount>,
      { isActive: boolean }
    >(`/menu/categories/${id}/status`, { isActive });
    return response.data;
  }

  public static async reorderCategories(
    payload: ReorderCategoriesInput
  ): Promise<CategoryWithCount[]> {
    const response = await apiClient.patch<
      ApiResponse<CategoryWithCount[]>,
      ReorderCategoriesInput
    >('/menu/categories/reorder', payload);
    return response.data;
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
    const response = await apiClient.get<ApiResponse<MenuItemRecord>>(
      `/menu/items/${id}`
    );
    return response.data;
  }

  public static async createItem(payload: CreateMenuItemInput): Promise<MenuItemRecord> {
    const response = await apiClient.post<
      ApiResponse<MenuItemRecord>,
      CreateMenuItemInput
    >('/menu/items', payload);
    return response.data;
  }

  public static async updateItem(
    id: string,
    payload: UpdateMenuItemInput
  ): Promise<MenuItemRecord> {
    const response = await apiClient.patch<
      ApiResponse<MenuItemRecord>,
      UpdateMenuItemInput
    >(`/menu/items/${id}`, payload);
    return response.data;
  }

  public static async updateItemStatus(
    id: string,
    isActive: boolean
  ): Promise<MenuItemRecord> {
    const response = await apiClient.patch<
      ApiResponse<MenuItemRecord>,
      { isActive: boolean }
    >(`/menu/items/${id}/status`, { isActive });
    return response.data;
  }

  public static async updateItemAvailability(
    id: string,
    isAvailable: boolean
  ): Promise<MenuItemRecord> {
    const response = await apiClient.patch<
      ApiResponse<MenuItemRecord>,
      { isAvailable: boolean }
    >(`/menu/items/${id}/availability`, { isAvailable });
    return response.data;
  }

  // ===========================================================================
  // 3. Portion / Price Variants
  // ===========================================================================

  public static async createVariant(
    itemId: string,
    payload: CreateVariantInput
  ): Promise<VariantRecord> {
    const response = await apiClient.post<ApiResponse<VariantRecord>, CreateVariantInput>(
      `/menu/items/${itemId}/variants`,
      payload
    );
    return response.data;
  }

  public static async updateVariant(
    id: string,
    payload: UpdateVariantInput
  ): Promise<VariantRecord> {
    const response = await apiClient.patch<
      ApiResponse<VariantRecord>,
      UpdateVariantInput
    >(`/menu/variants/${id}`, payload);
    return response.data;
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
    const response = await apiClient.get<ApiResponse<ModifierGroupWithCount[]>>(
      '/menu/modifier-groups'
    );
    return response.data;
  }

  public static async getModifierGroupById(id: string): Promise<ModifierGroupWithCount> {
    const response = await apiClient.get<ApiResponse<ModifierGroupWithCount>>(
      `/menu/modifier-groups/${id}`
    );
    return response.data;
  }

  public static async createModifierGroup(
    payload: CreateModifierGroupInput
  ): Promise<ModifierGroupWithCount> {
    const response = await apiClient.post<
      ApiResponse<ModifierGroupWithCount>,
      CreateModifierGroupInput
    >('/menu/modifier-groups', payload);
    return response.data;
  }

  public static async updateModifierGroup(
    id: string,
    payload: UpdateModifierGroupInput
  ): Promise<ModifierGroupWithCount> {
    const response = await apiClient.patch<
      ApiResponse<ModifierGroupWithCount>,
      UpdateModifierGroupInput
    >(`/menu/modifier-groups/${id}`, payload);
    return response.data;
  }

  public static async updateModifierGroupStatus(
    id: string,
    isActive: boolean
  ): Promise<ModifierGroupWithCount> {
    const response = await apiClient.patch<
      ApiResponse<ModifierGroupWithCount>,
      { isActive: boolean }
    >(`/menu/modifier-groups/${id}/status`, { isActive });
    return response.data;
  }

  // ===========================================================================
  // 5. Modifiers / Options
  // ===========================================================================

  public static async createModifier(
    groupId: string,
    payload: CreateModifierInput
  ): Promise<ModifierRecord> {
    const response = await apiClient.post<
      ApiResponse<ModifierRecord>,
      CreateModifierInput
    >(`/menu/modifier-groups/${groupId}/modifiers`, payload);
    return response.data;
  }

  public static async updateModifier(
    id: string,
    payload: UpdateModifierInput
  ): Promise<ModifierRecord> {
    const response = await apiClient.patch<
      ApiResponse<ModifierRecord>,
      UpdateModifierInput
    >(`/menu/modifiers/${id}`, payload);
    return response.data;
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
