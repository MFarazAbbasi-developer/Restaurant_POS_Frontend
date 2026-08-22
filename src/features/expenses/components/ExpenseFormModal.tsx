import React, { useState } from 'react';
import {
  ExpenseRecord,
  ExpenseCategoryRecord,
  ExpensePaymentMethod,
  PurchasingSupplierRecord,
} from '@/types';
import {
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
} from '../hooks/useExpensesData';
import { useCurrentShiftQuery } from '@/features/shifts/hooks/useShiftsData';
import { Button } from '@/components/ui/Button';
import {
  X,
  Receipt,
  Tag,
  CreditCard,
  Building2,
  AlertCircle,
  Hash,
  Link2,
} from 'lucide-react';

interface ExpenseFormModalProps {
  expense?: ExpenseRecord | null;
  categories: ExpenseCategoryRecord[];
  suppliers: PurchasingSupplierRecord[];
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  expense,
  categories,
  suppliers,
  currency = 'USD',
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(expense);
  const createMutation = useCreateExpenseMutation();
  const updateMutation = useUpdateExpenseMutation();

  const { data: currentShift } = useCurrentShiftQuery();

  const [categoryId, setCategoryId] = useState<string>(
    expense?.categoryId || categories[0]?.id || ''
  );
  const [amount, setAmount] = useState<string>(expense ? expense.amount.toString() : '');
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>(
    expense?.paymentMethod || 'CASH'
  );
  const [description, setDescription] = useState<string>(expense?.description || '');
  const [linkShift, setLinkShift] = useState<boolean>(
    expense ? Boolean(expense.shiftId) : Boolean(currentShift && paymentMethod === 'CASH')
  );
  const [supplierId, setSupplierId] = useState<string>(expense?.supplierId || '');
  const [reference, setReference] = useState<string>(expense?.reference || '');
  const [notes, setNotes] = useState<string>(expense?.notes || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Expense description is required.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!categoryId) {
      setErrorMessage('Please select an expense category.');
      return;
    }

    setErrorMessage(null);

    try {
      if (isEditing && expense) {
        await updateMutation.mutateAsync({
          id: expense.id,
          payload: {
            categoryId,
            description: description.trim(),
            reference: reference.trim() || null,
            notes: notes.trim() || null,
          },
        });
      } else {
        await createMutation.mutateAsync({
          categoryId,
          amount: parsedAmount,
          paymentMethod,
          description: description.trim(),
          shiftId: linkShift && currentShift ? currentShift.id : undefined,
          supplierId: supplierId || undefined,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to record expense';
      setErrorMessage(msg);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <Receipt size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                {isEditing
                  ? `Edit Expense #${expense?.expenseNumber}`
                  : 'Record Operational Expense'}
              </h3>
              <p className="text-xs text-pos-text-muted">
                {isEditing
                  ? 'Update category, voucher reference, or notes'
                  : 'Log store expenditure, petty cash pay-out, or vendor disbursement'}
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

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar"
        >
          {errorMessage && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Amount & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Amount ({currency}) <span className="text-pos-danger">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-pos-text-muted text-xs">
                  {currency}
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  disabled={isEditing}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-11 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary disabled:opacity-60 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Expense Category <span className="text-pos-danger">*</span>
              </label>
              <div className="relative">
                <Tag
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted pointer-events-none"
                />
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Expense Description / Purpose <span className="text-pos-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Milk & Dairy emergency restock, Cleaning Supplies"
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
            />
          </div>

          {/* Payment Method & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Payment Method
              </label>
              <div className="relative">
                <CreditCard
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted pointer-events-none"
                />
                <select
                  disabled={isEditing}
                  value={paymentMethod}
                  onChange={e => {
                    const method = e.target.value as ExpensePaymentMethod;
                    setPaymentMethod(method);
                    if (method === 'CASH' && currentShift) {
                      setLinkShift(true);
                    }
                  }}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium disabled:opacity-60 shadow-xs"
                >
                  <option value="CASH">Cash Drawer / Petty Cash</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  <option value="DIGITAL_WALLET">
                    Digital Wallet (Easypaisa/JazzCash)
                  </option>
                  <option value="OTHER">Other Payment Method</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Vendor / Supplier (Optional)
              </label>
              <div className="relative">
                <Building2
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted pointer-events-none"
                />
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
                >
                  <option value="">-- Direct / Walk-in Purchase --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Shift Drawer Linkage Banner */}
          {!isEditing && currentShift && paymentMethod === 'CASH' && (
            <label className="flex items-start gap-2.5 p-3 rounded-lg bg-pos-primary-soft/40 border border-pos-primary/30 cursor-pointer select-none text-xs">
              <input
                type="checkbox"
                checked={linkShift}
                onChange={e => setLinkShift(e.target.checked)}
                className="h-4 w-4 rounded accent-pos-primary mt-0.5"
              />
              <div>
                <span className="font-bold text-pos-text block flex items-center gap-1">
                  <Link2 size={13} className="text-pos-primary" />
                  Deduct from Active Cashier Shift ({currentShift.registerName})
                </span>
                <span className="text-[11px] text-pos-text-muted">
                  Automatically logs a Petty Cash Pay-Out and adjusts expected cash at
                  shift close.
                </span>
              </div>
            </label>
          )}

          {/* Voucher Reference & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Invoice / Voucher Ref #
              </label>
              <div className="relative">
                <Hash
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="e.g. VOUCH-1082"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs font-mono focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Internal Remarks / Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Approved by Manager on duty"
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
              />
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
              disabled={!description.trim() || !amount}
              className="font-bold shadow-xs"
            >
              {isEditing ? 'Save Changes' : 'Record Expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
