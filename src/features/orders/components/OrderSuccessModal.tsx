import React, { useState } from 'react';
import { PaymentResponseData } from '@/types';
import { BillReceiptModal } from '@/components/receipts/BillReceiptModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, PlusCircle, ArrowRight, FileText } from 'lucide-react';

interface OrderSuccessModalProps {
  result: PaymentResponseData;
  currency?: string;
  onNewSale: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  result,
  currency = 'USD',
  onNewSale,
}) => {
  const { order, payment, changeAmount = 0 } = result;
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const grandTotal =
    typeof order.grandTotal === 'string'
      ? parseFloat(order.grandTotal)
      : order.grandTotal;

  const amountPaid =
    typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
        <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-pos-success/15 border border-pos-success/30 text-pos-success shadow-lg shadow-pos-success/20 animate-in zoom-in-50 duration-200">
            <CheckCircle size={44} />
          </div>

          <div>
            <Badge variant="success" className="mb-2">
              Payment Completed
            </Badge>
            <h2 className="text-2xl font-black text-pos-text">Order Paid & Closed</h2>
            <p className="text-xs text-pos-text-muted mt-1">
              Order has been processed and saved in the central restaurant database
            </p>
          </div>

          {/* Order Details Receipt Box */}
          <div className="bg-pos-bg border border-pos-border rounded-xl p-4 text-xs space-y-2.5 text-left font-mono">
            <div className="flex justify-between items-center pb-2 border-b border-pos-border/60">
              <span className="text-pos-text-muted">Order Code:</span>
              <span className="font-bold text-pos-accent text-sm">#{order.orderCode}</span>
            </div>

            <div className="flex justify-between items-center text-pos-text-muted">
              <span>Order Type:</span>
              <span className="font-semibold text-pos-text">
                {order.orderType === 'DINE_IN'
                  ? `DINE-IN (${order.table?.name || 'Table'})`
                  : order.orderType}
              </span>
            </div>

            <div className="flex justify-between items-center text-pos-text-muted">
              <span>Tender Method:</span>
              <span className="font-semibold text-pos-text">{payment.paymentMethod}</span>
            </div>

            <div className="flex justify-between items-center text-pos-text-muted">
              <span>Total Amount:</span>
              <span className="font-bold text-pos-text">{formatPrice(grandTotal)}</span>
            </div>

            <div className="flex justify-between items-center text-pos-text-muted">
              <span>Amount Paid:</span>
              <span className="font-bold text-pos-text">{formatPrice(amountPaid)}</span>
            </div>

            {changeAmount > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-pos-border/60 text-pos-success font-bold text-sm">
                <span>Change Given:</span>
                <span>{formatPrice(changeAmount)}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setIsReceiptModalOpen(true)}
              className="w-full sm:w-auto font-semibold flex items-center justify-center gap-2"
            >
              <FileText size={18} /> View Digital Bill
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={onNewSale}
              className="w-full sm:w-auto font-bold flex items-center justify-center gap-2 shadow-lg shadow-pos-accent/20"
            >
              <PlusCircle size={18} /> Start New Sale <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* On-screen Digital Bill Receipt Modal */}
      {isReceiptModalOpen && (
        <BillReceiptModal
          orderId={order.id}
          orderCode={order.orderCode}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}
    </>
  );
};
