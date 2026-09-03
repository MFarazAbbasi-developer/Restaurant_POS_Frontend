import React, { useState } from 'react';
import { TakeawayOrderRecord, OrderRecord, PaymentResponseData } from '@/types';
import { useUpdateTakeawayStatusMutation } from '../hooks/useTakeawayData';
import { OrdersApi } from '@/core/api/ordersApi';
import { CancelTakeawayModal } from './CancelTakeawayModal';
import { BillReceiptModal } from '@/components/receipts/BillReceiptModal';
import { PaymentModal } from '@/features/orders/components/PaymentModal';
import { OrderSuccessModal } from '@/features/orders/components/OrderSuccessModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  X,
  User,
  Phone,
  Printer,
  ChefHat,
  CheckCircle2,
  PackageCheck,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { formatPrice as centralizedFormatPrice } from '@/utils/format';

interface TakeawayDetailsDrawerProps {
  order: TakeawayOrderRecord;
  currency?: string;
  onClose: () => void;
  onRefresh: () => void;
}

export const TakeawayDetailsDrawer: React.FC<TakeawayDetailsDrawerProps> = ({
  order,
  currency = 'PKR',
  onClose,
  onRefresh,
}) => {
  const updateStatusMutation = useUpdateTakeawayStatusMutation();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<OrderRecord | null>(null);
  const [completedPaymentResult, setCompletedPaymentResult] =
    useState<PaymentResponseData | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);

  const formatPrice = (val: number) => {
    return centralizedFormatPrice(val, currency);
  };

  const getStatusBadge = (status: TakeawayOrderRecord['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="warning" size="sm">
            Pending
          </Badge>
        );
      case 'PREPARING':
        return (
          <Badge variant="info" size="sm">
            Preparing
          </Badge>
        );
      case 'READY':
        return (
          <Badge variant="success" size="sm">
            Ready
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="default" size="sm">
            Completed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" size="sm">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="sm">
            {status}
          </Badge>
        );
    }
  };

  const handleStartHandoverAndSettlement = async () => {
    if (order.isPayOnPickup || order.paymentStatus !== 'PAID') {
      setIsLoadingOrder(true);
      setErrorMessage(null);
      try {
        const response = await OrdersApi.getOrder(order.id);
        setPayingOrder(response.order);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to fetch order details for settlement';
        setErrorMessage(msg);
      } finally {
        setIsLoadingOrder(false);
      }
    } else {
      await handleUpdateStatus('COMPLETED');
    }
  };

  const handleUpdateStatus = async (
    newStatus: 'PREPARING' | 'READY' | 'COMPLETED',
    markPaid: boolean = false
  ) => {
    setErrorMessage(null);
    try {
      await updateStatusMutation.mutateAsync({
        orderId: order.id,
        payload: {
          status: newStatus,
          ...(markPaid || (newStatus === 'COMPLETED' && order.isPayOnPickup)
            ? { markPaid: true }
            : {}),
        },
      });
      onRefresh();
      if (newStatus === 'COMPLETED') {
        onClose();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update order status';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="w-full lg:w-96 flex flex-col bg-pos-surface border border-pos-border rounded-xl shadow-dropdown overflow-hidden shrink-0 animate-in slide-in-from-right-4 duration-150">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-pos-border bg-pos-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="px-2.5 py-0.5 rounded-md bg-pos-primary text-white font-black text-base font-mono tracking-wide shadow-xs">
            #{order.tokenNumber}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-pos-text font-bold">
                #{order.orderCode}
              </span>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-[11px] text-pos-text-muted mt-0.5">
              {new Date(order.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 rounded-md hover:bg-pos-surface-subtle text-pos-text-muted flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
        {/* Drawer Error Banner */}
        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Customer & Tender Banner */}
        <div className="p-3 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-pos-text flex items-center gap-1.5">
              <User size={13} className="text-pos-text-muted" />
              {order.customerName}
            </span>
            {order.isPayOnPickup ? (
              <Badge variant="warning" size="sm" className="font-semibold">
                Pay on Pickup
              </Badge>
            ) : (
              <Badge variant="success" size="sm" className="font-semibold">
                Paid Upfront
              </Badge>
            )}
          </div>

          {order.customerPhone && (
            <p className="text-pos-text-muted flex items-center gap-1.5">
              <Phone size={12} /> {order.customerPhone}
            </p>
          )}

          {order.specialInstructions && (
            <p className="text-pos-text-secondary bg-pos-surface p-2 rounded border border-pos-border text-[11px]">
              <span className="font-bold">Notes:</span> {order.specialInstructions}
            </p>
          )}
        </div>

        {/* Detailed Items Breakdown */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-2">
            Order Items ({order.items.reduce((acc, it) => acc + it.quantity, 0)})
          </h4>
          <div className="divide-y divide-pos-border border border-pos-border rounded-lg overflow-hidden bg-pos-surface">
            {order.items.map((item, idx) => (
              <div key={item.id || idx} className="p-2.5 flex justify-between items-start">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 font-medium text-pos-text">
                    <span className="font-bold text-pos-primary">{item.quantity}x</span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.variantName && (
                    <p className="text-[11px] text-pos-text-muted ml-5">
                      {item.variantName}
                    </p>
                  )}
                  {Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                    <p className="text-[10px] text-pos-text-muted ml-5">
                      +{(item.modifiers as Array<{ modifierName?: string; name?: string }>)
                        .map(m => m.modifierName || m.name)
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {item.specialInstructions && (
                    <p className="text-[10px] text-pos-warning ml-5 italic">
                      "{item.specialInstructions}"
                    </p>
                  )}
                </div>
                <span className="font-mono font-semibold text-pos-text shrink-0">
                  {formatPrice(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="pt-2 border-t border-pos-border space-y-1.5">
          <div className="flex justify-between items-center text-sm font-bold text-pos-text">
            <span>Grand Total:</span>
            <span className="font-mono text-base text-pos-primary">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-pos-text-muted">
            <span>Payment Method:</span>
            <span className="font-medium text-pos-text">{order.paymentMethod}</span>
          </div>
        </div>

        {/* Status Progression Controls */}
        <div className="pt-3 border-t border-pos-border space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary">
            Queue Actions
          </h4>

          {order.status === 'PENDING' && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleUpdateStatus('PREPARING')}
              isLoading={updateStatusMutation.isPending}
              className="w-full font-bold flex items-center justify-center gap-2 bg-pos-info hover:bg-pos-info/90 text-white"
            >
              <ChefHat size={16} />
              <span>Start Kitchen Preparation</span>
            </Button>
          )}

          {order.status === 'PREPARING' && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleUpdateStatus('READY')}
              isLoading={updateStatusMutation.isPending}
              className="w-full font-bold flex items-center justify-center gap-2 bg-pos-success hover:bg-pos-success/90 text-white"
            >
              <CheckCircle2 size={16} />
              <span>Mark Ready for Pickup</span>
            </Button>
          )}

          {order.status === 'READY' && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartHandoverAndSettlement}
              isLoading={updateStatusMutation.isPending || isLoadingOrder}
              className="w-full font-bold flex items-center justify-center gap-2"
            >
              <PackageCheck size={16} />
              <span>
                {order.isPayOnPickup || order.paymentStatus !== 'PAID'
                  ? `Complete Handover & Settle (${formatPrice(order.totalAmount)})`
                  : 'Complete Handover'}
              </span>
            </Button>
          )}

          {/* Cancel Order Button */}
          {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => setIsCancelModalOpen(true)}
              className="w-full text-xs text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger-soft font-medium"
            >
              <AlertTriangle size={14} className="mr-1.5" />
              Cancel Takeaway Order
            </Button>
          )}

          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsReceiptModalOpen(true)}
            className="w-full text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[38px]"
          >
            <Printer size={15} />
            <span>Print Counter Token Receipt</span>
          </Button>
        </div>
      </div>

      {/* Cancel Modal */}
      {isCancelModalOpen && (
        <CancelTakeawayModal
          order={order}
          onClose={() => setIsCancelModalOpen(false)}
          onSuccess={() => {
            onRefresh();
            onClose();
          }}
        />
      )}

      {/* Bill & Token Receipt Modal */}
      {isReceiptModalOpen && (
        <BillReceiptModal
          orderId={order.id}
          orderCode={order.orderCode}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}

      {/* Payment Modal for Pay on Pickup */}
      {payingOrder && (
        <PaymentModal
          order={payingOrder}
          currency={currency}
          onClose={() => setPayingOrder(null)}
          onPaymentSuccess={async result => {
            setPayingOrder(null);
            setCompletedPaymentResult(result);
            try {
              await updateStatusMutation.mutateAsync({
                orderId: order.id,
                payload: { status: 'COMPLETED' },
              });
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}

      {/* Payment Settlement Success Screen */}
      {completedPaymentResult && (
        <OrderSuccessModal
          result={completedPaymentResult}
          currency={currency}
          onNewSale={() => {
            setCompletedPaymentResult(null);
            onRefresh();
            onClose();
          }}
        />
      )}
    </div>
  );
};
