import React, { useState } from 'react';
import { DeliveryOrderRecord } from '@/types';
import { useUpdateDeliveryStatusMutation } from '../hooks/useDeliveryData';
import { AssignRiderModal } from './AssignRiderModal';
import { CancelDeliveryModal } from './CancelDeliveryModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  X,
  User,
  Phone,
  MapPin,
  Bike,
  Printer,
  ChefHat,
  CheckCircle2,
  Send,
  PackageCheck,
  AlertTriangle,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface DeliveryDetailsDrawerProps {
  order: DeliveryOrderRecord;
  currency?: string;
  onClose: () => void;
  onRefresh: () => void;
}

export const DeliveryDetailsDrawer: React.FC<DeliveryDetailsDrawerProps> = ({
  order,
  currency = 'USD',
  onClose,
  onRefresh,
}) => {
  const updateStatusMutation = useUpdateDeliveryStatusMutation();
  const [isAssignRiderOpen, setIsAssignRiderOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const getStatusBadge = (status: DeliveryOrderRecord['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'PREPARING':
        return <Badge variant="info">Preparing</Badge>;
      case 'READY':
        return (
          <Badge
            variant="default"
            className="bg-sky-500/20 text-sky-400 border-sky-500/40"
          >
            Ready to Dispatch
          </Badge>
        );
      case 'DISPATCHED':
        return (
          <Badge
            variant="default"
            className="bg-indigo-500/20 text-indigo-400 border-indigo-500/40"
          >
            Out for Delivery
          </Badge>
        );
      case 'DELIVERED':
        return <Badge variant="success">Delivered</Badge>;
      case 'CANCELLED':
      case 'FAILED':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleUpdateStatus = async (
    newStatus: 'PREPARING' | 'READY' | 'DISPATCHED' | 'DELIVERED',
    markPaid: boolean = false
  ) => {
    // Dispatch requires rider
    if (newStatus === 'DISPATCHED' && !order.rider) {
      setIsAssignRiderOpen(true);
      return;
    }

    setErrorMessage(null);
    try {
      await updateStatusMutation.mutateAsync({
        orderId: order.id,
        payload: {
          status: newStatus,
          ...(markPaid || (newStatus === 'DELIVERED' && order.paymentStatus !== 'PAID')
            ? { markPaid: true }
            : {}),
        },
      });
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update delivery status';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="w-full lg:w-96 flex flex-col bg-pos-surface border border-pos-border rounded-2xl shadow-xl overflow-hidden shrink-0 animate-in slide-in-from-right-4 duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-pos-border bg-pos-header flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black font-mono text-pos-text">
              #{order.orderCode}
            </h3>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-[11px] text-pos-text-muted mt-0.5">
            Delivery Dispatch • {order.businessDate}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close delivery details"
          className="p-2 rounded-xl text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Drawer Error Banner */}
      {errorMessage && (
        <div className="p-3 bg-pos-danger/10 border-b border-pos-danger/30 text-pos-danger text-xs flex items-center gap-2 shrink-0">
          <AlertCircle size={15} className="shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Customer & Address Details */}
        <div className="p-3.5 rounded-xl bg-pos-bg border border-pos-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-pos-text flex items-center gap-1.5 text-sm">
              <User size={15} className="text-pos-accent" />
              {order.customerName}
            </span>
            {order.paymentStatus === 'PAID' ? (
              <Badge variant="success">Paid ({order.paymentMethod})</Badge>
            ) : (
              <Badge variant="warning">Cash on Delivery (COD)</Badge>
            )}
          </div>

          <p className="text-pos-text-muted flex items-center gap-1.5 font-mono text-[11px]">
            <Phone size={13} /> {order.customerPhone}
          </p>

          <div className="pt-1.5 border-t border-pos-border/40 space-y-1">
            <div className="flex items-start gap-1.5 text-[11px] text-pos-text font-medium">
              <MapPin size={13} className="shrink-0 text-pos-accent mt-0.5" />
              <div>
                <span>{order.deliveryAddress}</span>
                {order.landmark && (
                  <span className="text-pos-text-muted italic block mt-0.5">
                    Landmark: {order.landmark}
                  </span>
                )}
              </div>
            </div>

            {order.deliveryZoneName && (
              <p className="text-[11px] text-pos-text-muted pl-4">
                Zone:{' '}
                <span className="font-semibold text-pos-text">
                  {order.deliveryZoneName}
                </span>
                {order.deliveryCharge > 0 && ` (${formatPrice(order.deliveryCharge)})`}
              </p>
            )}
          </div>
        </div>

        {/* Assigned Rider Box */}
        <div className="p-3 rounded-xl bg-pos-bg border border-pos-border text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-pos-surface border border-pos-border flex items-center justify-center text-pos-accent">
              <Bike size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-pos-text-muted block">
                Assigned Rider
              </span>
              <span className="font-bold text-pos-text">
                {order.rider ? order.rider.name : 'Unassigned'}
              </span>
              {order.rider?.phone && (
                <span className="text-[10px] text-pos-text-muted font-mono block">
                  {order.rider.phone}
                </span>
              )}
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAssignRiderOpen(true)}
            className="text-xs font-semibold"
          >
            {order.rider ? 'Reassign' : 'Assign Rider'}
          </Button>
        </div>

        {/* Detailed Items List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-pos-text mb-2">
            Order Items ({order.items.length})
          </h4>
          <div className="space-y-2">
            {order.items.map(item => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-pos-bg border border-pos-border text-xs space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-pos-text">
                      {item.quantity}x {item.name}
                    </span>
                    {item.variantName && (
                      <span className="text-[11px] text-pos-accent font-semibold ml-1.5">
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

                <div className="flex justify-between items-center text-[10px] text-pos-text-muted pt-1 border-t border-pos-border/40 font-mono">
                  <span>Unit: {formatPrice(item.unitPrice)}</span>
                  <span>Line: {formatPrice(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-3.5 rounded-xl bg-pos-header/70 border border-pos-border space-y-1.5 text-xs">
          {order.deliveryCharge > 0 && (
            <div className="flex justify-between text-pos-text-muted">
              <span>Delivery Charge:</span>
              <span className="font-mono text-pos-text">
                {formatPrice(order.deliveryCharge)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-pos-border/40">
            <span className="text-pos-text">Total Due:</span>
            <span className="text-lg font-black text-pos-accent font-mono">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Progression Action Bar */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-pos-text">
            Dispatch Progression
          </h4>

          {order.status === 'PENDING' && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleUpdateStatus('PREPARING')}
              isLoading={updateStatusMutation.isPending}
              className="w-full font-bold flex items-center justify-center gap-2"
            >
              <ChefHat size={18} />
              <span>Start Kitchen Preparation</span>
            </Button>
          )}

          {order.status === 'PREPARING' && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleUpdateStatus('READY')}
              isLoading={updateStatusMutation.isPending}
              className="w-full font-bold flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-500/90 text-white"
            >
              <CheckCircle2 size={18} />
              <span>Mark Ready for Dispatch</span>
            </Button>
          )}

          {order.status === 'READY' && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleUpdateStatus('DISPATCHED')}
              isLoading={updateStatusMutation.isPending}
              className="w-full font-bold flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-600/90 text-white shadow-md"
            >
              <Send size={18} />
              <span>
                {order.rider ? 'Dispatch with Rider' : 'Assign Rider & Dispatch'}
              </span>
            </Button>
          )}

          {order.status === 'DISPATCHED' && (
            <Button
              variant="primary"
              size="lg"
              onClick={() =>
                handleUpdateStatus('DELIVERED', order.paymentStatus !== 'PAID')
              }
              isLoading={updateStatusMutation.isPending}
              className="w-full font-black flex items-center justify-center gap-2 bg-pos-success hover:bg-pos-success/90 text-white shadow-md shadow-pos-success/20"
            >
              <PackageCheck size={18} />
              <span>Mark Delivered & Settle</span>
            </Button>
          )}

          {/* Cancel Order Button */}
          {order.status !== 'DELIVERED' &&
            order.status !== 'CANCELLED' &&
            order.status !== 'FAILED' && (
              <Button
                variant="ghost"
                size="md"
                onClick={() => setIsCancelModalOpen(true)}
                className="w-full text-xs text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger/10 font-semibold"
              >
                <AlertTriangle size={14} className="mr-1.5" />
                Cancel Delivery Order
              </Button>
            )}

          <Button
            variant="secondary"
            size="md"
            onClick={() => window.print()}
            className="w-full text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Printer size={14} />
            <span>Print Dispatch Slip</span>
          </Button>
        </div>
      </div>

      {/* Rider Assignment Modal */}
      {isAssignRiderOpen && (
        <AssignRiderModal
          order={order}
          onClose={() => setIsAssignRiderOpen(false)}
          onSuccess={() => {
            onRefresh();
            setIsAssignRiderOpen(false);
          }}
        />
      )}

      {/* Cancel Modal */}
      {isCancelModalOpen && (
        <CancelDeliveryModal
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
