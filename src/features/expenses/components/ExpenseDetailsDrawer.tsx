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

interface ExpenseDetailsDrawerProps {
  expense: ExpenseRecord;
  currency?: string;
  onClose: () => void;
  onEdit: (expense: ExpenseRecord) => void;
  onVoid: (expense: ExpenseRecord) => void;
}

export const ExpenseDetailsDrawer: React.FC<ExpenseDetailsDrawerProps> = ({
  expense,
  currency = 'USD',
  onClose,
  onEdit,
  onVoid,
}) => {
  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const isVoided = expense.status === 'VOIDED';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-pos-surface border-l border-pos-border shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-accent/15 border border-pos-accent/30 text-pos-accent flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-pos-text font-mono">
                  #{expense.expenseNumber}
                </h3>
                <Badge variant={isVoided ? 'danger' : 'success'} className="text-[10px]">
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
                className="p-2 rounded-xl text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
                title="Edit expense"
                aria-label="Edit expense"
              >
                <Edit2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
              aria-label="Close drawer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Amount Hero Tile */}
          <div className="p-4 rounded-2xl bg-pos-bg border border-pos-border flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pos-text-muted block">
                Total Expense Amount
              </span>
              <span
                className={`text-2xl font-black font-mono mt-0.5 block ${
                  isVoided ? 'line-through text-pos-text-muted' : 'text-pos-accent'
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
                className="text-xs font-semibold text-pos-danger hover:bg-pos-danger/10 flex items-center gap-1"
              >
                <Ban size={13} />
                <span>Void Expense</span>
              </Button>
            )}
          </div>

          {/* Description & Category */}
          <div className="p-3.5 rounded-xl bg-pos-surface border border-pos-border space-y-2 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pos-text-muted block">
                Description / Purpose
              </span>
              <p className="font-bold text-pos-text mt-0.5 text-sm">
                {expense.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-pos-border/60">
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
            <div className="p-3.5 rounded-xl bg-pos-bg border border-pos-border space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pos-accent flex items-center gap-1">
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
            <div className="p-3.5 rounded-xl bg-pos-surface border border-pos-border space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pos-text-muted flex items-center gap-1">
                <Building2 size={12} /> Supplier Vendor
              </span>
              <span className="font-bold text-pos-text block">
                {expense.supplier.name}
              </span>
            </div>
          )}

          {/* Audit Details */}
          <div className="p-3.5 rounded-xl bg-pos-bg border border-pos-border space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pos-text-muted block">
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
                  <span className="font-mono font-bold text-pos-accent">
                    {expense.reference}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          {expense.notes && (
            <div className="p-3.5 rounded-xl bg-pos-surface border border-pos-border space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pos-text-muted flex items-center gap-1">
                <FileText size={12} /> Remarks
              </span>
              <p className="text-pos-text font-medium">{expense.notes}</p>
            </div>
          )}

          {/* Voided Details */}
          {isVoided && (
            <div className="p-3.5 rounded-xl bg-pos-danger/10 border border-pos-danger/30 space-y-1.5 text-xs">
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
        <div className="p-4 border-t border-pos-border bg-pos-header flex items-center justify-end shrink-0">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
