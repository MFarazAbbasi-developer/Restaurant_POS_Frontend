import React, { useState } from 'react';
import { MenuItemRecord, ModifierGroupWithCount } from '@/types';
import {
  useModifierGroupsQuery,
  useLinkModifierGroupMutation,
  useUnlinkModifierGroupMutation,
} from '../hooks/useMenuData';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, SlidersHorizontal, Plus, Trash2, AlertCircle, Check } from 'lucide-react';

interface ItemModifiersModalProps {
  item: MenuItemRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export const ItemModifiersModal: React.FC<ItemModifiersModalProps> = ({
  item,
  onClose,
  onSuccess,
}) => {
  const { data: allGroups } = useModifierGroupsQuery();
  const linkMutation = useLinkModifierGroupMutation();
  const unlinkMutation = useUnlinkModifierGroupMutation();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isRequired, setIsRequired] = useState<boolean>(false);
  const [minSelections, setMinSelections] = useState<string>('');
  const [maxSelections, setMaxSelections] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const linkedGroupIds = new Set(
    item.modifierGroups?.map(l => l.modifierGroupId || l.modifierGroup?.id)
  );

  const availableToLink = allGroups?.filter(g => !linkedGroupIds.has(g.id)) || [];

  const handleLinkGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) {
      setErrorMessage('Please select a modifier group to link.');
      return;
    }

    const min = minSelections.trim() ? parseInt(minSelections, 10) : null;
    const max = maxSelections.trim() ? parseInt(maxSelections, 10) : null;

    if (min !== null && (isNaN(min) || min < 0)) {
      setErrorMessage('Min selections must be a non-negative integer.');
      return;
    }
    if (max !== null && (isNaN(max) || max < 1)) {
      setErrorMessage('Max selections must be at least 1.');
      return;
    }
    if (min !== null && max !== null && min > max) {
      setErrorMessage('Min selections cannot exceed max selections.');
      return;
    }

    setErrorMessage(null);

    try {
      await linkMutation.mutateAsync({
        itemId: item.id,
        payload: {
          modifierGroupId: selectedGroupId,
          isRequired,
          minSelections: min,
          maxSelections: max,
          sortOrder: item.modifierGroups?.length || 0,
        },
      });
      setSelectedGroupId('');
      setIsRequired(false);
      setMinSelections('');
      setMaxSelections('');
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to link modifier group';
      setErrorMessage(msg);
    }
  };

  const handleUnlinkGroup = async (groupId: string) => {
    try {
      await unlinkMutation.mutateAsync({
        itemId: item.id,
        groupId,
      });
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to unlink modifier group';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                Linked Modifier Groups
              </h3>
              <p className="text-xs text-pos-text-muted">
                {item.name} (#{item.itemCode})
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Link Modifier Group Form */}
          {availableToLink.length > 0 ? (
            <form
              onSubmit={handleLinkGroup}
              className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-3"
            >
              <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                <Plus size={14} className="text-pos-primary" />
                <span>Link Modifier Group to Item</span>
              </h4>

              <div>
                <label className="block text-[11px] font-semibold text-pos-text-secondary mb-1">
                  Select Modifier Group
                </label>
                <select
                  value={selectedGroupId}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
                >
                  <option value="">-- Choose a modifier group --</option>
                  {availableToLink.map((g: ModifierGroupWithCount) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.selectionType} • {g.modifiers?.length || 0} options)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center pt-1">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-pos-surface border border-pos-border text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={e => setIsRequired(e.target.checked)}
                    className="h-4 w-4 rounded accent-pos-primary"
                  />
                  <span className="font-semibold text-pos-text">Required</span>
                </label>

                <div>
                  <input
                    type="number"
                    min="0"
                    value={minSelections}
                    onChange={e => setMinSelections(e.target.value)}
                    placeholder="Min picks (opt)"
                    className="w-full px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-mono shadow-xs"
                  />
                </div>

                <div>
                  <input
                    type="number"
                    min="1"
                    value={maxSelections}
                    onChange={e => setMaxSelections(e.target.value)}
                    placeholder="Max picks (opt)"
                    className="w-full px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-mono shadow-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={linkMutation.isPending}
                  disabled={!selectedGroupId}
                  className="font-bold text-xs shadow-xs"
                >
                  <Check size={14} className="mr-1" />
                  Link Group
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-4 text-center rounded-lg bg-pos-surface-subtle border border-pos-border text-xs text-pos-text-muted">
              All existing modifier groups are already linked to this item, or none are
              configured.
            </div>
          )}

          {/* Currently Linked Groups */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-2.5 flex items-center justify-between">
              <span>Attached Modifier Groups</span>
              <span className="text-[11px] text-pos-text-muted font-normal">
                {item.modifierGroups?.length || 0} groups
              </span>
            </h4>

            {item.modifierGroups && item.modifierGroups.length > 0 ? (
              <div className="space-y-2">
                {item.modifierGroups.map(link => {
                  const group = link.modifierGroup;
                  return (
                    <div
                      key={link.id}
                      className="p-3 rounded-lg bg-pos-surface border border-pos-border flex items-center justify-between text-xs shadow-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-pos-text">
                            {group?.name || 'Modifier Group'}
                          </span>
                          <Badge
                            variant={link.isRequired ? 'danger' : 'default'}
                            size="sm"
                            className="text-[10px]"
                          >
                            {link.isRequired ? 'Required' : 'Optional'}
                          </Badge>
                        </div>

                        <span className="text-[11px] text-pos-text-muted mt-0.5 block">
                          Type: {group?.selectionType || 'SINGLE'} •{' '}
                          {group?.modifiers?.length || 0} choices
                          {link.minSelections !== null && link.maxSelections !== null && (
                            <>
                              {' '}
                              • Picks: {link.minSelections} - {link.maxSelections}
                            </>
                          )}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUnlinkGroup(link.modifierGroupId)}
                        disabled={unlinkMutation.isPending}
                        className="p-1.5 rounded-md text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger-soft transition-colors"
                        aria-label="Unlink modifier group"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-pos-surface-subtle border border-pos-border rounded-lg text-xs text-pos-text-muted">
                No modifier groups linked to this menu item.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pos-border bg-pos-surface flex items-center justify-end shrink-0">
          <Button variant="secondary" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
