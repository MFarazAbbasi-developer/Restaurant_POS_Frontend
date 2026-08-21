import React, { useState, useMemo } from 'react';
import {
  useCategoriesQuery,
  useMenuItemsQuery,
  useModifierGroupsQuery,
  useToggleItemAvailabilityMutation,
  useToggleCategoryStatusMutation,
  useToggleModifierGroupStatusMutation,
  useDeleteModifierMutation,
} from '@/features/menu/hooks/useMenuData';
import { useAuthStore } from '@/core/auth/authStore';
import {
  MenuItemRecord,
  CategoryWithCount,
  ModifierGroupWithCount,
  ModifierRecord,
} from '@/types';
import { ItemFormModal } from '@/features/menu/components/ItemFormModal';
import { ItemVariantsModal } from '@/features/menu/components/ItemVariantsModal';
import { ItemModifiersModal } from '@/features/menu/components/ItemModifiersModal';
import { CategoryModal } from '@/features/menu/components/CategoryModal';
import { ModifierGroupModal } from '@/features/menu/components/ModifierGroupModal';
import { ModifierOptionModal } from '@/features/menu/components/ModifierOptionModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  UtensilsCrossed,
  FolderTree,
  SlidersHorizontal,
  Plus,
  Search,
  RotateCw,
  Edit2,
  Trash2,
  CheckCircle2,
  Ban,
  Layers,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const MenuPage: React.FC = () => {
  const { user } = useAuthStore();
  const currency =
    user && 'restaurant' in user && user.restaurant?.currency
      ? user.restaurant.currency
      : 'USD';

  // Active Tab: 'ITEMS' | 'CATEGORIES' | 'MODIFIERS'
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'CATEGORIES' | 'MODIFIERS'>(
    'ITEMS'
  );

  // Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<
    'ALL' | 'AVAILABLE' | 'UNAVAILABLE'
  >('ALL');

  // Modals state
  const [itemModal, setItemModal] = useState<{
    open: boolean;
    item?: MenuItemRecord | null;
  }>({
    open: false,
  });
  const [variantsModalItem, setVariantsModalItem] = useState<MenuItemRecord | null>(null);
  const [modifiersModalItem, setModifiersModalItem] = useState<MenuItemRecord | null>(
    null
  );
  const [categoryModal, setCategoryModal] = useState<{
    open: boolean;
    category?: CategoryWithCount | null;
  }>({
    open: false,
  });
  const [modifierGroupModal, setModifierGroupModal] = useState<{
    open: boolean;
    group?: ModifierGroupWithCount | null;
  }>({
    open: false,
  });
  const [modifierOptionModal, setModifierOptionModal] = useState<{
    open: boolean;
    groupId: string;
    groupName: string;
    modifier?: ModifierRecord | null;
  }>({
    open: false,
    groupId: '',
    groupName: '',
  });

  // Queries
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    refetch: refetchCategories,
  } = useCategoriesQuery();

  const {
    data: itemsData,
    isLoading: isItemsLoading,
    isRefetching: isItemsRefetching,
    refetch: refetchItems,
  } = useMenuItemsQuery({
    categoryId: selectedCategoryId !== 'ALL' ? selectedCategoryId : undefined,
    isAvailable:
      availabilityFilter === 'AVAILABLE'
        ? true
        : availabilityFilter === 'UNAVAILABLE'
          ? false
          : undefined,
    search: searchQuery.trim() || undefined,
    limit: 100,
  });

  const {
    data: modifierGroups = [],
    isLoading: isModifierGroupsLoading,
    refetch: refetchModifierGroups,
  } = useModifierGroupsQuery();

  // Mutations
  const toggleAvailabilityMutation = useToggleItemAvailabilityMutation();
  const toggleCategoryStatusMutation = useToggleCategoryStatusMutation();
  const toggleGroupStatusMutation = useToggleModifierGroupStatusMutation();
  const deleteModifierMutation = useDeleteModifierMutation();

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleRefreshAll = () => {
    refetchCategories();
    refetchItems();
    refetchModifierGroups();
  };

  // Metrics
  const items = useMemo(() => itemsData?.items || [], [itemsData?.items]);
  const totalItemsCount = items.length;
  const availableCount = useMemo(() => items.filter(i => i.isAvailable).length, [items]);
  const outOfStockCount = totalItemsCount - availableCount;

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden select-none -m-4 md:-m-6 p-3 sm:p-4 bg-pos-bg">
      {/* =========================================================================
          TOP HEADER BAR: Metrics & Quick Action CTAs
      ========================================================================= */}
      <div className="p-3.5 border-b border-pos-border bg-pos-header/90 rounded-t-2xl flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-pos-accent/15 border border-pos-accent/30 text-pos-accent flex items-center justify-center">
            <UtensilsCrossed size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-pos-text">
                Menu & Pricing Catalog
              </h2>
              <Badge variant="default" className="text-[10px] font-mono">
                {categories.length} Categories • {modifierGroups.length} Modifier Groups
              </Badge>
            </div>
            <p className="text-[11px] text-pos-text-muted mt-0.5 font-medium">
              Manage dishes, portion pricing variants, 86 availability, and modifier rules
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isItemsRefetching}
            className="min-h-[36px] px-3 font-semibold flex items-center gap-1.5"
          >
            <RotateCw size={14} className={isItemsRefetching ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCategoryModal({ open: true, category: null })}
            className="min-h-[36px] text-xs font-semibold flex items-center gap-1.5"
          >
            <FolderTree size={14} />
            <span>+ Category</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setModifierGroupModal({ open: true, group: null })}
            className="min-h-[36px] text-xs font-semibold flex items-center gap-1.5"
          >
            <SlidersHorizontal size={14} />
            <span>+ Modifiers</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setItemModal({ open: true, item: null })}
            className="min-h-[36px] text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} />
            <span>+ New Menu Item</span>
          </Button>
        </div>
      </div>

      {/* =========================================================================
          VIEW SWITCHER TABS
      ========================================================================= */}
      <div className="px-3.5 py-2 border-b border-pos-border bg-pos-surface flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('ITEMS')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[34px]',
              activeTab === 'ITEMS'
                ? 'bg-pos-accent text-white shadow-sm'
                : 'bg-pos-bg text-pos-text-muted hover:text-pos-text border border-pos-border'
            )}
          >
            <UtensilsCrossed size={14} />
            <span>Menu Items & Portions ({totalItemsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CATEGORIES')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[34px]',
              activeTab === 'CATEGORIES'
                ? 'bg-pos-accent text-white shadow-sm'
                : 'bg-pos-bg text-pos-text-muted hover:text-pos-text border border-pos-border'
            )}
          >
            <FolderTree size={14} />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MODIFIERS')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[34px]',
              activeTab === 'MODIFIERS'
                ? 'bg-pos-accent text-white shadow-sm'
                : 'bg-pos-bg text-pos-text-muted hover:text-pos-text border border-pos-border'
            )}
          >
            <SlidersHorizontal size={14} />
            <span>Modifier Groups & Addons ({modifierGroups.length})</span>
          </button>
        </div>

        {/* Quick Inventory Stock Pill */}
        {activeTab === 'ITEMS' && (
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono">
            <span className="text-pos-success font-semibold flex items-center gap-1">
              <CheckCircle2 size={13} /> {availableCount} Active
            </span>
            {outOfStockCount > 0 && (
              <span className="text-pos-danger font-semibold flex items-center gap-1">
                <Ban size={13} /> {outOfStockCount} 86'd Out
              </span>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          VIEWPORT CONTENT AREA
      ========================================================================= */}
      <div className="flex-1 overflow-hidden bg-pos-surface/40 border-x border-b border-pos-border rounded-b-2xl flex flex-col min-h-0">
        {/* =======================================================================
            TAB 1: Menu Items & Pricing
        ======================================================================= */}
        {activeTab === 'ITEMS' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Category Filter Chips & Search Bar */}
            <div className="p-3 border-b border-pos-border bg-pos-bg/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar max-w-full pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('ALL')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors',
                    selectedCategoryId === 'ALL'
                      ? 'bg-pos-accent text-white shadow-xs'
                      : 'bg-pos-surface border border-pos-border text-pos-text-muted hover:text-pos-text'
                  )}
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors',
                      selectedCategoryId === cat.id
                        ? 'bg-pos-accent text-white shadow-xs'
                        : 'bg-pos-surface border border-pos-border text-pos-text-muted hover:text-pos-text'
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Search & Stock Filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search dishes or SKU..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-pos-surface border border-pos-border text-xs text-pos-text placeholder-pos-text-muted/60 focus:outline-none focus:ring-2 focus:ring-pos-accent w-48 sm:w-60 font-medium"
                  />
                </div>

                <select
                  value={availabilityFilter}
                  onChange={e =>
                    setAvailabilityFilter(
                      e.target.value as 'ALL' | 'AVAILABLE' | 'UNAVAILABLE'
                    )
                  }
                  className="px-2.5 py-1.5 rounded-xl bg-pos-surface border border-pos-border text-xs text-pos-text font-semibold focus:outline-none focus:ring-2 focus:ring-pos-accent"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available Only</option>
                  <option value="UNAVAILABLE">86'd Out of Stock</option>
                </select>
              </div>
            </div>

            {/* Items Table / Cards */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isItemsLoading || isCategoriesLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                  <Spinner size="lg" />
                  <span>Loading Menu Catalog...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-3">
                  <UtensilsCrossed size={40} className="text-pos-text-muted/40" />
                  <p className="font-bold text-base text-pos-text">No Menu Items Found</p>
                  <p className="text-xs max-w-sm">
                    {searchQuery || selectedCategoryId !== 'ALL'
                      ? 'No items match your active search or category filters.'
                      : 'Your restaurant catalog is currently empty. Click below to add your first menu item.'}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setItemModal({ open: true, item: null })}
                    className="font-bold mt-2"
                  >
                    + Add Menu Item
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-pos-border rounded-xl bg-pos-surface">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-pos-header border-b border-pos-border text-pos-text-muted font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Item Details</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Base Price</th>
                        <th className="p-3">Portions / Variants</th>
                        <th className="p-3">Modifier Groups</th>
                        <th className="p-3 text-center">86 Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pos-border/60">
                      {items.map(it => (
                        <tr
                          key={it.id}
                          className="hover:bg-pos-surface-hover transition-colors"
                        >
                          {/* SKU */}
                          <td className="p-3 font-mono font-bold text-pos-accent text-xs">
                            #{it.itemCode}
                          </td>

                          {/* Item Details */}
                          <td className="p-3">
                            <span className="font-bold text-pos-text block text-xs">
                              {it.name}
                            </span>
                            {it.urduName && (
                              <span className="text-[11px] text-pos-text-muted font-urdu block">
                                {it.urduName}
                              </span>
                            )}
                          </td>

                          {/* Category */}
                          <td className="p-3">
                            <Badge variant="default" className="text-[10px]">
                              {it.category?.name || 'Uncategorized'}
                            </Badge>
                          </td>

                          {/* Base Price */}
                          <td className="p-3 font-mono font-bold text-pos-text text-sm">
                            {formatPrice(it.basePrice)}
                          </td>

                          {/* Portions / Variants */}
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => setVariantsModalItem(it)}
                              className="px-2 py-1 rounded-lg bg-pos-bg hover:bg-pos-info/10 hover:text-pos-info border border-pos-border text-[11px] font-semibold transition-colors flex items-center gap-1.5"
                            >
                              <Layers size={13} />
                              <span>
                                {it.variants && it.variants.length > 0
                                  ? `${it.variants.length} Sizes`
                                  : 'Add Portions'}
                              </span>
                            </button>
                          </td>

                          {/* Modifier Groups */}
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => setModifiersModalItem(it)}
                              className="px-2 py-1 rounded-lg bg-pos-bg hover:bg-pos-accent/10 hover:text-pos-accent border border-pos-border text-[11px] font-semibold transition-colors flex items-center gap-1.5"
                            >
                              <SlidersHorizontal size={13} />
                              <span>
                                {it.modifierGroups && it.modifierGroups.length > 0
                                  ? `${it.modifierGroups.length} Groups`
                                  : 'Attach Modifiers'}
                              </span>
                            </button>
                          </td>

                          {/* 86 Availability Toggle */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                toggleAvailabilityMutation.mutate({
                                  id: it.id,
                                  isAvailable: !it.isAvailable,
                                })
                              }
                              className={cn(
                                'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1',
                                it.isAvailable
                                  ? 'bg-pos-success/15 text-pos-success border border-pos-success/30 hover:bg-pos-success/25'
                                  : 'bg-pos-danger/15 text-pos-danger border border-pos-danger/30 hover:bg-pos-danger/25'
                              )}
                            >
                              {it.isAvailable ? (
                                <>
                                  <CheckCircle2 size={11} /> In Stock
                                </>
                              ) : (
                                <>
                                  <Ban size={11} /> 86'd Out
                                </>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => setItemModal({ open: true, item: it })}
                              className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
                              aria-label="Edit item"
                            >
                              <Edit2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =======================================================================
            TAB 2: Categories
        ======================================================================= */}
        {activeTab === 'CATEGORIES' && (
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {isCategoriesLoading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                <Spinner size="lg" />
                <span>Loading Categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-3">
                <FolderTree size={40} className="text-pos-text-muted/40" />
                <p className="font-bold text-base text-pos-text">No Categories Defined</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCategoryModal({ open: true, category: null })}
                  className="font-bold mt-2"
                >
                  + Create First Category
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl bg-pos-surface border border-pos-border shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-pos-text text-sm">
                            {cat.name}
                          </span>
                          <Badge
                            variant={cat.isActive ? 'success' : 'default'}
                            className="text-[10px]"
                          >
                            {cat.isActive ? 'Active' : 'Hidden'}
                          </Badge>
                        </div>

                        <button
                          type="button"
                          onClick={() => setCategoryModal({ open: true, category: cat })}
                          className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
                          aria-label="Edit category"
                        >
                          <Edit2 size={15} />
                        </button>
                      </div>

                      <p className="text-xs text-pos-text-muted line-clamp-2">
                        {cat.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-pos-border/60 flex items-center justify-between text-xs">
                      <span className="text-pos-text-muted">
                        Items:{' '}
                        <strong className="text-pos-text">
                          {cat._count?.menuItems || 0}
                        </strong>
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          toggleCategoryStatusMutation.mutate({
                            id: cat.id,
                            isActive: !cat.isActive,
                          })
                        }
                        className="text-[11px] text-pos-accent hover:underline font-semibold"
                      >
                        {cat.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =======================================================================
            TAB 3: Modifier Groups & Options
        ======================================================================= */}
        {activeTab === 'MODIFIERS' && (
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {isModifierGroupsLoading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                <Spinner size="lg" />
                <span>Loading Modifier Groups...</span>
              </div>
            ) : modifierGroups.length === 0 ? (
              <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-3">
                <SlidersHorizontal size={40} className="text-pos-text-muted/40" />
                <p className="font-bold text-base text-pos-text">No Modifier Groups</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setModifierGroupModal({ open: true, group: null })}
                  className="font-bold mt-2"
                >
                  + Create First Modifier Group
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modifierGroups.map(group => (
                  <div
                    key={group.id}
                    className="p-4 rounded-2xl bg-pos-surface border border-pos-border shadow-xs flex flex-col"
                  >
                    {/* Group Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-pos-text text-sm">
                            {group.name}
                          </h4>
                          <Badge variant="default" className="text-[10px]">
                            {group.selectionType}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-pos-text-muted mt-0.5">
                          Selection limits: Min {group.minSelections} • Max{' '}
                          {group.maxSelections}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setModifierGroupModal({ open: true, group })}
                          className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
                          aria-label="Edit group"
                        >
                          <Edit2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Options List */}
                    <div className="flex-1 my-3 space-y-1.5">
                      {group.modifiers && group.modifiers.length > 0 ? (
                        group.modifiers.map(mod => (
                          <div
                            key={mod.id}
                            className="p-2 rounded-xl bg-pos-bg border border-pos-border/60 flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-pos-text">{mod.name}</span>

                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-pos-accent">
                                {mod.priceAdjustment > 0
                                  ? `+${formatPrice(mod.priceAdjustment)}`
                                  : 'Free'}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  setModifierOptionModal({
                                    open: true,
                                    groupId: group.id,
                                    groupName: group.name,
                                    modifier: mod,
                                  })
                                }
                                className="p-1 rounded text-pos-text-muted hover:text-pos-text"
                                aria-label="Edit option"
                              >
                                <Edit2 size={12} />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Delete option "${mod.name}"?`)) {
                                    deleteModifierMutation.mutate(mod.id);
                                  }
                                }}
                                className="p-1 rounded text-pos-text-muted hover:text-pos-danger"
                                aria-label="Delete option"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center bg-pos-bg rounded-xl text-[11px] text-pos-text-muted">
                          No options added to this modifier group yet.
                        </div>
                      )}
                    </div>

                    {/* Group Footer */}
                    <div className="pt-2 border-t border-pos-border/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          toggleGroupStatusMutation.mutate({
                            id: group.id,
                            isActive: !group.isActive,
                          })
                        }
                        className="text-[11px] text-pos-text-muted hover:underline"
                      >
                        {group.isActive ? 'Status: Active' : 'Status: Hidden'}
                      </button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setModifierOptionModal({
                            open: true,
                            groupId: group.id,
                            groupName: group.name,
                            modifier: null,
                          })
                        }
                        className="text-xs font-semibold flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>Add Option</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          INTERACTIVE MODALS
      ========================================================================= */}
      {itemModal.open && (
        <ItemFormModal
          item={itemModal.item}
          categories={categories}
          defaultCategoryId={
            selectedCategoryId !== 'ALL' ? selectedCategoryId : undefined
          }
          currency={currency}
          onClose={() => setItemModal({ open: false, item: null })}
          onSuccess={() => refetchItems()}
        />
      )}

      {variantsModalItem && (
        <ItemVariantsModal
          item={variantsModalItem}
          currency={currency}
          onClose={() => setVariantsModalItem(null)}
          onSuccess={() => refetchItems()}
        />
      )}

      {modifiersModalItem && (
        <ItemModifiersModal
          item={modifiersModalItem}
          onClose={() => setModifiersModalItem(null)}
          onSuccess={() => refetchItems()}
        />
      )}

      {categoryModal.open && (
        <CategoryModal
          category={categoryModal.category}
          onClose={() => setCategoryModal({ open: false, category: null })}
          onSuccess={() => refetchCategories()}
        />
      )}

      {modifierGroupModal.open && (
        <ModifierGroupModal
          group={modifierGroupModal.group}
          onClose={() => setModifierGroupModal({ open: false, group: null })}
          onSuccess={() => refetchModifierGroups()}
        />
      )}

      {modifierOptionModal.open && (
        <ModifierOptionModal
          groupId={modifierOptionModal.groupId}
          groupName={modifierOptionModal.groupName}
          modifier={modifierOptionModal.modifier}
          currency={currency}
          onClose={() =>
            setModifierOptionModal({
              open: false,
              groupId: '',
              groupName: '',
              modifier: null,
            })
          }
          onSuccess={() => refetchModifierGroups()}
        />
      )}
    </div>
  );
};
