import React, { useState } from 'react';
import { PaymentResponseData } from '@/types';
import { BillReceiptModal } from '@/components/receipts/BillReceiptModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, PlusCircle, ArrowRight, FileText } from 'lucide-react';
import { formatPrice as centralizedFormatPrice } from '@/utils/format';

interface OrderSuccessModalProps {
  result: PaymentResponseData;
  currency?: string;
  onNewSale: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  result,
  currency = 'PKR',
  onNewSale,
}) => {
  const order = result?.order;
  const payment = result?.payment;
  const changeAmount = result?.changeAmount ?? 0;
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const grandTotal =
    order?.grandTotal !== undefined
      ? typeof order.grandTotal === 'string'
        ? parseFloat(order.grandTotal)
        : order.grandTotal
      : payment?.amount !== undefined
        ? typeof payment.amount === 'string'
          ? parseFloat(payment.amount)
          : payment.amount
        : 0;

  const amountPaid =
    payment?.amount !== undefined
      ? typeof payment.amount === 'string'
        ? parseFloat(payment.amount)
        : payment.amount
      : grandTotal;

  const formatPrice = (val: number) => {
    return centralizedFormatPrice(val, currency);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
        <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-xl shadow-modal p-6 sm:p-7 text-center space-y-5">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-pos-success-soft border border-[#BBF7D0] text-pos-success shadow-xs animate-in zoom-in-50 duration-200">
            <CheckCircle size={36} />
          </div>

          <div>
            <Badge variant="success" className="mb-2">
              Payment Completed
            </Badge>
            <h2 className="text-xl font-bold text-pos-text">Order Paid & Closed</h2>
            <p className="text-xs text-pos-text-muted mt-1">
              Transaction has been recorded and active ticket closed
            </p>
          </div>

          {/* Order Details Receipt Box */}
          <div className="bg-pos-surface-subtle border border-pos-border rounded-lg p-4 text-xs space-y-2 text-left font-mono">
            {order?.tokenNumber && (
              <div className="flex justify-between items-center bg-pos-primary/10 px-3 py-2 rounded-md border border-pos-primary/20 mb-2">
                <span className="text-pos-primary font-bold text-xs uppercase tracking-wider">
                  Counter Token:
                </span>
                <span className="font-black text-pos-primary text-lg font-mono">
                  #{order.tokenNumber}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pb-2 border-b border-pos-border">
              <span className="text-pos-text-muted">Order Code:</span>
              <span className="font-bold text-pos-primary text-sm">
                #{order?.orderCode || 'ORD-COMPLETED'}
              </span>
            </div>

            <div className="flex justify-between items-center text-pos-text-muted">
              <span>Order Type:</span>
              <span className="font-semibold text-pos-text">
                {order?.orderType === 'DINE_IN'
                  ? `DINE-IN (${order?.table?.name || 'Table'})`
                  : order?.orderType || 'SALE'}
              </span>
            </div>

            <div className="flex justify-between items-center text-pos-text-muted">
              <span>Tender Method:</span>
              <span className="font-semibold text-pos-text">{payment?.paymentMethod || 'CASH'}</span>
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
              <div className="flex justify-between items-center pt-2 border-t border-pos-border text-pos-success font-bold text-sm">
                <span>Change Given:</span>
                <span>{formatPrice(changeAmount)}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {order?.id && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setIsReceiptModalOpen(true)}
                className="w-full sm:w-auto font-medium flex items-center justify-center gap-2"
              >
                <FileText size={16} /> View Digital Bill
              </Button>
            )}

            <Button
              variant="primary"
              size="lg"
              onClick={onNewSale}
              className="w-full sm:w-auto font-semibold flex items-center justify-center gap-2 shadow-xs"
            >
              <PlusCircle size={16} /> Start New Sale <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      </div>

      {/* On-screen Digital Bill Receipt Modal */}
      {isReceiptModalOpen && order?.id && (
        <BillReceiptModal
          orderId={order.id}
          orderCode={order.orderCode}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}
    </>
  );
};
