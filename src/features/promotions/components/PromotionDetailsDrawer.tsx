import React, { useState } from 'react';
import { PromotionRecord } from '@/types';
import {
  usePromotionUsagesQuery,
  useTogglePromotionStatusMutation,
} from '../hooks/usePromotionData';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  X,
  Gift,
  Copy,
  Check,
  Calendar,
  Clock,
  Layers,
  Sparkles,
  Edit2,
  Trash2,
  Power,
  RotateCw,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface PromotionDetailsDrawerProps {
  promotion: PromotionRecord;
  currency?: string;
  onClose: () => void;
  onEdit: (promotion: PromotionRecord) => void;
  onDelete: (promotion: PromotionRecord) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const PromotionDetailsDrawer: React.FC<PromotionDetailsDrawerProps> = ({
  promotion,
  currency = 'USD',
  onClose,
  onEdit,
  onDelete,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'usages'>('rules');

  const {
    data: usagesData,
    isLoading: isUsagesLoading,
    refetch: refetchUsages,
  } = usePromotionUsagesQuery(promotion.id);

  const toggleMutation = useTogglePromotionStatusMutation();
  const usages = usagesData?.usages || [];

  const handleCopyCode = () => {
    if (promotion.code) {
      navigator.clipboard.writeText(promotion.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const formatDiscountFormula = () => {
    switch (promotion.type) {
      case 'PERCENTAGE':
        return `${promotion.discountValue}% OFF${
          promotion.maxDiscountAmount
            ? ` (Max ${formatPrice(promotion.maxDiscountAmount)})`
            : ''
        }`;
      case 'FIXED_AMOUNT':
        return `${formatPrice(promotion.discountValue)} FLAT OFF`;
      case 'BUY_X_GET_Y':
        return `Buy ${promotion.buyQuantity || 1} Get ${
          promotion.getQuantity || 1
        } at ${promotion.getDiscountPercentage || 100}% Off`;
      case 'FREE_ITEM':
        return 'Free Item Reward';
      default:
        return `${promotion.discountValue} Discount`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-pos-surface border-l border-pos-border shadow-modal flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <Gift size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-pos-text line-clamp-1">
                  {promotion.name}
                </h3>
                <Badge
                  variant={promotion.isActive ? 'success' : 'default'}
                  size="sm"
                  className="text-[10px]"
                >
                  {promotion.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-pos-text-muted font-medium mt-0.5">
                {promotion.targetType} Level • {promotion.type.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(promotion)}
              className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
              title="Edit campaign"
              aria-label="Edit campaign"
            >
              <Edit2 size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="px-5 pt-3 pb-2 border-b border-pos-border bg-pos-surface flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-pos-surface-subtle p-1 rounded-lg border border-pos-border text-xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('rules')}
              className={cn(
                'px-3 py-1 rounded-md font-semibold transition-all',
                activeSubTab === 'rules'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              Campaign Rules
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('usages')}
              className={cn(
                'px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1',
                activeSubTab === 'usages'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              <span>Usages</span>
              <Badge
                variant="default"
                size="sm"
                className="text-[9px] py-0 px-1 font-mono"
              >
                {promotion._count?.usages || promotion.currentUsageCount || usages.length}
              </Badge>
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => toggleMutation.mutate(promotion.id)}
            disabled={toggleMutation.isPending}
            className="text-xs font-semibold flex items-center gap-1"
          >
            <Power size={12} />
            <span>{promotion.isActive ? 'Deactivate' : 'Activate'}</span>
          </Button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
          {activeSubTab === 'rules' && (
            <>
              {/* Promo Code & Discount Hero Banner */}
              <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary">
                    Discount Formula
                  </span>
                  {promotion.isAutoApply && (
                    <Badge
                      variant="info"
                      size="sm"
                      className="text-[9px] flex items-center gap-1"
                    >
                      <Sparkles size={10} /> Auto-Applies
                    </Badge>
                  )}
                </div>

                <div className="text-xl font-bold font-mono text-pos-primary">
                  {formatDiscountFormula()}
                </div>

                {promotion.code ? (
                  <div className="pt-2 border-t border-pos-border flex items-center justify-between">
                    <span className="text-pos-text-muted text-[11px]">Coupon Code:</span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 rounded-md bg-pos-surface border border-pos-border font-mono font-bold text-pos-text hover:border-pos-primary flex items-center gap-1.5 transition-colors text-xs shadow-xs"
                    >
                      <span>{promotion.code}</span>
                      {copiedCode ? (
                        <Check size={12} className="text-pos-success" />
                      ) : (
                        <Copy size={12} className="text-pos-text-muted" />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-pos-text-muted pt-1">
                    No promo code required (Automatic rule)
                  </div>
                )}
              </div>

              {/* Description */}
              {promotion.description && (
                <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border space-y-1 shadow-xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary block">
                    Description & Terms
                  </span>
                  <p className="font-medium text-pos-text">{promotion.description}</p>
                </div>
              )}

              {/* Scope & Target Items */}
              <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border space-y-2 shadow-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary block flex items-center gap-1">
                  <Layers size={12} /> Target Scope: {promotion.targetType}
                </span>

                {promotion.targetType === 'ORDER' && (
                  <p className="text-pos-text font-medium">
                    Applies to the entire cart subtotal.
                  </p>
                )}

                {promotion.targetType === 'ITEM' && promotion.menuItems && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-pos-text-muted block">
                      Target Menu Items ({promotion.menuItems.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {promotion.menuItems.map(it => (
                        <Badge
                          key={it.id}
                          variant="default"
                          size="sm"
                          className="text-[10px]"
                        >
                          {it.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {promotion.targetType === 'CATEGORY' && promotion.categories && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-pos-text-muted block">
                      Target Categories ({promotion.categories.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {promotion.categories.map(c => (
                        <Badge
                          key={c.id}
                          variant="default"
                          size="sm"
                          className="text-[10px]"
                        >
                          {c.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Channels & Order Constraints */}
              <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary block">
                  Eligibility & Constraints
                </span>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-pos-text-muted block">Order Channels:</span>
                    <span className="font-bold text-pos-text">
                      {promotion.orderTypes && promotion.orderTypes.length > 0
                        ? promotion.orderTypes.join(', ')
                        : 'All Channels'}
                    </span>
                  </div>

                  <div>
                    <span className="text-pos-text-muted block">Min Order Amount:</span>
                    <span className="font-bold text-pos-text font-mono">
                      {promotion.minOrderAmount
                        ? formatPrice(promotion.minOrderAmount)
                        : 'None'}
                    </span>
                  </div>

                  <div>
                    <span className="text-pos-text-muted block">Stackable:</span>
                    <span className="font-bold text-pos-text">
                      {promotion.isStackable ? 'Yes (Combinable)' : 'No'}
                    </span>
                  </div>

                  <div>
                    <span className="text-pos-text-muted block">Priority:</span>
                    <span className="font-mono font-bold text-pos-text">
                      Level {promotion.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedule & Happy Hour Window */}
              <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border space-y-2 shadow-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary block flex items-center gap-1">
                  <Calendar size={12} /> Campaign Schedule
                </span>

                <div className="space-y-1.5 text-[11px]">
                  {(promotion.startDate || promotion.endDate) && (
                    <div className="flex items-center justify-between">
                      <span className="text-pos-text-muted">Date Window:</span>
                      <span className="font-mono font-bold text-pos-text">
                        {promotion.startDate
                          ? new Date(promotion.startDate).toLocaleDateString()
                          : 'Any'}{' '}
                        →{' '}
                        {promotion.endDate
                          ? new Date(promotion.endDate).toLocaleDateString()
                          : 'Indefinite'}
                      </span>
                    </div>
                  )}

                  {(promotion.startTime || promotion.endTime) && (
                    <div className="flex items-center justify-between">
                      <span className="text-pos-text-muted flex items-center gap-1">
                        <Clock size={11} /> Happy Hour:
                      </span>
                      <span className="font-mono font-bold text-pos-primary">
                        {promotion.startTime || '00:00'} - {promotion.endTime || '23:59'}
                      </span>
                    </div>
                  )}

                  {promotion.daysOfWeek && promotion.daysOfWeek.length > 0 && (
                    <div className="flex items-center justify-between pt-1 border-t border-pos-border">
                      <span className="text-pos-text-muted">Active Days:</span>
                      <div className="flex gap-1">
                        {promotion.daysOfWeek.map(d => (
                          <span
                            key={d}
                            className="px-1.5 py-0.5 rounded bg-pos-surface-subtle border border-pos-border font-bold text-[10px]"
                          >
                            {DAY_NAMES[d]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Redemptions & Frequency Limits */}
              <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary block">
                  Usage Statistics & Limits
                </span>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-pos-text-muted">Total Redemptions:</span>
                  <span className="font-mono font-bold text-pos-text">
                    {promotion.currentUsageCount || 0} /{' '}
                    {promotion.usageLimit ? promotion.usageLimit : '∞ Unlimited'}
                  </span>
                </div>

                {promotion.usageLimit && (
                  <div className="h-2 w-full bg-pos-surface rounded-full overflow-hidden border border-pos-border">
                    <div
                      className="h-full bg-pos-primary transition-all rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((promotion.currentUsageCount || 0) / promotion.usageLimit) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {activeSubTab === 'usages' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-pos-text">
                  Redemption History ({usages.length})
                </span>
                <button
                  type="button"
                  onClick={() => refetchUsages()}
                  className="p-1 rounded-lg text-pos-text-muted hover:text-pos-text"
                  aria-label="Refresh usages"
                >
                  <RotateCw size={13} />
                </button>
              </div>

              {isUsagesLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2 text-pos-text-muted text-xs">
                  <Spinner size="md" />
                  <span>Loading usage log...</span>
                </div>
              ) : usages.length === 0 ? (
                <div className="py-16 text-center text-pos-text-muted text-xs">
                  No redemptions logged yet for this campaign.
                </div>
              ) : (
                <div className="space-y-2">
                  {usages.map(u => (
                    <div
                      key={u.id}
                      className="p-3 rounded-lg bg-pos-surface border border-pos-border space-y-1 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-pos-text">
                          Order #{u.order?.orderCode || u.orderId.slice(0, 8)}
                        </span>
                        <span className="font-mono font-bold text-pos-danger">
                          -{formatPrice(u.discountAmount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-pos-text-muted">
                        <span>{u.customer ? u.customer.name : 'Walk-in Guest'}</span>
                        <span className="font-mono">
                          {new Date(u.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pos-border bg-pos-surface flex items-center justify-between shrink-0">
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(promotion)}
            className="text-xs font-semibold flex items-center gap-1 shadow-xs"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </Button>

          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
