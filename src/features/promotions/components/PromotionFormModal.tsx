import React, { useState } from 'react';
import {
  PromotionRecord,
  PromotionType,
  PromotionTargetType,
  PromotionOrderType,
} from '@/types';
import {
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
} from '../hooks/usePromotionData';
import { useCategoriesQuery, useMenuItemsQuery } from '@/features/menu/hooks/useMenuData';
import { Button } from '@/components/ui/Button';
import {
  X,
  Gift,
  Calendar,
  AlertCircle,
  Hash,
  Percent,
  Layers,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface PromotionFormModalProps {
  promotion?: PromotionRecord | null;
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DAYS_OF_WEEK = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

export const PromotionFormModal: React.FC<PromotionFormModalProps> = ({
  promotion,
  currency = 'USD',
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(promotion);
  const createMutation = useCreatePromotionMutation();
  const updateMutation = useUpdatePromotionMutation();

  const { data: categories = [] } = useCategoriesQuery();
  const { data: menuItemsData } = useMenuItemsQuery({ limit: 200 });
  const menuItems = menuItemsData?.items || [];

  // Form states
  const [name, setName] = useState<string>(promotion?.name || '');
  const [code, setCode] = useState<string>(promotion?.code || '');
  const [description, setDescription] = useState<string>(promotion?.description || '');
  const [type, setType] = useState<PromotionType>(promotion?.type || 'PERCENTAGE');
  const [targetType, setTargetType] = useState<PromotionTargetType>(
    promotion?.targetType || 'ORDER'
  );
  const [discountValue, setDiscountValue] = useState<string>(
    promotion ? promotion.discountValue.toString() : '10'
  );
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>(
    promotion?.maxDiscountAmount ? promotion.maxDiscountAmount.toString() : ''
  );
  const [minOrderAmount, setMinOrderAmount] = useState<string>(
    promotion?.minOrderAmount ? promotion.minOrderAmount.toString() : ''
  );
  const [buyQuantity, setBuyQuantity] = useState<string>(
    promotion?.buyQuantity ? promotion.buyQuantity.toString() : '1'
  );
  const [getQuantity, setGetQuantity] = useState<string>(
    promotion?.getQuantity ? promotion.getQuantity.toString() : '1'
  );
  const [getDiscountPercentage, setGetDiscountPercentage] = useState<string>(
    promotion?.getDiscountPercentage ? promotion.getDiscountPercentage.toString() : '100'
  );

  const [selectedMenuItemIds, setSelectedMenuItemIds] = useState<string[]>(
    promotion?.menuItems ? promotion.menuItems.map(m => m.id) : []
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    promotion?.categories ? promotion.categories.map(c => c.id) : []
  );

  const [selectedOrderTypes, setSelectedOrderTypes] = useState<PromotionOrderType[]>(
    promotion?.orderTypes || ['DINE_IN', 'TAKEAWAY', 'DELIVERY']
  );

  const [selectedDays, setSelectedDays] = useState<number[]>(
    promotion?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]
  );

  const [startDate, setStartDate] = useState<string>(
    promotion?.startDate ? promotion.startDate.split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState<string>(
    promotion?.endDate ? promotion.endDate.split('T')[0] : ''
  );
  const [startTime, setStartTime] = useState<string>(promotion?.startTime || '');
  const [endTime, setEndTime] = useState<string>(promotion?.endTime || '');

  const [isActive, setIsActive] = useState<boolean>(
    promotion ? promotion.isActive : true
  );
  const [isAutoApply, setIsAutoApply] = useState<boolean>(
    promotion ? promotion.isAutoApply : false
  );
  const [isStackable, setIsStackable] = useState<boolean>(
    promotion ? promotion.isStackable : false
  );
  const [usageLimit, setUsageLimit] = useState<string>(
    promotion?.usageLimit ? promotion.usageLimit.toString() : ''
  );
  const [perCustomerLimit, setPerCustomerLimit] = useState<string>(
    promotion?.perCustomerLimit ? promotion.perCustomerLimit.toString() : ''
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleOrderType = (ot: PromotionOrderType) => {
    setSelectedOrderTypes(prev =>
      prev.includes(ot) ? prev.filter(t => t !== ot) : [...prev, ot]
    );
  };

  const toggleMenuItem = (id: string) => {
    setSelectedMenuItemIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Promotion name is required.');
      return;
    }

    if (type === 'PERCENTAGE' && parseFloat(discountValue) > 100) {
      setErrorMessage('Percentage discount cannot exceed 100%.');
      return;
    }

    if (targetType === 'ITEM' && selectedMenuItemIds.length === 0) {
      setErrorMessage('Please select at least one menu item for item-targeted discount.');
      return;
    }

    if (targetType === 'CATEGORY' && selectedCategoryIds.length === 0) {
      setErrorMessage(
        'Please select at least one category for category-targeted discount.'
      );
      return;
    }

    setErrorMessage(null);

    const payload = {
      name: name.trim(),
      code: code.trim() ? code.trim().toUpperCase() : null,
      description: description.trim() || null,
      type,
      targetType,
      discountValue: parseFloat(discountValue) || 0,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
      buyQuantity: type === 'BUY_X_GET_Y' ? parseInt(buyQuantity, 10) : null,
      getQuantity: type === 'BUY_X_GET_Y' ? parseInt(getQuantity, 10) : null,
      getDiscountPercentage:
        type === 'BUY_X_GET_Y' ? parseFloat(getDiscountPercentage) : null,
      orderTypes: selectedOrderTypes.length > 0 ? selectedOrderTypes : null,
      daysOfWeek: selectedDays.length > 0 ? selectedDays : null,
      startDate: startDate || null,
      endDate: endDate || null,
      startTime: startTime || null,
      endTime: endTime || null,
      isActive,
      isAutoApply,
      isStackable,
      usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
      perCustomerLimit: perCustomerLimit ? parseInt(perCustomerLimit, 10) : null,
      menuItemIds: targetType === 'ITEM' ? selectedMenuItemIds : [],
      categoryIds: targetType === 'CATEGORY' ? selectedCategoryIds : [],
    };

    try {
      if (isEditing && promotion) {
        await updateMutation.mutateAsync({
          id: promotion.id,
          payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to save promotion campaign';
      setErrorMessage(msg);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-2xl bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <Gift size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                {isEditing
                  ? `Edit Campaign: ${promotion?.name}`
                  : 'New Discount & Promotion Campaign'}
              </h3>
              <p className="text-xs text-pos-text-muted">
                Configure discount formula, eligibility constraints, coupon code, and
                happy hours
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs"
        >
          {errorMessage && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Campaign Name & Promo Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Campaign Name <span className="text-pos-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Weekend Family Feast 20% Off"
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-semibold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Coupon / Promo Code (Optional)
              </label>
              <div className="relative">
                <Hash
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER20"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Campaign Description / Terms
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. 20% off on all Dine-In orders during weekend lunch hours"
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
            />
          </div>

          {/* Discount Type & Target Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5 flex items-center gap-1">
                <Percent size={13} className="text-pos-primary" />
                <span>Discount Type</span>
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as PromotionType)}
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-bold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
              >
                <option value="PERCENTAGE">Percentage Discount (%)</option>
                <option value="FIXED_AMOUNT">Fixed Flat Amount ({currency})</option>
                <option value="BUY_X_GET_Y">Buy X Get Y (BOGO / Reward)</option>
                <option value="FREE_ITEM">Free Item Reward</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5 flex items-center gap-1">
                <Layers size={13} className="text-pos-primary" />
                <span>Target Scope</span>
              </label>
              <select
                value={targetType}
                onChange={e => setTargetType(e.target.value as PromotionTargetType)}
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-bold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
              >
                <option value="ORDER">Entire Order Bill</option>
                <option value="CATEGORY">Specific Menu Categories</option>
                <option value="ITEM">Specific Menu Items</option>
              </select>
            </div>
          </div>

          {/* Discount Values based on Type */}
          {type === 'PERCENTAGE' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                  Discount Percentage (%) <span className="text-pos-danger">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  placeholder="20"
                  className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                  Max Cap ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={maxDiscountAmount}
                  onChange={e => setMaxDiscountAmount(e.target.value)}
                  placeholder="No Limit"
                  className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                  Min Order ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={minOrderAmount}
                  onChange={e => setMinOrderAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>
            </div>
          )}

          {type === 'FIXED_AMOUNT' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                  Flat Discount ({currency}) <span className="text-pos-danger">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  placeholder="10.00"
                  className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                  Min Order ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={minOrderAmount}
                  onChange={e => setMinOrderAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>
            </div>
          )}

          {type === 'BUY_X_GET_Y' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                  Buy Quantity (X) <span className="text-pos-danger">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={buyQuantity}
                  onChange={e => setBuyQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold shadow-xs"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                  Get Quantity (Y) <span className="text-pos-danger">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={getQuantity}
                  onChange={e => setGetQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold shadow-xs"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                  Reward Discount (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={getDiscountPercentage}
                  onChange={e => setGetDiscountPercentage(e.target.value)}
                  placeholder="100% (Free)"
                  className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold shadow-xs"
                />
              </div>
            </div>
          )}

          {/* Specific Item / Category Multi-Selection */}
          {targetType === 'ITEM' && (
            <div className="space-y-1.5 p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
              <span className="font-semibold uppercase tracking-wider text-pos-text-secondary block flex items-center justify-between">
                <span>
                  Select Target Menu Items ({selectedMenuItemIds.length} selected)
                </span>
                <span className="text-pos-danger text-[11px]">* Required</span>
              </span>
              <div className="max-h-36 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-1.5 pt-1">
                {menuItems.map(item => (
                  <label
                    key={item.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all',
                      selectedMenuItemIds.includes(item.id)
                        ? 'bg-pos-primary-soft border-pos-primary text-pos-text font-bold'
                        : 'bg-pos-surface border-pos-border text-pos-text-muted hover:text-pos-text'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMenuItemIds.includes(item.id)}
                      onChange={() => toggleMenuItem(item.id)}
                      className="h-3.5 w-3.5 rounded accent-pos-primary"
                    />
                    <span className="truncate">{item.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {targetType === 'CATEGORY' && (
            <div className="space-y-1.5 p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
              <span className="font-semibold uppercase tracking-wider text-pos-text-secondary block flex items-center justify-between">
                <span>
                  Select Target Categories ({selectedCategoryIds.length} selected)
                </span>
                <span className="text-pos-danger text-[11px]">* Required</span>
              </span>
              <div className="max-h-36 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-1.5 pt-1">
                {categories.map(cat => (
                  <label
                    key={cat.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all',
                      selectedCategoryIds.includes(cat.id)
                        ? 'bg-pos-primary-soft border-pos-primary text-pos-text font-bold'
                        : 'bg-pos-surface border-pos-border text-pos-text-muted hover:text-pos-text'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="h-3.5 w-3.5 rounded accent-pos-primary"
                    />
                    <span className="truncate">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Applicable Order Types */}
          <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-1.5">
            <span className="font-semibold uppercase tracking-wider text-pos-text-secondary block">
              Applicable Dining Channels
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as PromotionOrderType[]).map(ot => (
                <label
                  key={ot}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer select-none font-bold transition-all text-xs',
                    selectedOrderTypes.includes(ot)
                      ? 'bg-pos-primary-soft border-pos-primary text-pos-primary'
                      : 'bg-pos-surface border-pos-border text-pos-text-muted'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedOrderTypes.includes(ot)}
                    onChange={() => toggleOrderType(ot)}
                    className="h-3.5 w-3.5 rounded accent-pos-primary"
                  />
                  <span>{ot.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Schedule: Date Range, Happy Hours, Days */}
          <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-3">
            <span className="font-semibold uppercase tracking-wider text-pos-text-secondary block flex items-center gap-1">
              <Calendar size={13} className="text-pos-primary" />
              <span>Schedule & Happy Hour Window</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-pos-text-muted mb-1 font-medium">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-pos-text-muted mb-1 font-medium">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-pos-text-muted mb-1 font-medium">
                  Happy Hour Start
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-pos-text-muted mb-1 font-medium">
                  Happy Hour End
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text text-xs"
                />
              </div>
            </div>

            {/* Active Days */}
            <div>
              <label className="block text-[10px] text-pos-text-muted mb-1 font-medium">
                Active Days of the Week
              </label>
              <div className="flex items-center gap-1">
                {DAYS_OF_WEEK.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={cn(
                      'flex-1 py-1 rounded-md border font-semibold text-[11px] transition-all',
                      selectedDays.includes(d.id)
                        ? 'bg-pos-primary text-white border-pos-primary shadow-xs'
                        : 'bg-pos-surface text-pos-text-muted border-pos-border hover:text-pos-text'
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Campaign Flags & Usage Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-2">
              <span className="font-semibold uppercase tracking-wider text-pos-text-secondary block">
                Automation & Stackability
              </span>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAutoApply}
                  onChange={e => setIsAutoApply(e.target.checked)}
                  className="h-4 w-4 rounded accent-pos-primary"
                />
                <div>
                  <span className="font-bold text-pos-text block flex items-center gap-1">
                    <Sparkles size={12} className="text-pos-primary" />
                    Auto-Apply in Cart
                  </span>
                  <span className="text-[10px] text-pos-text-muted block">
                    Automatically discounts qualifying orders without code entry
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none pt-1 border-t border-pos-border">
                <input
                  type="checkbox"
                  checked={isStackable}
                  onChange={e => setIsStackable(e.target.checked)}
                  className="h-4 w-4 rounded accent-pos-primary"
                />
                <div>
                  <span className="font-bold text-pos-text block">
                    Stackable with Other Promos
                  </span>
                  <span className="text-[10px] text-pos-text-muted block">
                    Allow combining with loyalty rewards or extra discounts
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none pt-1 border-t border-pos-border">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded accent-pos-primary"
                />
                <span className="font-bold text-pos-text">Active Campaign</span>
              </label>
            </div>

            <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-2">
              <span className="font-semibold uppercase tracking-wider text-pos-text-secondary block">
                Redemption Frequency Limits
              </span>

              <div>
                <label className="block text-[10px] text-pos-text-muted mb-1 font-medium">
                  Global Total Usage Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={e => setUsageLimit(e.target.value)}
                  placeholder="Unlimited"
                  className="w-full px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text font-mono text-xs shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-pos-text-muted mb-1 font-medium">
                  Per-Customer Usage Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={perCustomerLimit}
                  onChange={e => setPerCustomerLimit(e.target.value)}
                  placeholder="Unlimited"
                  className="w-full px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text font-mono text-xs shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-pos-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isPending}
              disabled={!name.trim()}
              className="font-bold shadow-xs"
            >
              {isEditing ? 'Save Changes' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
