import React, { useState } from 'react';
import { PaymentRecord, PaymentMethod } from '@/types';
import { useRefundPaymentMutation } from '../hooks/useShiftsData';
import { usePermissions } from '@/core/auth/usePermissions';
import { Button } from '@/components/ui/Button';
import { X, RotateCcw, KeyRound, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/utils/format';

interface RefundModalProps {
  payment: PaymentRecord;
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  payment,
  currency = 'PKR',
  onClose,
  onSuccess,
}) => {
  const refundMutation = useRefundPaymentMutation();
  const { hasPermission } = usePermissions();
  const canRefundDirectly = hasPermission('payments.refund');

  const maxRefundable = Math.max(0, payment.amount - (payment.refundedAmount || 0));

  const [amount, setAmount] = useState<string>(maxRefundable.toString());
  const [reason, setReason] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>(
    payment.paymentMethod || 'CASH'
  );
  const [reference, setReference] = useState<string>('');
  const [managerPin, setManagerPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const refundVal = parseFloat(amount);
    if (isNaN(refundVal) || refundVal <= 0) {
      setErrorMessage('Please enter a valid positive refund amount.');
      return;
    }

    if (refundVal > maxRefundable) {
      setErrorMessage(
        `Refund amount (${formatPrice(refundVal)}) cannot exceed maximum refundable amount (${formatPrice(maxRefundable)}).`
      );
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      setErrorMessage('Please provide a mandatory refund reason (minimum 3 characters).');
      return;
    }

    if (!canRefundDirectly && (!managerPin.trim() || managerPin.trim().length !== 4)) {
      setErrorMessage(
        'Manager authorization PIN (4 digits) is required to process refunds.'
      );
      return;
    }

    setErrorMessage(null);

    try {
      await refundMutation.mutateAsync({
        paymentId: payment.id,
        payload: {
          amount: refundVal,
          reason: reason.trim(),
          refundMethod,
          reference: reference.trim() || undefined,
          managerPin: managerPin.trim() || undefined,
        },
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to process refund';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger flex items-center justify-center">
              <RotateCcw size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                Process Payment Refund
              </h3>
              <p className="text-xs text-pos-text-muted">
                Transaction ID #{payment.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close refund modal"
            className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Payment Summary Info */}
          <div className="p-3 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-1 text-xs font-mono">
            <div className="flex justify-between text-pos-text-muted">
              <span>Original Amount:</span>
              <span className="font-bold text-pos-text">
                {formatPrice(payment.amount)}
              </span>
            </div>
            {payment.refundedAmount !== undefined && payment.refundedAmount > 0 && (
              <div className="flex justify-between text-pos-warning">
                <span>Already Refunded:</span>
                <span>-{formatPrice(payment.refundedAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-pos-border text-pos-primary">
              <span>Max Refundable:</span>
              <span>{formatPrice(maxRefundable)}</span>
            </div>
          </div>

          {/* Refund Amount Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Refund Amount ({currency}) <span className="text-pos-danger">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-pos-text-muted">
                Rs.
              </span>
              <input
                type="number"
                step="1"
                min="1"
                max={maxRefundable}
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
              />
            </div>
          </div>

          {/* Refund Method Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Refund Tender Method
            </label>
            <select
              value={refundMethod}
              onChange={e => setRefundMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="DIGITAL_WALLET">Digital Wallet</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Mandatory Refund Reason <span className="text-pos-danger">*</span>
            </label>
            <textarea
              rows={2}
              required
              minLength={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Customer returned dish, double charge on POS, wrong item..."
              className="w-full p-2.5 rounded-lg bg-pos-surface border border-pos-border text-pos-text placeholder-pos-text-muted text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none font-medium shadow-xs"
            />
          </div>

          {/* Reference (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Reference / Authorization Slip # (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="e.g. Card slip #REF-9921"
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
            />
          </div>

          {/* Manager Authorization PIN */}
          {!canRefundDirectly && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5 flex items-center gap-1">
                <KeyRound size={13} className="text-pos-warning" />
                <span>Manager Authorization PIN</span>
                <span className="text-pos-danger">*</span>
              </label>
              <input
                type="password"
                maxLength={4}
                required
                value={managerPin}
                onChange={e => setManagerPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4-digit PIN"
                className="w-full px-3 py-2.5 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono tracking-widest text-center text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 border-t border-pos-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={refundMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              isLoading={refundMutation.isPending}
              disabled={!amount || !reason.trim()}
              className="font-bold shadow-xs"
            >
              Process Refund
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
