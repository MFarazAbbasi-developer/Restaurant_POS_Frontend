import React, { useState, useCallback } from 'react';
import {
  usePromotionsQuery,
  useTogglePromotionStatusMutation,
  useDeletePromotionMutation,
} from '@/features/promotions/hooks/usePromotionData';
import { useAuthStore } from '@/core/auth/authStore';
import { formatPrice as centralizedFormatPrice } from '@/utils/format';
import { PromotionRecord, PromotionType } from '@/types';
import { PromotionFormModal } from '@/features/promotions/components/PromotionFormModal';
import { PromotionDetailsDrawer } from '@/features/promotions/components/PromotionDetailsDrawer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  Gift,
  Plus,
  RotateCw,
  Search,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Power,
  ChevronRight,
  Hash,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const PromotionsPage: React.FC = () => {
  const { user } = useAuthStore();
  const currency =
    user && 'restaurant' in user && user.restaurant?.currency
      ? user.restaurant.currency
      : 'PKR';

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>(
    'ALL'
  );
  const [selectedType, setSelectedType] = useState<PromotionType | 'ALL'>('ALL');
  const [selectedAutoApply, setSelectedAutoApply] = useState<'ALL' | 'AUTO' | 'CODE'>(
    'ALL'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawers
  const [formModal, setFormModal] = useState<{
    open: boolean;
    promotion?: PromotionRecord | null;
  }>({ open: false });

  const [selectedPromoForDrawer, setSelectedPromoForDrawer] =
    useState<PromotionRecord | null>(null);

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Queries & Mutations
  const {
    data: promotionsData,
    isLoading,
    isRefetching,
    refetch,
  } = usePromotionsQuery({
    type: selectedType !== 'ALL' ? selectedType : undefined,
    isActive:
      selectedStatus === 'ACTIVE'
        ? true
        : selectedStatus === 'INACTIVE'
          ? false
          : undefined,
    isAutoApply:
      selectedAutoApply === 'AUTO'
        ? true
        : selectedAutoApply === 'CODE'
          ? false
          : undefined,
    search: searchQuery.trim() || undefined,
    limit: 100,
  });

  const toggleMutation = useTogglePromotionStatusMutation();
  const deleteMutation = useDeletePromotionMutation();

  const promotions = promotionsData?.items || [];

  const handleCopyCode = (id: string, code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleDelete = async (promo: PromotionRecord) => {
    if (!window.confirm(`Are you sure you want to delete campaign "${promo.name}"?`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(promo.id);
      if (selectedPromoForDrawer?.id === promo.id) {
        setSelectedPromoForDrawer(null);
      }
    } catch {
      // handled
    }
  };

  const formatPrice = useCallback((val: number | string | null | undefined) => {
    return centralizedFormatPrice(val, currency);
  }, [currency]);

  const formatDiscountFormula = (promo: PromotionRecord) => {
    switch (promo.type) {
      case 'PERCENTAGE':
        return `${promo.discountValue}% OFF`;
      case 'FIXED_AMOUNT':
        return `${formatPrice(promo.discountValue)} OFF`;
      case 'BUY_X_GET_Y':
        return `Buy ${promo.buyQuantity || 1} Get ${promo.getQuantity || 1}`;
      case 'FREE_ITEM':
        return 'Free Item';
      default:
        return `${promo.discountValue} Off`;
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
              <Gift size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-pos-text">
                  Discounts & Promotional Campaigns
                </h2>
                <Badge variant="default" size="sm" className="text-[10px] font-mono">
                  {promotions.length} Campaigns
                </Badge>
              </div>
              <p className="text-[11px] text-pos-text-muted mt-0.5 font-medium">
                Coupon promo codes, percentage & flat discounts, BOGO rules, and happy
                hours
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="min-h-[36px] px-3 font-medium flex items-center gap-1.5"
            >
              <RotateCw size={14} className={isRefetching ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setFormModal({ open: true, promotion: null })}
              className="min-h-[36px] text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={16} />
              <span>+ New Campaign</span>
            </Button>
          </div>
        </div>

        {/* =========================================================================
          SUMMARY METRICS TILES
      ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 border-b border-pos-border bg-pos-surface shrink-0">
          <div className="p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary block">
              Total Campaigns
            </span>
            <span className="text-base font-mono font-bold text-pos-text mt-0.5 block">
              {promotions.length} Configured
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-success block">
              Active Campaigns
            </span>
            <span className="text-base font-mono font-bold text-pos-success mt-0.5 block">
              {promotions.filter(p => p.isActive).length} Live
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-primary block">
              Auto-Applied Rules
            </span>
            <span className="text-base font-mono font-bold text-pos-primary mt-0.5 block">
              {promotions.filter(p => p.isAutoApply).length} In Cart
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary block">
              Coupon Codes
            </span>
            <span className="text-base font-mono font-bold text-pos-text mt-0.5 block">
              {promotions.filter(p => Boolean(p.code)).length} Voucher Codes
            </span>
          </div>
        </div>

        {/* =========================================================================
          FILTERS TOOLBAR
      ========================================================================= */}
        <div className="p-3 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e =>
                setSelectedStatus(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
              }
              className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* Discount Type Filter */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as PromotionType | 'ALL')}
              className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
            >
              <option value="ALL">All Discount Types</option>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED_AMOUNT">Fixed Flat ({currency})</option>
              <option value="BUY_X_GET_Y">Buy X Get Y (BOGO)</option>
              <option value="FREE_ITEM">Free Item Reward</option>
            </select>

            {/* Code vs Auto Apply */}
            <select
              value={selectedAutoApply}
              onChange={e =>
                setSelectedAutoApply(e.target.value as 'ALL' | 'AUTO' | 'CODE')
              }
              className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
            >
              <option value="ALL">All Trigger Types</option>
              <option value="AUTO">Auto-Apply (No code)</option>
              <option value="CODE">Coupon Code Required</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search campaign, code..."
              className="pl-8 pr-3 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text placeholder-pos-text-muted focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary w-44 sm:w-56 font-medium"
            />
          </div>
        </div>

        {/* =========================================================================
          CONTENT AREA: CAMPAIGN CARDS
      ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-pos-bg">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
              <Spinner size="lg" />
              <span>Loading Promotional Campaigns...</span>
            </div>
          ) : promotions.length === 0 ? (
            <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-3">
              <Gift size={40} className="text-pos-text-muted/40" />
              <p className="font-bold text-base text-pos-text">No Promotions Found</p>
              <p className="text-xs max-w-sm text-pos-text-secondary">
                {searchQuery || selectedStatus !== 'ALL' || selectedType !== 'ALL'
                  ? 'No promotional campaigns match your active filter criteria.'
                  : 'No discount or promotional campaigns created yet. Click below to launch your first offer.'}
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setFormModal({ open: true, promotion: null })}
                className="font-bold mt-2 shadow-xs"
              >
                + Create Campaign
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {promotions.map(promo => {
                const isExpired = promo.endDate && new Date(promo.endDate) < new Date();

                return (
                  <div
                    key={promo.id}
                    onClick={() => setSelectedPromoForDrawer(promo)}
                    className={cn(
                      'p-3.5 rounded-lg bg-pos-surface border shadow-xs transition-colors cursor-pointer flex flex-col justify-between hover:border-pos-primary/50',
                      !promo.isActive
                        ? 'border-pos-border opacity-60'
                        : 'border-pos-border'
                    )}
                  >
                    <div>
                      {/* Top Row: Promo Code / Auto-Apply Tag & Status */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          {promo.code ? (
                            <span
                              onClick={e => handleCopyCode(promo.id, promo.code!, e)}
                              className="px-2 py-0.5 rounded-md bg-pos-surface-subtle border border-pos-border font-mono font-bold text-pos-primary text-xs flex items-center gap-1 hover:border-pos-primary transition-colors shadow-xs"
                            >
                              <Hash size={11} />
                              <span>{promo.code}</span>
                              {copiedCodeId === promo.id ? (
                                <Check size={11} className="text-pos-success" />
                              ) : (
                                <Copy size={11} className="text-pos-text-muted" />
                              )}
                            </span>
                          ) : promo.isAutoApply ? (
                            <Badge
                              variant="info"
                              size="sm"
                              className="text-[9px] flex items-center gap-1"
                            >
                              <Sparkles size={10} /> Auto-Apply
                            </Badge>
                          ) : (
                            <Badge variant="default" size="sm" className="text-[9px]">
                              Manual Selection
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isExpired && (
                            <Badge variant="danger" size="sm" className="text-[9px]">
                              Expired
                            </Badge>
                          )}
                          <Badge
                            variant={promo.isActive ? 'success' : 'default'}
                            size="sm"
                            className="text-[9px]"
                          >
                            {promo.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>

                      {/* Campaign Title & Formula */}
                      <div className="mb-2.5">
                        <h4 className="font-bold text-pos-text text-sm line-clamp-1">
                          {promo.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono font-bold text-pos-primary text-sm">
                            {formatDiscountFormula(promo)}
                          </span>
                          <Badge variant="default" size="sm" className="text-[9px]">
                            {promo.targetType} Scope
                          </Badge>
                        </div>
                        {promo.description && (
                          <p className="text-[11px] text-pos-text-secondary mt-1 line-clamp-1 font-medium">
                            {promo.description}
                          </p>
                        )}
                      </div>

                      {/* Constraints & Schedule Snippet */}
                      <div className="p-2.5 rounded-md bg-pos-surface-subtle border border-pos-border text-xs space-y-1 mb-2.5 text-[11px]">
                        {(promo.startTime || promo.endTime) && (
                          <div className="flex items-center gap-1 text-pos-primary font-semibold">
                            <Clock size={11} />
                            <span>
                              Happy Hour: {promo.startTime || '00:00'} -{' '}
                              {promo.endTime || '23:59'}
                            </span>
                          </div>
                        )}

                        {promo.minOrderAmount ? (
                          <div className="text-pos-text-secondary">
                            Min Order: {formatPrice(promo.minOrderAmount)}
                          </div>
                        ) : null}

                        <div className="flex items-center justify-between text-pos-text-secondary pt-1 border-t border-pos-border">
                          <span>Redemptions:</span>
                          <span className="font-mono font-bold text-pos-text">
                            {promo.currentUsageCount || 0}
                            {promo.usageLimit ? ` / ${promo.usageLimit}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bottom Bar */}
                    <div
                      onClick={e => e.stopPropagation()}
                      className="pt-2.5 border-t border-pos-border flex items-center justify-between gap-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(promo.id)}
                        disabled={toggleMutation.isPending}
                        className={cn(
                          'px-2 py-1 rounded-md border font-semibold text-[11px] transition-colors flex items-center gap-1',
                          promo.isActive
                            ? 'bg-pos-surface border-pos-border text-pos-text-secondary hover:text-pos-text'
                            : 'bg-pos-primary-soft border-pos-primary text-pos-primary'
                        )}
                      >
                        <Power size={11} />
                        <span>{promo.isActive ? 'Turn Off' : 'Turn On'}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setFormModal({ open: true, promotion: promo })}
                          className="p-1.5 rounded-md text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
                          title="Edit campaign"
                          aria-label="Edit campaign"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(promo)}
                          className="p-1.5 rounded-md text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger-soft transition-colors"
                          title="Delete campaign"
                          aria-label="Delete campaign"
                        >
                          <Trash2 size={13} />
                        </button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedPromoForDrawer(promo)}
                          className="text-xs font-semibold flex items-center gap-1"
                        >
                          <span>Details</span>
                          <ChevronRight size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =========================================================================
          INTERACTIVE MODALS & DRAWERS
      ========================================================================= */}
        {formModal.open && (
          <PromotionFormModal
            promotion={formModal.promotion}
            currency={currency}
            onClose={() => setFormModal({ open: false, promotion: null })}
            onSuccess={() => refetch()}
          />
        )}

        {selectedPromoForDrawer && (
          <PromotionDetailsDrawer
            promotion={selectedPromoForDrawer}
            currency={currency}
            onClose={() => setSelectedPromoForDrawer(null)}
            onEdit={promo => {
              setSelectedPromoForDrawer(null);
              setFormModal({ open: true, promotion: promo });
            }}
            onDelete={promo => handleDelete(promo)}
          />
        )}
      </div>
    </div>
  );
};

export default PromotionsPage;
