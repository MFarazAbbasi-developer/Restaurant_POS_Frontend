import React from 'react';
import { ExpenseRecord } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  X,
  Receipt,
  Tag,
  CreditCard,
  Building2,
  Calendar,
  User,
  Hash,
  FileText,
  AlertTriangle,
  Edit2,
  Ban,
  Link2,
} from 'lucide-react';
import { formatPrice as centralizedFormatPrice } from '@/utils/format';

interface ExpenseDetailsDrawerProps {
  expense: ExpenseRecord;
  currency?: string;
  onClose: () => void;
  onEdit: (expense: ExpenseRecord) => void;
  onVoid: (expense: ExpenseRecord) => void;
}

export const ExpenseDetailsDrawer: React.FC<ExpenseDetailsDrawerProps> = ({
  expense,
  currency = 'PKR',
  onClose,
  onEdit,
  onVoid,
}) => {
  const formatPrice = (val: number) => {
    return centralizedFormatPrice(val, currency);
  };

  const isVoided = expense.status === 'VOIDED';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 flex justify-end animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border-l border-pos-border shadow-modal flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <Receipt size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-pos-text font-mono">
                  #{expense.expenseNumber}
                </h3>
                <Badge variant={isVoided ? 'danger' : 'success'} size="sm">
                  {isVoided ? 'Voided' : 'Recorded'}
                </Badge>
              </div>
              <p className="text-xs text-pos-text-muted mt-0.5 font-medium">
                {expense.category.name} • {expense.paymentMethod}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!isVoided && (
              <button
                type="button"
                onClick={() => onEdit(expense)}
                className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
                title="Edit expense"
                aria-label="Edit expense"
              >
                <Edit2 size={16} />
              </button>
            )}
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* Amount Hero Tile */}
          <div className="p-4 rounded-lg bg-pos-surface-subtle border border-pos-border flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted block">
                Total Expense Amount
              </span>
              <span
                className={`text-2xl font-black font-mono mt-0.5 block ${
                  isVoided ? 'line-through text-pos-text-muted' : 'text-pos-primary'
                }`}
              >
                {formatPrice(expense.amount)}
              </span>
            </div>

            {!isVoided && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onVoid(expense)}
                className="text-xs font-semibold text-pos-danger hover:bg-pos-danger-soft flex items-center gap-1"
              >
                <Ban size={13} />
                <span>Void Expense</span>
              </Button>
            )}
          </div>

          {/* Description & Category */}
          <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border space-y-2 text-xs shadow-xs">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted block">
                Description / Purpose
              </span>
              <p className="font-bold text-pos-text mt-0.5 text-sm">
                {expense.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-pos-border">
              <div>
                <span className="text-[10px] text-pos-text-muted flex items-center gap-1">
                  <Tag size={11} /> Category
                </span>
                <span className="font-bold text-pos-text block mt-0.5">
                  {expense.category.name}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-pos-text-muted flex items-center gap-1">
                  <CreditCard size={11} /> Method
                </span>
                <span className="font-bold text-pos-text block mt-0.5">
                  {expense.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Shift Drawer Link */}
          {expense.shift && (
            <div className="p-3.5 rounded-lg bg-pos-primary-soft/30 border border-pos-primary/20 space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pos-primary flex items-center gap-1">
                <Link2 size={12} /> Cashier Shift Payout Linked
              </span>
              <p className="font-bold text-pos-text">
                Register: {expense.shift.registerName}
              </p>
              <span className="text-[11px] text-pos-text-muted">
                Status: {expense.shift.status} • Shift ID: {expense.shift.id.slice(0, 8)}
              </span>
            </div>
          )}

          {/* Vendor Details */}
          {expense.supplier && (
            <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border space-y-1 text-xs shadow-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted flex items-center gap-1">
                <Building2 size={12} /> Supplier Vendor
              </span>
              <span className="font-bold text-pos-text block">
                {expense.supplier.name}
              </span>
            </div>
          )}

          {/* Audit Details */}
          <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-2 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted block">
              Audit & Record Trail
            </span>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-pos-text">
                <span className="text-pos-text-muted flex items-center gap-1">
                  <Calendar size={12} /> Recorded Date
                </span>
                <span className="font-mono font-medium">
                  {new Date(expense.date).toLocaleString()}
                </span>
              </div>

              {expense.createdByUser && (
                <div className="flex items-center justify-between text-pos-text">
                  <span className="text-pos-text-muted flex items-center gap-1">
                    <User size={12} /> Recorded By
                  </span>
                  <span className="font-medium">
                    {expense.createdByUser.name} (@{expense.createdByUser.username})
                  </span>
                </div>
              )}

              {expense.reference && (
                <div className="flex items-center justify-between text-pos-text">
                  <span className="text-pos-text-muted flex items-center gap-1">
                    <Hash size={12} /> Reference #
                  </span>
                  <span className="font-mono font-bold text-pos-primary">
                    {expense.reference}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          {expense.notes && (
            <div className="p-3.5 rounded-lg bg-pos-surface border border-pos-border space-y-1 text-xs shadow-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted flex items-center gap-1">
                <FileText size={12} /> Remarks
              </span>
              <p className="text-pos-text font-medium">{expense.notes}</p>
            </div>
          )}

          {/* Voided Details */}
          {isVoided && (
            <div className="p-3.5 rounded-lg bg-pos-danger-soft border border-[#FECACA] space-y-1.5 text-xs">
              <span className="font-bold text-pos-danger flex items-center gap-1">
                <AlertTriangle size={13} /> Void Audit Information
              </span>
              <p className="text-pos-text">
                <strong>Reason:</strong> {expense.voidReason || 'No reason recorded'}
              </p>
              {expense.voidedByUser && (
                <span className="text-[11px] text-pos-text-muted block">
                  Voided by {expense.voidedByUser.name} on{' '}
                  {expense.voidedAt ? new Date(expense.voidedAt).toLocaleString() : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pos-border bg-pos-surface flex items-center justify-end shrink-0">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
