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
import { formatPrice as centralizedFormatPrice } from '@/utils/format';

interface DeliveryDetailsDrawerProps {
  order: DeliveryOrderRecord;
  currency?: string;
  onClose: () => void;
  onRefresh: () => void;
}

export const DeliveryDetailsDrawer: React.FC<DeliveryDetailsDrawerProps> = ({
  order,
  currency = 'PKR',
  onClose,
  onRefresh,
}) => {
  const updateStatusMutation = useUpdateDeliveryStatusMutation();
  const [isAssignRiderOpen, setIsAssignRiderOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatPrice = (val: number) => {
    return centralizedFormatPrice(val, currency);
  };

  const getStatusBadge = (status: DeliveryOrderRecord['status']) => {
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
          <Badge
            variant="default"
            size="sm"
            className="bg-pos-info-soft text-pos-info border border-[#BFDBFE]"
          >
            Ready to Dispatch
          </Badge>
        );
      case 'DISPATCHED':
        return (
          <Badge
            variant="default"
            size="sm"
            className="bg-pos-primary-soft text-pos-primary border border-pos-primary/20"
          >
            Out for Delivery
          </Badge>
        );
      case 'DELIVERED':
        return (
          <Badge variant="success" size="sm">
            Delivered
          </Badge>
        );
      case 'CANCELLED':
      case 'FAILED':
        return (
          <Badge variant="danger" size="sm">
            {status}
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
    <div className="w-full lg:w-96 flex flex-col bg-pos-surface border border-pos-border rounded-xl shadow-dropdown overflow-hidden shrink-0 animate-in slide-in-from-right-4 duration-150">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-pos-border bg-pos-surface flex items-center justify-between shrink-0">
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
        {/* Customer & Address Details */}
        <div className="p-3 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-pos-text flex items-center gap-1.5 text-sm">
              <User size={15} className="text-pos-primary" />
              {order.customerName}
            </span>
            {order.paymentStatus === 'PAID' ? (
              <Badge variant="success" size="sm">
                Paid ({order.paymentMethod})
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                Cash on Delivery (COD)
              </Badge>
            )}
          </div>

          <p className="text-pos-text-muted flex items-center gap-1.5 font-mono text-[11px]">
            <Phone size={13} /> {order.customerPhone}
          </p>

          <div className="pt-1.5 border-t border-pos-border space-y-1">
            <div className="flex items-start gap-1.5 text-[11px] text-pos-text font-medium">
              <MapPin size={13} className="shrink-0 text-pos-primary mt-0.5" />
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
              <p className="text-[11px] text-pos-text-secondary pl-4">
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
        <div className="p-3 rounded-lg bg-pos-surface border border-pos-border text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-pos-primary-soft border border-pos-primary/20 flex items-center justify-center text-pos-primary">
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
                  <span>Line: {formatPrice(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border space-y-1.5 text-xs">
          {order.deliveryCharge > 0 && (
            <div className="flex justify-between text-pos-text-muted">
              <span>Delivery Charge:</span>
              <span className="font-mono text-pos-text">
                {formatPrice(order.deliveryCharge)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-pos-border">
            <span className="text-pos-text">Total Due:</span>
            <span className="text-lg font-black text-pos-primary font-mono">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Progression Action Bar */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary">
            Dispatch Progression
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
              className="w-full font-bold flex items-center justify-center gap-2 bg-pos-info-soft hover:bg-pos-info hover:text-white text-pos-info border border-[#BFDBFE]"
            >
              <CheckCircle2 size={16} />
              <span>Mark Ready for Dispatch</span>
            </Button>
          )}

          {order.status === 'READY' && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleUpdateStatus('DISPATCHED')}
              isLoading={updateStatusMutation.isPending}
              className="w-full font-bold flex items-center justify-center gap-2"
            >
              <Send size={16} />
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
              className="w-full font-bold flex items-center justify-center gap-2 bg-pos-success hover:bg-pos-success/90 text-white"
            >
              <PackageCheck size={16} />
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
                className="w-full text-xs text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger-soft font-medium"
              >
                <AlertTriangle size={14} className="mr-1.5" />
                Cancel Delivery Order
              </Button>
            )}

          <Button
            variant="secondary"
            size="md"
            onClick={() => window.print()}
            className="w-full text-xs font-medium flex items-center justify-center gap-1.5"
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
