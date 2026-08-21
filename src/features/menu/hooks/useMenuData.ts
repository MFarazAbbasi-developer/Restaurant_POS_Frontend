import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuApi } from '@/core/api/menuApi';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  ListMenuItemsQueryParams,
  CreateVariantInput,
  UpdateVariantInput,
  CreateModifierGroupInput,
  UpdateModifierGroupInput,
  CreateModifierInput,
  UpdateModifierInput,
  LinkItemModifierGroupInput,
} from '@/types';

export const MENU_QUERY_KEYS = {
  CATEGORIES: ['menu', 'categories'] as const,
  ITEMS: (params?: ListMenuItemsQueryParams) => ['menu', 'items', params] as const,
  ITEM: (id: string) => ['menu', 'item', id] as const,
  MODIFIER_GROUPS: ['menu', 'modifier-groups'] as const,
};

// =============================================================================
// Categories Hooks
// =============================================================================

export const useCategoriesQuery = () => {
  return useQuery({
    queryKey: MENU_QUERY_KEYS.CATEGORIES,
    queryFn: () => MenuApi.listCategories(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryInput) => MenuApi.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.CATEGORIES });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryInput }) =>
      MenuApi.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.CATEGORIES });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

export const useToggleCategoryStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      MenuApi.updateCategoryStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.CATEGORIES });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

// =============================================================================
// Menu Items Hooks
// =============================================================================

export const useMenuItemsQuery = (params?: ListMenuItemsQueryParams) => {
  return useQuery({
    queryKey: MENU_QUERY_KEYS.ITEMS(params),
    queryFn: () => MenuApi.listItems(params),
    staleTime: 1000 * 30,
  });
};

export const useMenuItemQuery = (id: string | null) => {
  return useQuery({
    queryKey: MENU_QUERY_KEYS.ITEM(id || ''),
    queryFn: () => MenuApi.getItemById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
};

export const useCreateMenuItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMenuItemInput) => MenuApi.createItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.CATEGORIES });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

export const useUpdateMenuItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMenuItemInput }) =>
      MenuApi.updateItem(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      queryClient.invalidateQueries({
        queryKey: MENU_QUERY_KEYS.ITEM(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

export const useToggleItemAvailabilityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      MenuApi.updateItemAvailability(id, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

export const useToggleItemStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      MenuApi.updateItemStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

// =============================================================================
// Portion / Variant Hooks
// =============================================================================

export const useCreateVariantMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: CreateVariantInput }) =>
      MenuApi.createVariant(itemId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      queryClient.invalidateQueries({
        queryKey: MENU_QUERY_KEYS.ITEM(variables.itemId),
      });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

export const useUpdateVariantMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVariantInput }) =>
      MenuApi.updateVariant(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

export const useDeleteVariantMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => MenuApi.deleteVariant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

// =============================================================================
// Modifier Groups & Options Hooks
// =============================================================================

export const useModifierGroupsQuery = () => {
  return useQuery({
    queryKey: MENU_QUERY_KEYS.MODIFIER_GROUPS,
    queryFn: () => MenuApi.listModifierGroups(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateModifierGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateModifierGroupInput) =>
      MenuApi.createModifierGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MENU_QUERY_KEYS.MODIFIER_GROUPS,
      });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

export const useUpdateModifierGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateModifierGroupInput }) =>
      MenuApi.updateModifierGroup(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MENU_QUERY_KEYS.MODIFIER_GROUPS,
      });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

export const useToggleModifierGroupStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      MenuApi.updateModifierGroupStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MENU_QUERY_KEYS.MODIFIER_GROUPS,
      });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

export const useCreateModifierMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      payload,
    }: {
      groupId: string;
      payload: CreateModifierInput;
    }) => MenuApi.createModifier(groupId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MENU_QUERY_KEYS.MODIFIER_GROUPS,
      });
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

export const useUpdateModifierMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateModifierInput }) =>
      MenuApi.updateModifier(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MENU_QUERY_KEYS.MODIFIER_GROUPS,
      });
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

export const useDeleteModifierMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => MenuApi.deleteModifier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MENU_QUERY_KEYS.MODIFIER_GROUPS,
      });
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

// =============================================================================
// Item ↔ Modifier Linking Hooks
// =============================================================================

export const useLinkModifierGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: string;
      payload: LinkItemModifierGroupInput;
    }) => MenuApi.linkItemModifierGroup(itemId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      queryClient.invalidateQueries({
        queryKey: MENU_QUERY_KEYS.ITEM(variables.itemId),
      });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};

export const useUnlinkModifierGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, groupId }: { itemId: string; groupId: string }) =>
      MenuApi.unlinkItemModifierGroup(itemId, groupId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      queryClient.invalidateQueries({
        queryKey: MENU_QUERY_KEYS.ITEM(variables.itemId),
      });
      queryClient.invalidateQueries({ queryKey: ['pos', 'menu'] });
    },
  });
};
