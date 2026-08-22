import React, { useState } from 'react';
import { PosMenuItem, PosItemVariant, PosModifier, CartModifierSelection } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ItemCustomizerModalProps {
  item: PosMenuItem;
  currency?: string;
  onClose: () => void;
  onAddToCart: (configuredItem: {
    menuItemId: string;
    itemCode: string;
    itemName: string;
    urduName?: string | null;
    variantId?: string;
    variantName?: string;
    unitPrice: number;
    modifiersPrice: number;
    quantity: number;
    selectedModifiers: CartModifierSelection[];
    specialInstructions?: string;
  }) => void;
}

export const ItemCustomizerModal: React.FC<ItemCustomizerModalProps> = ({
  item,
  currency = 'USD',
  onClose,
  onAddToCart,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<PosItemVariant | null>(
    item.variants.length > 0 ? item.variants[0] : null
  );

  // Map of modifierGroupId -> Array of selected PosModifier
  const [selectedModifiersMap, setSelectedModifiersMap] = useState<
    Record<string, PosModifier[]>
  >(() => {
    const initial: Record<string, PosModifier[]> = {};
    item.modifierGroups.forEach(group => {
      // If group is required and single selection, pre-select first modifier
      if (
        group.isRequired &&
        group.selectionType === 'SINGLE' &&
        group.modifiers.length > 0
      ) {
        initial[group.id] = [group.modifiers[0]];
      } else {
        initial[group.id] = [];
      }
    });
    return initial;
  });

  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleToggleModifier = (
    group: (typeof item.modifierGroups)[0],
    modifier: PosModifier
  ) => {
    const current = selectedModifiersMap[group.id] || [];

    if (group.selectionType === 'SINGLE') {
      setSelectedModifiersMap(prev => ({
        ...prev,
        [group.id]: [modifier],
      }));
    } else {
      // MULTIPLE
      const exists = current.some(m => m.id === modifier.id);
      if (exists) {
        setSelectedModifiersMap(prev => ({
          ...prev,
          [group.id]: current.filter(m => m.id !== modifier.id),
        }));
      } else {
        if (current.length >= group.maxSelections) {
          setValidationError(
            `Maximum ${group.maxSelections} selection(s) allowed for "${group.name}".`
          );
          return;
        }
        setValidationError(null);
        setSelectedModifiersMap(prev => ({
          ...prev,
          [group.id]: [...current, modifier],
        }));
      }
    }
  };

  // Compute calculated pricing
  const basePrice = selectedVariant ? selectedVariant.price : item.basePrice;
  const modifiersPriceTotal = Object.values(selectedModifiersMap)
    .flat()
    .reduce((sum, mod) => sum + mod.priceAdjustment, 0);

  const singleItemTotal = basePrice + modifiersPriceTotal;
  const lineGrandTotal = singleItemTotal * quantity;

  const handleConfirm = () => {
    // Validate required modifier groups
    for (const group of item.modifierGroups) {
      const selected = selectedModifiersMap[group.id] || [];
      if (group.isRequired && selected.length < (group.minSelections || 1)) {
        setValidationError(
          `Please select at least ${group.minSelections || 1} option(s) for "${group.name}".`
        );
        return;
      }
    }

    const flatModifiers: CartModifierSelection[] = Object.entries(
      selectedModifiersMap
    ).flatMap(([groupId, mods]) =>
      mods.map(m => ({
        modifierId: m.id,
        modifierGroupId: groupId,
        name: m.name,
        priceAdjustment: m.priceAdjustment,
      }))
    );

    onAddToCart({
      menuItemId: item.id,
      itemCode: item.itemCode,
      itemName: item.name,
      urduName: item.urduName,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      unitPrice: basePrice,
      modifiersPrice: modifiersPriceTotal,
      quantity,
      selectedModifiers: flatModifiers,
      specialInstructions: instructions.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-xl bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-start justify-between bg-pos-surface shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-pos-primary font-bold bg-pos-primary-soft px-2 py-0.5 rounded">
                #{item.itemCode}
              </span>
              <h3 className="text-base font-semibold text-pos-text">{item.name}</h3>
            </div>
            {item.urduName && (
              <p className="text-xs text-pos-text-muted mt-0.5 font-medium">
                {item.urduName}
              </p>
            )}
            {item.description && (
              <p className="text-xs text-pos-text-muted mt-1 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customizer"
            className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
          {validationError && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span className="font-medium">{validationError}</span>
            </div>
          )}

          {/* 1. Portion Variants (if any) */}
          {item.variants.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary">
                  Choose Portion / Size <span className="text-pos-danger">*</span>
                </label>
                <Badge variant="info">Required</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {item.variants.map(variant => {
                  const isSelected = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-colors relative flex flex-col justify-between min-h-[60px] shadow-xs',
                        isSelected
                          ? 'border-pos-primary bg-pos-primary-soft/40 ring-1 ring-pos-primary'
                          : 'border-pos-border bg-pos-surface text-pos-text-secondary hover:border-pos-border-strong hover:bg-pos-surface-subtle hover:text-pos-text'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-pos-text">
                          {variant.name}
                        </span>
                        {isSelected && (
                          <span className="h-4 w-4 rounded-full bg-pos-primary text-white flex items-center justify-center">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-pos-primary font-mono mt-1">
                        {formatPrice(variant.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Modifier Groups */}
          {item.modifierGroups.map(group => {
            const selectedInGroup = selectedModifiersMap[group.id] || [];
            return (
              <div key={group.id} className="pt-2 border-t border-pos-border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary">
                      {group.name}
                    </label>
                    <p className="text-xs text-pos-text-muted">
                      {group.selectionType === 'SINGLE'
                        ? 'Select 1 option'
                        : `Select up to ${group.maxSelections} options`}
                    </p>
                  </div>
                  {group.isRequired && <Badge variant="warning">Required</Badge>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.modifiers.map(modifier => {
                    const isSelected = selectedInGroup.some(m => m.id === modifier.id);
                    return (
                      <button
                        key={modifier.id}
                        type="button"
                        onClick={() => handleToggleModifier(group, modifier)}
                        className={cn(
                          'p-2.5 rounded-lg border text-left transition-colors flex items-center justify-between min-h-[44px] shadow-xs',
                          isSelected
                            ? 'border-pos-primary bg-pos-primary-soft/40 ring-1 ring-pos-primary'
                            : 'border-pos-border bg-pos-surface text-pos-text-secondary hover:border-pos-border-strong hover:bg-pos-surface-subtle hover:text-pos-text'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              'h-4 w-4 rounded flex items-center justify-center shrink-0 transition-colors',
                              group.selectionType === 'SINGLE' ? 'rounded-full' : '',
                              isSelected
                                ? 'bg-pos-primary text-white'
                                : 'border border-pos-border'
                            )}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                          <span className="text-xs font-medium text-pos-text truncate">
                            {modifier.name}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-pos-text-muted shrink-0 ml-2 font-mono">
                          {modifier.priceAdjustment > 0
                            ? `+${formatPrice(modifier.priceAdjustment)}`
                            : 'Free'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 3. Special Instructions */}
          <div className="pt-2 border-t border-pos-border">
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Special Kitchen Instructions
            </label>
            <input
              type="text"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. Extra spicy, no onions, sauce on the side..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-pos-surface border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium"
            />
          </div>
        </div>

        {/* Modal Footer: Quantity Stepper & Add to Order Action */}
        <div className="p-4 sm:p-5 border-t border-pos-border bg-pos-surface flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          {/* Quantity Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs font-semibold text-pos-text-muted uppercase tracking-wider">
              Quantity:
            </span>
            <div className="flex items-center bg-pos-surface-subtle border border-pos-border rounded-lg p-1">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="h-8 w-8 rounded-md hover:bg-pos-surface text-pos-text-muted hover:text-pos-text flex items-center justify-center transition-colors active:scale-95"
              >
                <Minus size={15} />
              </button>
              <span className="w-10 text-center font-bold text-sm text-pos-text font-mono">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                aria-label="Increase quantity"
                className="h-8 w-8 rounded-md hover:bg-pos-surface text-pos-text-muted hover:text-pos-text flex items-center justify-center transition-colors active:scale-95"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* Confirm & Add Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleConfirm}
            className="w-full sm:w-auto font-semibold flex items-center justify-center gap-2 min-w-[200px] shadow-xs"
          >
            <span>Add to Order</span>
            <span className="h-4 w-px bg-white/30 mx-1" />
            <span className="font-mono">{formatPrice(lineGrandTotal)}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
