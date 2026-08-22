import React, { useState, useEffect } from 'react';
import { ReceiptsApi, FormattedCustomerReceipt } from '@/core/api/receiptsApi';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  X,
  Printer,
  Copy,
  Check,
  CreditCard,
  Receipt,
  Download,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface BillReceiptModalProps {
  orderId: string;
  orderCode?: string;
  onClose: () => void;
  onSettleBill?: () => void;
}

export const BillReceiptModal: React.FC<BillReceiptModalProps> = ({
  orderId,
  orderCode,
  onClose,
  onSettleBill,
}) => {
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [receipt, setReceipt] = useState<FormattedCustomerReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'VISUAL' | 'MONOSPACE'>('VISUAL');

  useEffect(() => {
    let isMounted = true;
    const fetchReceipt = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await ReceiptsApi.getOrderReceipt(orderId, paperWidth);
        if (isMounted) {
          setReceipt(data);
        }
      } catch (err) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load bill receipt data';
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchReceipt();
    return () => {
      isMounted = false;
    };
  }, [orderId, paperWidth]);

  const handleCopyText = () => {
    if (!receipt?.renderedSlip) return;
    navigator.clipboard.writeText(receipt.renderedSlip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number, currency = 'PKR') => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: currency || 'PKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-xl bg-pos-surface border border-pos-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-pos-border bg-pos-header flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-pos-accent/15 text-pos-accent flex items-center justify-center">
              <Receipt size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-pos-text leading-tight flex items-center gap-2">
                <span>Customer Bill & Receipt</span>
                <span className="font-mono text-pos-accent text-xs font-semibold">
                  #{orderCode || receipt?.metadata.orderCode || 'BILL'}
                </span>
              </h3>
              <p className="text-[11px] text-pos-text-muted">
                On-screen thermal receipt preview (no physical printer required)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-pos-bg p-0.5 rounded-lg border border-pos-border text-xs">
              <button
                type="button"
                onClick={() => setViewMode('VISUAL')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-bold transition-all',
                  viewMode === 'VISUAL'
                    ? 'bg-pos-accent text-white shadow-xs'
                    : 'text-pos-text-muted hover:text-pos-text'
                )}
              >
                Visual Bill
              </button>
              <button
                type="button"
                onClick={() => setViewMode('MONOSPACE')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-bold transition-all',
                  viewMode === 'MONOSPACE'
                    ? 'bg-pos-accent text-white shadow-xs'
                    : 'text-pos-text-muted hover:text-pos-text'
                )}
              >
                Raw Thermal
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close bill preview"
              className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Controls Bar */}
        <div className="px-4 py-2 border-b border-pos-border bg-pos-surface-subtle/50 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-pos-text-muted font-medium text-[11px]">Paper Width:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all',
                  paperWidth === '80mm'
                    ? 'border-pos-accent bg-pos-accent/15 text-pos-accent'
                    : 'border-pos-border bg-pos-surface text-pos-text-muted hover:text-pos-text'
                )}
              >
                80mm (Standard POS)
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all',
                  paperWidth === '58mm'
                    ? 'border-pos-accent bg-pos-accent/15 text-pos-accent'
                    : 'border-pos-border bg-pos-surface text-pos-text-muted hover:text-pos-text'
                )}
              >
                58mm (Mini Slip)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyText}
              disabled={!receipt}
              className="px-2.5 py-1 rounded-lg border border-pos-border bg-pos-surface hover:bg-pos-surface-hover text-pos-text text-[11px] font-semibold flex items-center gap-1 transition-colors"
              title="Copy receipt text to clipboard"
            >
              {copied ? <Check size={13} className="text-pos-success" /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleBrowserPrint}
              disabled={!receipt}
              className="px-2.5 py-1 rounded-lg border border-pos-border bg-pos-surface hover:bg-pos-surface-hover text-pos-text text-[11px] font-semibold flex items-center gap-1 transition-colors"
              title="Print via browser or Save as PDF"
            >
              <Download size={13} />
              <span>Save PDF / Print</span>
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-pos-bg/80 flex justify-center custom-scrollbar">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
              <Spinner size="lg" />
              <span>Generating Bill Receipt Slip...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-xs text-pos-danger flex flex-col items-center gap-2">
              <AlertCircle size={28} />
              <p className="font-semibold">{error}</p>
            </div>
          ) : receipt ? (
            <div
              className={cn(
                'bg-white text-zinc-900 rounded-xl shadow-2xl border border-zinc-200 transition-all font-mono',
                paperWidth === '80mm' ? 'w-full max-w-[420px] p-5 sm:p-6' : 'w-full max-w-[320px] p-4 text-[11px]'
              )}
            >
              {viewMode === 'MONOSPACE' ? (
                <pre className="whitespace-pre font-mono text-[11px] leading-relaxed text-zinc-900 overflow-x-auto">
                  {receipt.renderedSlip}
                </pre>
              ) : (
                <div className="space-y-4">
                  {/* Restaurant Header */}
                  <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-zinc-300">
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-zinc-900 uppercase">
                      {receipt.restaurant.name}
                    </h2>
                    {receipt.restaurant.address && (
                      <p className="text-[11px] text-zinc-600 leading-tight">
                        {receipt.restaurant.address}
                      </p>
                    )}
                    {receipt.restaurant.phone && (
                      <p className="text-[11px] text-zinc-600 font-semibold">
                        Tel: {receipt.restaurant.phone}
                      </p>
                    )}
                    {receipt.restaurant.taxNumber && (
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">
                        STRN / NTN: {receipt.restaurant.taxNumber}
                      </p>
                    )}
                    {receipt.restaurant.receiptHeader && (
                      <p className="text-[11px] italic text-zinc-600 pt-1 whitespace-pre-line border-t border-zinc-200 mt-1">
                        {receipt.restaurant.receiptHeader}
                      </p>
                    )}
                  </div>

                  {/* Order & Table Metadata */}
                  <div className="text-[11px] text-zinc-700 space-y-1 pb-3 border-b-2 border-dashed border-zinc-300">
                    <div className="flex justify-between font-bold">
                      <span>ORDER: #{receipt.metadata.orderCode}</span>
                      <span className="uppercase text-zinc-900 font-black">
                        {receipt.metadata.paymentStatus === 'PAID' ? 'PAID BILL' : 'BILL ESTIMATE'}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>Date: {receipt.metadata.formattedDate}</span>
                      <span>Time: {receipt.metadata.formattedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Type: <strong className="uppercase">{receipt.metadata.orderType}</strong>
                        {receipt.metadata.tableName && ` (${receipt.metadata.tableName})`}
                      </span>
                      <span>Cashier: {receipt.metadata.cashierName}</span>
                    </div>
                    {receipt.metadata.guestCount > 1 && (
                      <div className="text-zinc-600">
                        <span>Guests: {receipt.metadata.guestCount} Persons</span>
                      </div>
                    )}
                  </div>

                  {/* Itemized Line Items */}
                  <div className="space-y-2 pb-3 border-b-2 border-dashed border-zinc-300 text-xs">
                    <div className="flex justify-between font-bold text-[11px] uppercase text-zinc-500 pb-1 border-b border-zinc-200">
                      <span>Item / Qty</span>
                      <span>Amount</span>
                    </div>

                    {receipt.items.map(item => (
                      <div key={item.id} className="space-y-0.5">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <span className="font-bold text-zinc-900">
                              {item.quantity}x {item.itemName}
                            </span>
                            {item.variantName && (
                              <span className="text-[10px] text-zinc-500 ml-1">
                                ({item.variantName})
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-zinc-900 shrink-0">
                            {formatCurrency(item.lineTotal, receipt.restaurant.currency)}
                          </span>
                        </div>

                        {/* Modifiers / Special Cooking Notes */}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="pl-3 text-[10px] text-zinc-500 space-y-0.5">
                            {item.modifiers.map((m, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>+ {m.modifierOptionName}</span>
                                {m.priceAdjustment > 0 && (
                                  <span>{formatCurrency(m.priceAdjustment, receipt.restaurant.currency)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {item.specialInstructions && (
                          <p className="pl-3 text-[10px] italic text-zinc-500">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Financial Totals Calculation */}
                  <div className="space-y-1.5 text-xs pb-3 border-b-2 border-dashed border-zinc-300">
                    <div className="flex justify-between text-zinc-700">
                      <span>Subtotal:</span>
                      <span className="font-bold">
                        {formatCurrency(receipt.totals.subtotal, receipt.restaurant.currency)}
                      </span>
                    </div>

                    {receipt.totals.totalDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Discount:</span>
                        <span>- {formatCurrency(receipt.totals.totalDiscount, receipt.restaurant.currency)}</span>
                      </div>
                    )}

                    {receipt.totals.taxAmount > 0 && (
                      <div className="flex justify-between text-zinc-700">
                        <span>PRA Sales Tax ({receipt.totals.taxRate || 16}%):</span>
                        <span>{formatCurrency(receipt.totals.taxAmount, receipt.restaurant.currency)}</span>
                      </div>
                    )}

                    {receipt.totals.serviceChargeAmount > 0 && (
                      <div className="flex justify-between text-zinc-700">
                        <span>Service Charge:</span>
                        <span>{formatCurrency(receipt.totals.serviceChargeAmount, receipt.restaurant.currency)}</span>
                      </div>
                    )}

                    {receipt.totals.deliveryCharge > 0 && (
                      <div className="flex justify-between text-zinc-700">
                        <span>Delivery Fee:</span>
                        <span>{formatCurrency(receipt.totals.deliveryCharge, receipt.restaurant.currency)}</span>
                      </div>
                    )}

                    {/* Net Grand Total */}
                    <div className="flex justify-between items-center text-sm font-black text-zinc-950 pt-2 border-t-2 border-zinc-900 mt-2">
                      <span>TOTAL AMOUNT:</span>
                      <span className="text-base font-mono">
                        {formatCurrency(receipt.totals.grandTotal, receipt.restaurant.currency)}
                      </span>
                    </div>

                    {/* Payment info if paid */}
                    {receipt.payments && receipt.payments.length > 0 ? (
                      <div className="pt-2 border-t border-zinc-200 space-y-1 text-[11px]">
                        {receipt.payments.map((p, pIdx) => (
                          <div key={pIdx} className="flex justify-between text-zinc-700">
                            <span>Tendered ({p.paymentMethod}):</span>
                            <span className="font-bold">
                              {formatCurrency(p.amount, receipt.restaurant.currency)}
                            </span>
                          </div>
                        ))}
                        {receipt.totals.changeAmount > 0 && (
                          <div className="flex justify-between text-emerald-700 font-bold">
                            <span>Change Given:</span>
                            <span>{formatCurrency(receipt.totals.changeAmount, receipt.restaurant.currency)}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2 text-center">
                        <span className="inline-block px-3 py-1 rounded bg-amber-100 text-amber-900 font-bold text-[10px] uppercase tracking-wider">
                          *** UNPAID BILL - ESTIMATE ONLY ***
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Receipt Footer */}
                  <div className="text-center text-[10px] text-zinc-600 space-y-1 pt-1">
                    {receipt.restaurant.receiptFooter ? (
                      <p className="italic whitespace-pre-line leading-tight font-medium">
                        {receipt.restaurant.receiptFooter}
                      </p>
                    ) : (
                      <p className="italic">Thank you for dining with us! Shukriya!</p>
                    )}
                    <p className="text-[9px] text-zinc-400 font-mono pt-1">
                      Powered by Faraz Cloud POS System
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-pos-border bg-pos-header flex flex-wrap items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            className="font-semibold text-xs"
          >
            Close Preview
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleBrowserPrint}
              className="font-semibold text-xs flex items-center gap-1.5"
            >
              <Printer size={15} />
              <span>Browser Print / PDF</span>
            </Button>

            {onSettleBill && receipt?.metadata.paymentStatus !== 'PAID' && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => {
                  onClose();
                  onSettleBill();
                }}
                className="font-black text-xs flex items-center gap-1.5 bg-pos-success hover:bg-pos-success/90 text-white shadow-md shadow-pos-success/20"
              >
                <CreditCard size={15} />
                <span>Settle & Pay Bill</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
