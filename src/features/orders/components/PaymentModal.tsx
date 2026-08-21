import React, { useState } from 'react';
import { OrderRecord, PaymentMethod, PaymentResponseData } from '@/types';
import { useProcessPaymentMutation } from '../hooks/usePosData';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  CheckCircle2,
  AlertCircle,
  Delete,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface PaymentModalProps {
  order: OrderRecord;
  currency?: string;
  onClose: () => void;
  onPaymentSuccess: (result: PaymentResponseData) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  order,
  currency = 'USD',
  onClose,
  onPaymentSuccess,
}) => {
  const processPaymentMutation = useProcessPaymentMutation();

  const grandTotal =
    typeof order.grandTotal === 'string'
      ? parseFloat(order.grandTotal)
      : order.grandTotal;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [tenderedStr, setTenderedStr] = useState<string>(grandTotal.toFixed(2));
  const [cardLast4, setCardLast4] = useState<string>('');
  const [cardBrand, setCardBrand] = useState<string>('VISA');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const amountTendered = parseFloat(tenderedStr) || 0;
  const changeDue = Math.max(0, amountTendered - grandTotal);
  const isTenderSufficient =
    paymentMethod !== 'CASH' || amountTendered >= grandTotal - 0.001;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleQuickCash = (amount: number) => {
    setTenderedStr(amount.toFixed(2));
  };

  const handleNumpadDigit = (digit: string) => {
    setTenderedStr(prev => {
      // If was exact total, overwrite with new typing
      if (parseFloat(prev) === grandTotal && prev === grandTotal.toFixed(2)) {
        return digit;
      }
      if (prev.includes('.') && prev.split('.')[1].length >= 2) {
        return prev;
      }
      return prev === '0' ? digit : prev + digit;
    });
  };

  const handleNumpadDot = () => {
    setTenderedStr(prev => (prev.includes('.') ? prev : `${prev}.`));
  };

  const handleNumpadBackspace = () => {
    setTenderedStr(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleNumpadClear = () => {
    setTenderedStr('0');
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTenderSufficient) {
      setPaymentError(
        `Tendered cash (${formatPrice(amountTendered)}) is less than total due (${formatPrice(grandTotal)}).`
      );
      return;
    }

    setPaymentError(null);

    try {
      const response = await processPaymentMutation.mutateAsync({
        orderId: order.id,
        paymentMethod,
        amount: grandTotal,
        amountTendered: paymentMethod === 'CASH' ? amountTendered : undefined,
        cardLast4: paymentMethod === 'CARD' && cardLast4 ? cardLast4 : undefined,
        cardBrand: paymentMethod === 'CARD' && cardBrand ? cardBrand : undefined,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onPaymentSuccess(response);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to process payment tender';
      setPaymentError(msg);
    }
  };

  const paymentMethods: Array<{
    id: PaymentMethod;
    label: string;
    icon: typeof Banknote;
  }> = [
    { id: 'CASH', label: 'Cash Tender', icon: Banknote },
    { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard },
    { id: 'DIGITAL_WALLET', label: 'Digital / QR Wallet', icon: Smartphone },
    { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building2 },
  ];

  // Quick cash amounts based on grandTotal
  const quickCashAmounts = [
    grandTotal,
    Math.ceil(grandTotal / 5) * 5,
    Math.ceil(grandTotal / 10) * 10,
    Math.ceil(grandTotal / 20) * 20,
    Math.ceil(grandTotal / 50) * 50,
  ].filter((v, idx, arr) => arr.indexOf(v) === idx && v >= grandTotal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-2xl bg-pos-surface border border-pos-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-pos-accent font-bold bg-pos-accent/10 px-2 py-0.5 rounded">
                #{order.orderCode}
              </span>
              <h3 className="text-lg font-bold text-pos-text">Payment Tender</h3>
            </div>
            <p className="text-xs text-pos-text-muted mt-0.5">
              Select tender method and enter payment details
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processPaymentMutation.isPending}
            aria-label="Close payment modal"
            className="p-2 rounded-xl text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
          {paymentError && (
            <div className="p-3.5 rounded-xl bg-pos-danger/10 border border-pos-danger/30 text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* Amount Due Summary Banner */}
          <div className="p-4 rounded-xl bg-pos-bg border border-pos-border flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-pos-text-muted">
                Total Amount Due
              </span>
              <p className="text-2xl font-black text-pos-text mt-0.5">
                {formatPrice(grandTotal)}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="info">
                {order.orderType === 'DINE_IN'
                  ? `Dine-In • ${order.table?.name || 'Table'}`
                  : order.orderType}
              </Badge>
              <p className="text-[11px] text-pos-text-muted mt-1">
                {order.items.length} items
              </p>
            </div>
          </div>

          {/* 1. Payment Method Pills */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {paymentMethods.map(pm => {
                const Icon = pm.icon;
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(pm.id);
                      setPaymentError(null);
                    }}
                    className={cn(
                      'p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 min-h-[70px]',
                      isSelected
                        ? 'border-pos-accent bg-pos-accent/15 ring-2 ring-pos-accent text-pos-text shadow-sm'
                        : 'border-pos-border bg-pos-bg/80 text-pos-text-muted hover:border-pos-border-focus hover:text-pos-text'
                    )}
                  >
                    <Icon size={20} className={isSelected ? 'text-pos-accent' : ''} />
                    <span className="text-xs font-semibold">{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Mode Specific Tender Inputs */}
          {paymentMethod === 'CASH' ? (
            /* Cash Tender Section */
            <div className="space-y-4 pt-2 border-t border-pos-border/60">
              {/* Quick Cash Amount Pills */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-pos-text-muted mb-1.5">
                  Quick Cash Tender
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(grandTotal)}
                    className="px-3 py-1.5 rounded-lg border border-pos-accent/40 bg-pos-accent/10 text-pos-accent text-xs font-bold hover:bg-pos-accent/20 transition-colors"
                  >
                    Exact ({formatPrice(grandTotal)})
                  </button>
                  {quickCashAmounts.slice(1).map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickCash(amt)}
                      className="px-3 py-1.5 rounded-lg border border-pos-border bg-pos-bg text-pos-text text-xs font-bold hover:bg-pos-surface transition-colors"
                    >
                      {formatPrice(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tendered Input & Change Due Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-pos-bg border border-pos-border">
                  <span className="text-xs font-bold uppercase tracking-wider text-pos-text-muted">
                    Amount Tendered
                  </span>
                  <div className="text-xl font-bold font-mono text-pos-text mt-1">
                    {formatPrice(amountTendered)}
                  </div>
                </div>

                <div
                  className={cn(
                    'p-3.5 rounded-xl border flex flex-col justify-between',
                    changeDue > 0
                      ? 'bg-pos-success/10 border-pos-success/30 text-pos-success'
                      : 'bg-pos-bg border-pos-border text-pos-text-muted'
                  )}
                >
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Change Due
                  </span>
                  <div className="text-xl font-bold font-mono mt-1">
                    {formatPrice(changeDue)}
                  </div>
                </div>
              </div>

              {/* Cash Numpad Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleNumpadDigit(digit)}
                    className="h-11 rounded-xl bg-pos-bg hover:bg-pos-surface border border-pos-border font-bold text-lg text-pos-text active:scale-95 transition-all shadow-sm flex items-center justify-center select-none"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleNumpadDot}
                  className="h-11 rounded-xl bg-pos-bg hover:bg-pos-surface border border-pos-border font-bold text-lg text-pos-text active:scale-95 transition-all shadow-sm flex items-center justify-center select-none"
                >
                  .
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadDigit('0')}
                  className="h-11 rounded-xl bg-pos-bg hover:bg-pos-surface border border-pos-border font-bold text-lg text-pos-text active:scale-95 transition-all shadow-sm flex items-center justify-center select-none"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleNumpadBackspace}
                  className="h-11 rounded-xl bg-pos-bg/60 hover:bg-pos-surface border border-pos-border text-pos-text-muted active:scale-95 flex items-center justify-center select-none"
                >
                  <Delete size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleNumpadClear}
                  className="col-span-3 h-9 rounded-xl bg-pos-bg/60 hover:bg-pos-danger/10 hover:text-pos-danger border border-pos-border text-pos-text-muted active:scale-95 text-xs font-bold flex items-center justify-center gap-1 select-none mt-1"
                >
                  <RotateCcw size={14} /> Clear Amount
                </button>
              </div>
            </div>
          ) : (
            /* Card / Electronic Payment Details */
            <div className="space-y-3 pt-2 border-t border-pos-border/60">
              {paymentMethod === 'CARD' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                      Card Brand
                    </label>
                    <select
                      value={cardBrand}
                      onChange={e => setCardBrand(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-semibold"
                    >
                      <option value="VISA">Visa</option>
                      <option value="MASTERCARD">Mastercard</option>
                      <option value="AMEX">American Express</option>
                      <option value="DISCOVER">Discover</option>
                      <option value="UNIONPAY">UnionPay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                      Card Last 4 Digits
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={cardLast4}
                      onChange={e => setCardLast4(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 4242"
                      className="w-full px-3.5 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-pos-accent font-semibold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                  Approval / Transaction Reference
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="e.g. AUTH-98234 / POS Terminal Ref"
                  className="w-full px-3.5 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-pos-accent font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-pos-text mb-1.5">
                  Payment Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Optional tender notes..."
                  className="w-full px-3.5 py-2 rounded-xl bg-pos-bg border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-xs focus:outline-none focus:ring-2 focus:ring-pos-accent font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-pos-border bg-pos-header flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={processPaymentMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleSubmitPayment}
            isLoading={processPaymentMutation.isPending}
            disabled={!isTenderSufficient}
            className="font-bold flex items-center gap-2 min-w-[200px]"
          >
            <CheckCircle2 size={18} />
            <span>Confirm & Complete {formatPrice(grandTotal)}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
