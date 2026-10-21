import React, { useState, useMemo } from 'react';
import {
  useInventorySummaryQuery,
  useLowStockQuery,
  useValuationQuery,
  useInventoryItemsQuery,
  useStockLedgerQuery,
  useStockWastageQuery,
  useInventoryLocationsQuery,
  useSuppliersQuery,
  useStockTransfersQuery,
  useDeleteInventoryLocationMutation,
} from '@/features/inventory/hooks/useInventoryData';
import { useMenuItemsQuery } from '@/features/menu/hooks/useMenuData';
import { useAuthStore } from '@/core/auth/authStore';
import { usePermissions } from '@/core/auth/usePermissions';
import { formatPrice as centralizedFormatPrice } from '@/utils/format';
import {
  InventoryItemRecord,
  InventoryLocationRecord,
  MenuItemRecord,
} from '@/types';
import { InventoryItemModal } from '@/features/inventory/components/InventoryItemModal';
import { StockAdjustmentModal } from '@/features/inventory/components/StockAdjustmentModal';
import { RecordWastageModal } from '@/features/inventory/components/RecordWastageModal';
import { ReceiveStockModal } from '@/features/inventory/components/ReceiveStockModal';
import { RecipeManagerModal } from '@/features/inventory/components/RecipeManagerModal';
import { StockTransferModal } from '@/features/inventory/components/StockTransferModal';
import { LocationFormModal } from '@/features/inventory/components/LocationFormModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  Package,
  AlertTriangle,
  History,
  Trash2,
  ChefHat,
  PieChart,
  Plus,
  Search,
  RotateCw,
  Edit2,
  Sliders,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  TrendingDown,
  Phone,
  Mail,
  Warehouse,
} from 'lucide-react';
import { cn } from '@/utils/cn';

type InventoryTab =
  | 'ITEMS'
  | 'LOW_STOCK'
  | 'LEDGER'
  | 'TRANSFERS'
  | 'WASTAGE'
  | 'RECIPES'
  | 'VALUATION';

