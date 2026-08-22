import React, { useState } from 'react';
import { TakeawayOrderRecord } from '@/types';
import { useUpdateTakeawayStatusMutation } from '../hooks/useTakeawayData';
import { CancelTakeawayModal } from './CancelTakeawayModal';
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
  FileText,
  AlertCircle,
} from 'lucide-react';

interface TakeawayDetailsDrawerProps {
  order: TakeawayOrderRecord;
  currency?: string;
  onClose: () => void;
  onRefresh: () => void;
}

export const TakeawayDetailsDrawer: React.FC<TakeawayDetailsDrawerProps> = ({
  order,
  currency = 'USD',
  onClose,
  onRefresh,
}) => {
  const updateStatusMutation = useUpdateTakeawayStatusMutation();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
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
              Takeaway Token • {order.businessDate}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close takeaway details"
          className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Drawer Error Banner */}
      {errorMessage && (
        <div className="p-3 bg-pos-danger-soft border-b border-[#FECACA] text-pos-danger text-xs flex items-center gap-2 shrink-0">
          <AlertCircle size={15} className="shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Customer & Tender Banner */}
        <div className="p-3 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-pos-text flex items-center gap-1.5 text-sm">
              <User size={15} className="text-pos-primary" />
              {order.customerName}
            </span>
            {order.isPayOnPickup ? (
              <Badge variant="warning" size="sm">
                Pay on Pickup
              </Badge>
            ) : (
              <Badge variant="success" size="sm">
                Paid ({order.paymentMethod})
              </Badge>
            )}
          </div>

          {order.customerPhone && (
            <p className="text-pos-text-muted flex items-center gap-1.5 font-mono text-[11px]">
              <Phone size={13} /> {order.customerPhone}
            </p>
          )}

          {order.specialInstructions && (
            <p className="text-pos-text-muted italic flex items-center gap-1.5 pt-1 border-t border-pos-border text-[11px]">
              <FileText size={13} className="shrink-0 text-pos-warning" />
              {order.specialInstructions}
            </p>
          )}
        </div>

        {/* Detailed Items Breakdown */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-2">
            Order Items ({order.items.length})
          </h4>
          <div className="space-y-2">
            {order.items.map(item => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-pos-surface border border-pos-border text-xs space-y-1.5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-pos-text">
                      {item.quantity}x {item.name}
                    </span>
                    {item.variantName && (
                      <span className="text-[11px] text-pos-primary font-semibold ml-1.5">
                        ({item.variantName})
                      </span>
                    )}
                  </div>
                  <span className="font-bold font-mono text-pos-text shrink-0">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>

                {item.specialInstructions && (
                  <p className="text-[11px] text-pos-text-muted italic flex items-center gap-1">
                    <FileText size={11} /> {item.specialInstructions}
                  </p>
                )}

                <div className="flex justify-between items-center text-[10px] text-pos-text-muted pt-1 border-t border-pos-border font-mono">
                  <span>Unit: {formatPrice(item.unitPrice)}</span>
                  <span>Line Total: {formatPrice(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-pos-text">Total Amount:</span>
            <span className="text-lg font-black text-pos-primary font-mono">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Status Progression Controls */}
        <div className="space-y-2 pt-2">
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
              onClick={() => handleUpdateStatus('COMPLETED', order.isPayOnPickup)}
              isLoading={updateStatusMutation.isPending}
              className="w-full font-bold flex items-center justify-center gap-2"
            >
              <PackageCheck size={16} />
              <span>Complete Handover {order.isPayOnPickup && '& Settle'}</span>
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
            onClick={() => window.print()}
            className="w-full text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <Printer size={14} />
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
    </div>
  );
};