export const InventoryPage: React.FC = () => {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const currency =
    user && 'restaurant' in user && user.restaurant?.currency
      ? user.restaurant.currency
      : 'PKR';

  const canManage = hasPermission('inventory.manage');
  const canAdjust = hasPermission('inventory.adjust');
  const canReceive = hasPermission('inventory.receive');
  const canTransfer = hasPermission('inventory.transfer');
  const canWaste = hasPermission('inventory.waste');

  // Active Tab
  const [activeTab, setActiveTab] = useState<InventoryTab>('ITEMS');

  // Filters for Items Tab
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('ALL');
  const [lowStockFilterOnly, setLowStockFilterOnly] = useState<boolean>(false);
  const [ledgerLocationId, setLedgerLocationId] = useState<string>('ALL');
  const [ledgerType, setLedgerType] = useState<string>('ALL');
  const [locationActionError, setLocationActionError] = useState<string | null>(null);

  // Modals state
  const [itemModal, setItemModal] = useState<{
    open: boolean;
    item?: InventoryItemRecord | null;
  }>({ open: false });

  const [adjustmentModal, setAdjustmentModal] = useState<{
    open: boolean;
    item?: InventoryItemRecord | null;
  }>({ open: false });

  const [wastageModal, setWastageModal] = useState<{
    open: boolean;
    item?: InventoryItemRecord | null;
  }>({ open: false });

  const [transferModal, setTransferModal] = useState<{
    open: boolean;
    item?: InventoryItemRecord | null;
  }>({ open: false });

  const [locationModal, setLocationModal] = useState<{
    open: boolean;
    location?: InventoryLocationRecord | null;
  }>({ open: false });

  const [receiveModalOpen, setReceiveModalOpen] = useState<boolean>(false);

  const [recipeModalItem, setRecipeModalItem] = useState<MenuItemRecord | null>(null);

  // Queries
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useInventorySummaryQuery();

  const {
    data: lowStockData,
    isLoading: isLowStockLoading,
    refetch: refetchLowStock,
  } = useLowStockQuery();

  const {
    data: valuationData,
    isLoading: isValuationLoading,
    refetch: refetchValuation,
  } = useValuationQuery();

  const { data: rawLocations = [], refetch: refetchLocations } =
    useInventoryLocationsQuery();

  const { data: rawSuppliers = [], refetch: refetchSuppliers } = useSuppliersQuery();

  const locations = useMemo((): InventoryLocationRecord[] => {
    if (Array.isArray(rawLocations)) return rawLocations;
    if (
      rawLocations &&
      typeof rawLocations === 'object' &&
      'locations' in rawLocations &&
      Array.isArray((rawLocations as { locations: InventoryLocationRecord[] }).locations)
    ) {
      return (rawLocations as { locations: InventoryLocationRecord[] }).locations;
    }
    return [];
  }, [rawLocations]);

  const suppliers = useMemo(() => {
    if (Array.isArray(rawSuppliers)) return rawSuppliers;
    if (
      rawSuppliers &&
      typeof rawSuppliers === 'object' &&
      'suppliers' in rawSuppliers &&
      Array.isArray((rawSuppliers as { suppliers: unknown[] }).suppliers)
    ) {
      return (rawSuppliers as { suppliers: typeof rawSuppliers }).suppliers;
    }
    return [];
  }, [rawSuppliers]);

  const {
    data: itemsData,
    isLoading: isItemsLoading,
    isRefetching: isItemsRefetching,
    refetch: refetchItems,
  } = useInventoryItemsQuery({
    locationId: selectedLocationId !== 'ALL' ? selectedLocationId : undefined,
    lowStock: lowStockFilterOnly ? true : undefined,
    search: searchQuery.trim() || undefined,
    limit: 100,
  });

  const {
    data: ledgerData,
    isLoading: isLedgerLoading,
    refetch: refetchLedger,
  } = useStockLedgerQuery({
    limit: 50,
    locationId: ledgerLocationId !== 'ALL' ? ledgerLocationId : undefined,
    type: ledgerType !== 'ALL' ? ledgerType : undefined,
  });

  const {
    data: transfersData,
    isLoading: isTransfersLoading,
    refetch: refetchTransfers,
  } = useStockTransfersQuery({ limit: 50 });

  const {
    data: wastageData,
    isLoading: isWastageLoading,
    refetch: refetchWastage,
  } = useStockWastageQuery({ limit: 50 });

  const { data: menuItemsData, refetch: refetchMenuItems } = useMenuItemsQuery({
    limit: 100,
  });

  const deleteLocationMutation = useDeleteInventoryLocationMutation();

  const items = itemsData?.items || [];
  const menuItems = menuItemsData?.items || [];
  const lowStockItems = lowStockData?.items || [];
  const movements = ledgerData?.movements || [];
  const transfers = transfersData?.transfers || [];
  const wastageList = wastageData?.wastage || [];

  const formatPrice = (val: number) => {
    return centralizedFormatPrice(val, currency);
  };

  const handleRefreshAll = () => {
    refetchSummary();
    refetchLowStock();
    refetchValuation();
    refetchItems();
    refetchLedger();
    refetchTransfers();
    refetchWastage();
    refetchLocations();
    refetchSuppliers();
    refetchMenuItems();
  };

  const handleDeleteLocation = async (location: InventoryLocationRecord) => {
    setLocationActionError(null);
    const itemCount = location._count?.inventoryItems ?? 0;
    const confirmMessage =
      itemCount > 0
        ? `"${location.name}" still has ${itemCount} assigned item(s). It will be deactivated instead of deleted. Continue?`
        : `Delete location "${location.name}"?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      await deleteLocationMutation.mutateAsync(location.id);
      handleRefreshAll();
    } catch (err) {
      setLocationActionError(
        err instanceof Error ? err.message : 'Failed to delete location.'
      );
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden select-none -m-4 md:-m-6 p-3 sm:p-4 bg-pos-bg">
      <div className="flex-1 flex flex-col min-w-0 bg-pos-surface border border-pos-border rounded-lg overflow-hidden shadow-xs">
        {/* =========================================================================
            TOP HEADER BAR: Metrics & Quick Action CTAs
        ========================================================================= */}
        <div className="p-3 sm:p-3.5 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <Package size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-pos-text">
                  Stock & Inventory Control
                </h2>
                {summaryData && summaryData.lowStockItemsCount > 0 && (
                  <Badge variant="danger" size="sm" className="text-[10px]">
                    {summaryData.lowStockItemsCount} Low Stock
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-pos-text-muted mt-0.5 font-medium">
                Real-time stock valuation, BOM recipes, wastage, deliveries, and movement
                ledger
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isItemsRefetching}
              className="min-h-[36px] px-3 font-medium flex items-center gap-1.5"
            >
              <RotateCw size={14} className={isItemsRefetching ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {canReceive && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReceiveModalOpen(true)}
                className="min-h-[36px] text-xs font-semibold flex items-center gap-1.5 text-pos-success"
              >
                <Truck size={14} />
                <span>+ Receive Stock</span>
              </Button>
            )}

            {canTransfer && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTransferModal({ open: true, item: null })}
                className="min-h-[36px] text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowRightLeft size={14} />
                <span>Transfer Stock</span>
              </Button>
            )}

            {canAdjust && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAdjustmentModal({ open: true, item: null })}
                className="min-h-[36px] text-xs font-semibold flex items-center gap-1.5"
              >
                <Sliders size={14} />
                <span>Adjust Stock</span>
              </Button>
            )}

            {canWaste && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setWastageModal({ open: true, item: null })}
                className="min-h-[36px] text-xs font-semibold flex items-center gap-1.5 text-pos-danger"
              >
                <Trash2 size={14} />
                <span>Record Wastage</span>
              </Button>
            )}

            {canManage && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setItemModal({ open: true, item: null })}
                className="min-h-[36px] text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={16} />
                <span>+ New Item</span>
              </Button>
            )}
          </div>
        </div>

        {/* =========================================================================
          SUMMARY METRICS TILES
      ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 border-b border-pos-border bg-pos-surface-subtle shrink-0">
          <div className="p-2.5 rounded-md bg-pos-surface border border-pos-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted block">
              Total Inventory Items
            </span>
            <span className="text-sm sm:text-base font-mono font-bold text-pos-text mt-0.5 block">
              {isSummaryLoading ? '...' : summaryData?.totalItemsCount || 0}
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-pos-surface border border-pos-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-primary block">
              Stock Valuation
            </span>
            <span className="text-sm sm:text-base font-mono font-bold text-pos-primary mt-0.5 block">
              {isSummaryLoading ? '...' : formatPrice(summaryData?.totalValuation || 0)}
            </span>
          </div>

          <div
            onClick={() => setActiveTab('LOW_STOCK')}
            className="p-2.5 rounded-md bg-pos-surface border border-pos-border cursor-pointer hover:border-pos-warning transition-colors"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-warning flex items-center gap-1">
              <AlertTriangle size={11} /> Low Stock Items
            </span>
            <span className="text-sm sm:text-base font-mono font-bold text-pos-warning mt-0.5 block">
              {isSummaryLoading ? '...' : summaryData?.lowStockItemsCount || 0}
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-pos-surface border border-pos-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-danger flex items-center gap-1">
              <TrendingDown size={11} /> Out of Stock (0)
            </span>
            <span className="text-sm sm:text-base font-mono font-bold text-pos-danger mt-0.5 block">
              {isSummaryLoading ? '...' : summaryData?.outOfStockItemsCount || 0}
            </span>
          </div>
        </div>

        {/* =========================================================================
          VIEW SWITCHER TABS
      ========================================================================= */}
        <div className="px-3.5 py-2 border-b border-pos-border bg-pos-surface flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ITEMS')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 min-h-[32px]',
              activeTab === 'ITEMS'
                ? 'bg-pos-primary text-white shadow-xs'
                : 'bg-pos-surface-subtle text-pos-text-secondary hover:text-pos-text border border-pos-border'
            )}
          >
            <Package size={14} />
            <span>Stock Catalog ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LOW_STOCK')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 min-h-[32px]',
              activeTab === 'LOW_STOCK'
                ? 'bg-pos-warning text-white shadow-xs'
                : 'bg-pos-surface-subtle text-pos-text-secondary hover:text-pos-text border border-pos-border'
            )}
          >
            <AlertTriangle size={14} />
            <span>Low-Stock Alerts ({lowStockItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LEDGER')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 min-h-[32px]',
              activeTab === 'LEDGER'
                ? 'bg-pos-primary text-white shadow-xs'
                : 'bg-pos-surface-subtle text-pos-text-secondary hover:text-pos-text border border-pos-border'
            )}
          >
            <History size={14} />
            <span>Movement Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TRANSFERS')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 min-h-[32px]',
              activeTab === 'TRANSFERS'
                ? 'bg-pos-primary text-white shadow-xs'
                : 'bg-pos-surface-subtle text-pos-text-secondary hover:text-pos-text border border-pos-border'
            )}
          >
            <ArrowRightLeft size={14} />
            <span>Transfers ({transfers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WASTAGE')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 min-h-[32px]',
              activeTab === 'WASTAGE'
                ? 'bg-pos-danger text-white shadow-xs'
                : 'bg-pos-surface-subtle text-pos-text-secondary hover:text-pos-text border border-pos-border'
            )}
          >
            <Trash2 size={14} />
            <span>Wastage Log</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RECIPES')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 min-h-[32px]',
              activeTab === 'RECIPES'
                ? 'bg-pos-primary text-white shadow-xs'
                : 'bg-pos-surface-subtle text-pos-text-secondary hover:text-pos-text border border-pos-border'
            )}
          >
            <ChefHat size={14} />
            <span>Recipe / BOM Linker ({menuItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('VALUATION')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 min-h-[32px]',
              activeTab === 'VALUATION'
                ? 'bg-pos-primary text-white shadow-xs'
                : 'bg-pos-surface-subtle text-pos-text-secondary hover:text-pos-text border border-pos-border'
            )}
          >
            <PieChart size={14} />
            <span>Locations & Valuation</span>
          </button>
        </div>

        {/* =========================================================================
          VIEWPORT CONTENT AREA
      ========================================================================= */}
        <div className="flex-1 overflow-hidden bg-pos-bg flex flex-col min-h-0">
          {/* =======================================================================
            TAB 1: Stock Catalog & Levels
        ======================================================================= */}
          {activeTab === 'ITEMS' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Filter Bar */}
              <div className="p-3 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
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
                      placeholder="Search raw items or SKU..."
                      className="pl-8 pr-3 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text placeholder-pos-text-muted focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary w-48 sm:w-64 font-medium"
                    />
                  </div>

                  <select
                    value={selectedLocationId}
                    onChange={e => setSelectedLocationId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                  >
                    <option value="ALL">All Storage Locations</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-pos-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lowStockFilterOnly}
                    onChange={e => setLowStockFilterOnly(e.target.checked)}
                    className="h-4 w-4 rounded accent-pos-warning cursor-pointer"
                  />
                  <span>Show Low Stock Only</span>
                </label>
              </div>

              {/* Catalog Table */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isItemsLoading ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                    <Spinner size="lg" />
                    <span>Loading Inventory Items...</span>
                  </div>
                ) : items.length === 0 ? (
                  <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-3">
                    <Package size={40} className="text-pos-text-muted/40" />
                    <p className="font-bold text-base text-pos-text">
                      No Inventory Items Found
                    </p>
                    <p className="text-xs max-w-sm text-pos-text-secondary">
                      {searchQuery || selectedLocationId !== 'ALL'
                        ? 'No items match your active search filters.'
                        : 'No raw material inventory registered. Add your first item below.'}
                    </p>
                    {canManage && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setItemModal({ open: true, item: null })}
                        className="font-bold mt-2"
                      >
                        + Add Inventory Item
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-pos-border rounded-lg bg-pos-surface">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-pos-surface-subtle border-b border-pos-border text-pos-text-muted font-semibold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-3">SKU</th>
                          <th className="p-3">Item Name</th>
                          <th className="p-3">Location</th>
                          <th className="p-3">Unit Cost</th>
                          <th className="p-3">Current Stock</th>
                          <th className="p-3">Min / Target</th>
                          <th className="p-3">Total Value</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pos-border">
                        {items.map(it => {
                          const isLow = it.currentStock <= it.minStockLevel;
                          const isOut = it.currentStock <= 0;
                          const totalVal = it.currentStock * it.costPerUnit;

                          return (
                            <tr
                              key={it.id}
                              className="hover:bg-pos-surface-subtle transition-colors"
                            >
                              <td className="p-3 font-mono font-bold text-pos-primary text-xs">
                                #{it.itemCode}
                              </td>

                              <td className="p-3 font-bold text-pos-text">{it.name}</td>

                              <td className="p-3 text-pos-text-muted">
                                {it.location?.name || 'Unassigned'}
                              </td>

                              <td className="p-3 font-mono font-medium text-pos-text">
                                {formatPrice(it.costPerUnit)} / {it.unit}
                              </td>

                              <td className="p-3 font-mono font-bold text-sm text-pos-text">
                                {it.currentStock} {it.unit}
                              </td>

                              <td className="p-3 font-mono text-[11px] text-pos-text-muted">
                                Min: {it.minStockLevel} • Target:{' '}
                                {it.targetStockLevel || '-'}
                              </td>

                              <td className="p-3 font-mono font-bold text-pos-primary">
                                {formatPrice(totalVal)}
                              </td>

                              <td className="p-3 text-center">
                                {isOut ? (
                                  <Badge
                                    variant="danger"
                                    size="sm"
                                    className="text-[10px]"
                                  >
                                    Out of Stock
                                  </Badge>
                                ) : isLow ? (
                                  <Badge
                                    variant="warning"
                                    size="sm"
                                    className="text-[10px]"
                                  >
                                    Low Stock
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="success"
                                    size="sm"
                                    className="text-[10px]"
                                  >
                                    Adequate
                                  </Badge>
                                )}
                              </td>

                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {canTransfer && it.locationId && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setTransferModal({
                                          open: true,
                                          item: it,
                                        })
                                      }
                                      className="p-1.5 rounded-md text-pos-text-muted hover:text-pos-primary hover:bg-pos-primary-soft transition-colors"
                                      title="Transfer stock"
                                      aria-label="Transfer stock"
                                    >
                                      <ArrowRightLeft size={14} />
                                    </button>
                                  )}

                                  {canAdjust && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAdjustmentModal({
                                          open: true,
                                          item: it,
                                        })
                                      }
                                      className="p-1.5 rounded-md text-pos-text-muted hover:text-pos-primary hover:bg-pos-primary-soft transition-colors"
                                      title="Adjust Count"
                                      aria-label="Adjust count"
                                    >
                                      <Sliders size={14} />
                                    </button>
                                  )}

                                  {canManage && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setItemModal({ open: true, item: it })
                                      }
                                      className="p-1.5 rounded-md text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
                                      title="Edit item"
                                      aria-label="Edit item"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =======================================================================
            TAB 2: Low-Stock & Reorder Alerts
        ======================================================================= */}
          {activeTab === 'LOW_STOCK' && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isLowStockLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                  <Spinner size="lg" />
                  <span>Checking Low-Stock Levels...</span>
                </div>
              ) : lowStockItems.length === 0 ? (
                <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-3">
                  <Package size={40} className="text-pos-success/50" />
                  <p className="font-bold text-base text-pos-text">
                    All Inventory Levels Are Healthy!
                  </p>
                  <p className="text-xs max-w-sm text-pos-text-secondary">
                    No items are currently below their configured minimum threshold.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-pos-warning-soft border border-[#FDE68A] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-pos-warning shrink-0" />
                      <span className="font-bold text-pos-text">
                        {lowStockItems.length} items require reordering to reach target
                        stock
                      </span>
                    </div>
                    {canReceive && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setReceiveModalOpen(true)}
                        className="font-bold text-xs shadow-xs"
                      >
                        <Truck size={14} className="mr-1" /> Create Purchase Receipt
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lowStockItems.map(it => (
                      <div
                        key={it.id}
                        className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-mono text-xs font-bold text-pos-primary">
                                #{it.itemCode}
                              </span>
                              <h4 className="font-bold text-pos-text text-sm">
                                {it.name}
                              </h4>
                            </div>

                            <Badge variant="warning" size="sm" className="text-[10px]">
                              {it.currentStock <= 0 ? 'Out of Stock' : 'Low Stock'}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-md bg-pos-surface-subtle border border-pos-border text-xs font-mono mb-3">
                            <div>
                              <span className="text-[10px] text-pos-text-muted block">
                                Current
                              </span>
                              <span className="font-bold text-pos-danger">
                                {it.currentStock} {it.unit}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-pos-text-muted block">
                                Min Level
                              </span>
                              <span className="text-pos-text">
                                {it.minStockLevel} {it.unit}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-pos-text-muted block">
                                Target
                              </span>
                              <span className="text-pos-success">
                                {it.targetStockLevel} {it.unit}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs space-y-1 text-pos-text-muted">
                            <p>
                              Recommended Reorder:{' '}
                              <strong className="text-pos-text font-mono">
                                {it.recommendedReorderQuantity} {it.unit}
                              </strong>{' '}
                              (Est. Cost: {formatPrice(it.estimatedReorderCost)})
                            </p>
                            {it.supplier && (
                              <div className="flex items-center gap-3 pt-1 text-[11px]">
                                <span className="font-semibold text-pos-text">
                                  {it.supplier.name}
                                </span>
                                {it.supplier.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone size={11} /> {it.supplier.phone}
                                  </span>
                                )}
                                {it.supplier.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail size={11} /> {it.supplier.email}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-pos-border flex items-center justify-end gap-2">
                          {canAdjust && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                const raw = items.find(rawItem => rawItem.id === it.id);
                                setAdjustmentModal({ open: true, item: raw || null });
                              }}
                              className="text-xs font-semibold"
                            >
                              Audit Count
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =======================================================================
            TAB 3: Movement Ledger (Audit Trail)
        ======================================================================= */}
          {activeTab === 'LEDGER' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-3 border-b border-pos-border bg-pos-surface flex flex-wrap items-center gap-2 shrink-0">
                <select
                  value={ledgerLocationId}
                  onChange={e => setLedgerLocationId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                >
                  <option value="ALL">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <select
                  value={ledgerType}
                  onChange={e => setLedgerType(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                >
                  <option value="ALL">All Movement Types</option>
                  <option value="PURCHASE_RECEIPT">Purchase Receipt</option>
                  <option value="SALE_CONSUMPTION">Sale Consumption</option>
                  <option value="ORDER_VOID_RETURN">Order Void Return</option>
                  <option value="ADJUSTMENT_INCREASE">Adjustment Increase</option>
                  <option value="ADJUSTMENT_DECREASE">Adjustment Decrease</option>
                  <option value="WASTAGE">Wastage</option>
                  <option value="TRANSFER_IN">Transfer In</option>
                  <option value="TRANSFER_OUT">Transfer Out</option>
                </select>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isLedgerLoading ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                    <Spinner size="lg" />
                    <span>Loading Movement Ledger...</span>
                  </div>
                ) : movements.length === 0 ? (
                  <div className="py-24 text-center text-xs text-pos-text-muted">
                    No stock movement transactions recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-pos-border rounded-lg bg-pos-surface">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-pos-surface-subtle border-b border-pos-border text-pos-text-muted font-semibold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-3">Date / Time</th>
                          <th className="p-3">Item</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Qty Change</th>
                          <th className="p-3">Balance After</th>
                          <th className="p-3">Unit Cost</th>
                          <th className="p-3">Reason / Ref</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pos-border">
                        {movements.map(mov => {
                          const isPositive = mov.quantityChange > 0;
                          return (
                            <tr
                              key={mov.id}
                              className="hover:bg-pos-surface-subtle transition-colors font-mono"
                            >
                              <td className="p-3 text-pos-text-muted text-[11px]">
                                {new Date(mov.createdAt).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>

                              <td className="p-3 font-sans font-bold text-pos-text">
                                {mov.inventoryItem?.name || 'Item'} (#
                                {mov.inventoryItem?.itemCode})
                              </td>

                              <td className="p-3">
                                <Badge
                                  size="sm"
                                  variant={
                                    isPositive
                                      ? 'success'
                                      : mov.type === 'WASTAGE'
                                        ? 'danger'
                                        : 'default'
                                  }
                                  className="text-[10px]"
                                >
                                  {mov.type.replace(/_/g, ' ')}
                                </Badge>
                              </td>

                              <td
                                className={cn(
                                  'p-3 font-bold',
                                  isPositive ? 'text-pos-success' : 'text-pos-danger'
                                )}
                              >
                                <span className="inline-flex items-center gap-1">
                                  {isPositive ? (
                                    <ArrowUpRight size={14} />
                                  ) : (
                                    <ArrowDownRight size={14} />
                                  )}
                                  <span>
                                    {isPositive
                                      ? `+${mov.quantityChange}`
                                      : mov.quantityChange}{' '}
                                    {mov.inventoryItem?.unit}
                                  </span>
                                </span>
                              </td>

                              <td className="p-3 font-bold text-pos-text">
                                {mov.balanceAfter} {mov.inventoryItem?.unit}
                              </td>

                              <td className="p-3 text-pos-text-muted">
                                {formatPrice(mov.unitCost)}
                              </td>

                              <td className="p-3 font-sans text-pos-text-muted truncate max-w-xs">
                                {mov.reason || mov.referenceType || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =======================================================================
            TAB 3b: Stock Transfers History
        ======================================================================= */}
          {activeTab === 'TRANSFERS' && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="flex items-center justify-between mb-3 gap-2">
                <p className="text-xs text-pos-text-muted">
                  Transfer history from completed location moves. Each transfer writes
                  paired TRANSFER_OUT / TRANSFER_IN ledger entries.
                </p>
                {canTransfer && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setTransferModal({ open: true, item: null })}
                    className="text-xs font-bold shrink-0"
                  >
                    <ArrowRightLeft size={14} className="mr-1" />
                    New Transfer
                  </Button>
                )}
              </div>

              {isTransfersLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                  <Spinner size="lg" />
                  <span>Loading Transfers...</span>
                </div>
              ) : transfers.length === 0 ? (
                <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-3">
                  <ArrowRightLeft size={40} className="text-pos-text-muted/40" />
                  <p className="font-bold text-base text-pos-text">No Transfers Yet</p>
                  <p className="text-xs max-w-sm text-pos-text-secondary">
                    Transfer stock between storage locations when you have at least two
                    active locations and items assigned to a source.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transfers.map(trf => (
                    <div
                      key={trf.id}
                      className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-pos-primary">
                            #{trf.transferNumber}
                          </span>
                          <Badge variant="default" size="sm" className="text-[10px]">
                            {trf.status}
                          </Badge>
                          <span className="text-[11px] text-pos-text-muted">
                            {new Date(trf.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-pos-text">
                          {trf.fromLocation?.name || 'Source'} →{' '}
                          {trf.toLocation?.name || 'Destination'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {trf.items.map(it => (
                          <div
                            key={it.id}
                            className="flex items-center justify-between text-xs text-pos-text-muted"
                          >
                            <span>
                              {it.inventoryItem?.name} (#{it.inventoryItem?.itemCode})
                            </span>
                            <span className="font-mono font-bold text-pos-text">
                              {it.quantity} {it.inventoryItem?.unit}
                            </span>
                          </div>
                        ))}
                      </div>

                      {trf.notes && (
                        <p className="text-[11px] text-pos-text-muted mt-2 pt-2 border-t border-pos-border">
                          Notes: {trf.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =======================================================================
            TAB 4: Wastage Log
        ======================================================================= */}
          {activeTab === 'WASTAGE' && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isWastageLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                  <Spinner size="lg" />
                  <span>Loading Wastage Records...</span>
                </div>
              ) : wastageList.length === 0 ? (
                <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-3">
                  <Trash2 size={40} className="text-pos-text-muted/40" />
                  <p className="font-bold text-base text-pos-text">
                    No Wastage Records Logged
                  </p>
                  <p className="text-xs max-w-sm text-pos-text-secondary">
                    Log expired or spoiled materials using the Record Wastage button.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {wastageList.map(w => (
                    <div
                      key={w.id}
                      className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-pos-danger">
                            #{w.wastageNumber}
                          </span>
                          <Badge variant="danger" size="sm" className="text-[10px]">
                            {w.reason}
                          </Badge>
                        </div>

                        <span className="font-mono font-bold text-sm text-pos-danger">
                          {formatPrice(w.totalWastedValue)}
                        </span>
                      </div>

                      <div className="space-y-1 my-2">
                        {w.items.map(it => (
                          <div
                            key={it.id}
                            className="flex items-center justify-between text-xs text-pos-text-muted"
                          >
                            <span>
                              {it.inventoryItem?.name} (#{it.inventoryItem?.itemCode})
                              {it.itemReason && <> — {it.itemReason}</>}
                            </span>
                            <span className="font-mono font-bold text-pos-text">
                              {it.quantity} {it.inventoryItem?.unit} (
                              {formatPrice(it.totalCost)})
                            </span>
                          </div>
                        ))}
                      </div>

                      {w.notes && (
                        <p className="text-[11px] text-pos-text-muted mt-2 pt-2 border-t border-pos-border">
                          Notes: {w.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =======================================================================
            TAB 5: Recipe / BOM Linker
        ======================================================================= */}
          {activeTab === 'RECIPES' && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {menuItems.map(dish => (
                  <div
                    key={dish.id}
                    className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-pos-primary">
                            #{dish.itemCode}
                          </span>
                          <h4 className="font-bold text-pos-text text-sm">{dish.name}</h4>
                        </div>
                        <Badge variant="default" size="sm" className="text-[10px]">
                          {dish.category?.name || 'Catalog'}
                        </Badge>
                      </div>

                      <p className="text-xs text-pos-text-secondary line-clamp-2 mb-3 font-medium">
                        {dish.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-pos-border flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-pos-text">
                        {formatPrice(dish.basePrice)}
                      </span>

                      {canManage && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setRecipeModalItem(dish)}
                          className="text-xs font-semibold flex items-center gap-1.5"
                        >
                          <ChefHat size={13} />
                          <span>Manage Recipe (BOM)</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =======================================================================
            TAB 6: Locations & Valuation
        ======================================================================= */}
          {activeTab === 'VALUATION' && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary">
                    Stock Locations
                  </h4>
                  {canManage && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setLocationModal({ open: true, location: null })}
                      className="text-xs font-bold"
                    >
                      <Plus size={14} className="mr-1" />
                      Add Location
                    </Button>
                  )}
                </div>

                {locationActionError && (
                  <div className="p-2.5 rounded-md bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs">
                    {locationActionError}
                  </div>
                )}

                {locations.length === 0 ? (
                  <div className="py-10 text-center text-xs text-pos-text-muted border border-dashed border-pos-border rounded-lg">
                    No stock locations yet.
                    {canManage && ' Create one to assign inventory by storage area.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-pos-border rounded-lg bg-pos-surface">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-pos-surface-subtle border-b border-pos-border text-pos-text-muted font-semibold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-3">Name</th>
                          <th className="p-3">Code</th>
                          <th className="p-3">Items</th>
                          <th className="p-3">Flags</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pos-border">
                        {locations.map(loc => (
                          <tr
                            key={loc.id}
                            className="hover:bg-pos-surface-subtle transition-colors"
                          >
                            <td className="p-3 font-bold text-pos-text">{loc.name}</td>
                            <td className="p-3 font-mono text-pos-text-muted">
                              {loc.code || '—'}
                            </td>
                            <td className="p-3 font-mono text-pos-text">
                              {loc._count?.inventoryItems ?? '—'}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1 flex-wrap">
                                {loc.isDefault && (
                                  <Badge
                                    variant="success"
                                    size="sm"
                                    className="text-[10px]"
                                  >
                                    Default
                                  </Badge>
                                )}
                                <Badge
                                  variant={loc.isActive ? 'default' : 'danger'}
                                  size="sm"
                                  className="text-[10px]"
                                >
                                  {loc.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="text-[11px]"
                                  onClick={() => {
                                    setSelectedLocationId(loc.id);
                                    setActiveTab('ITEMS');
                                  }}
                                >
                                  View Stock
                                </Button>
                                {canManage && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setLocationModal({
                                          open: true,
                                          location: loc,
                                        })
                                      }
                                      className="p-1.5 rounded-md text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle"
                                      title="Edit location"
                                      aria-label="Edit location"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLocation(loc)}
                                      disabled={deleteLocationMutation.isPending}
                                      className="p-1.5 rounded-md text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger-soft"
                                      title="Delete or deactivate location"
                                      aria-label="Delete location"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {isValuationLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                    <Spinner size="lg" />
                    <span>Calculating Warehouse Valuation...</span>
                  </div>
                ) : (
                  <>
                    <div className="p-4 sm:p-5 rounded-lg bg-pos-surface border border-pos-border shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary block">
                          Grand Total Inventory Valuation
                        </span>
                        <h3 className="text-2xl font-mono font-black text-pos-primary mt-1">
                          {formatPrice(valuationData?.grandTotalValuation || 0)}
                        </h3>
                      </div>

                      <Warehouse size={40} className="text-pos-primary/30" />
                    </div>

                    <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary">
                      Valuation Breakdown By Storage Location
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {(valuationData?.locationsBreakdown || []).map(loc => (
                        <button
                          type="button"
                          key={loc.locationId}
                          onClick={() => {
                            if (loc.locationId) {
                              setSelectedLocationId(loc.locationId);
                              setActiveTab('ITEMS');
                            }
                          }}
                          className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-2 text-left hover:border-pos-primary transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-pos-text text-sm">
                              {loc.locationName}
                            </h5>
                            <Badge variant="default" size="sm" className="text-[10px]">
                              {loc.percentageOfTotal}%
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-pos-border">
                            <span className="text-xs text-pos-text-muted">
                              {loc.itemCount} items stored
                            </span>
                            <span className="font-mono font-bold text-sm text-pos-primary">
                              {formatPrice(loc.totalValuation)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
          INTERACTIVE MODALS
      ========================================================================= */}
        {itemModal.open && (
          <InventoryItemModal
            item={itemModal.item}
            locations={locations}
            suppliers={suppliers}
            currency={currency}
            onClose={() => setItemModal({ open: false, item: null })}
            onSuccess={() => handleRefreshAll()}
          />
        )}

        {adjustmentModal.open && (
          <StockAdjustmentModal
            initialItem={adjustmentModal.item}
            allItems={items}
            locations={locations}
            onClose={() => setAdjustmentModal({ open: false, item: null })}
            onSuccess={() => handleRefreshAll()}
          />
        )}

        {wastageModal.open && (
          <RecordWastageModal
            initialItem={wastageModal.item}
            allItems={items}
            locations={locations}
            currency={currency}
            onClose={() => setWastageModal({ open: false, item: null })}
            onSuccess={() => handleRefreshAll()}
          />
        )}

        {receiveModalOpen && (
          <ReceiveStockModal
            allItems={items}
            locations={locations}
            suppliers={suppliers}
            currency={currency}
            onClose={() => setReceiveModalOpen(false)}
            onSuccess={() => handleRefreshAll()}
          />
        )}

        {transferModal.open && (
          <StockTransferModal
            allItems={items}
            locations={locations}
            initialItem={transferModal.item}
            onClose={() => setTransferModal({ open: false, item: null })}
            onSuccess={() => handleRefreshAll()}
          />
        )}

        {locationModal.open && (
          <LocationFormModal
            location={locationModal.location}
            onClose={() => setLocationModal({ open: false, location: null })}
            onSuccess={() => {
              setLocationActionError(null);
              handleRefreshAll();
            }}
          />
        )}

        {recipeModalItem && (
          <RecipeManagerModal
            menuItem={recipeModalItem}
            allItems={items}
            onClose={() => setRecipeModalItem(null)}
            onSuccess={() => handleRefreshAll()}
          />
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
