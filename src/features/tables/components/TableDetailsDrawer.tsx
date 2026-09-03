import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PosTable, PosZone, TableStatus, OrderRecord, PaymentResponseData } from '@/types';
import {
  useUpdateTableStatusMutation,
} from '@/features/orders/hooks/usePosData';
import { useCartStore } from '@/features/orders/store/cartStore';
import { OrdersApi } from '@/core/api/ordersApi';
import { PaymentModal } from '@/features/orders/components/PaymentModal';
import { BillReceiptModal } from '@/components/receipts/BillReceiptModal';
import { OrderSuccessModal } from '@/features/orders/components/OrderSuccessModal';
import { TableTransferModal } from './TableTransferModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  X,
  Users,
  UtensilsCrossed,
  Receipt,
  ArrowRightLeft,
  ShoppingBag,
  Plus,
  Clock,
  Sparkles,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  ChefHat,
  Printer,
  AlertTriangle,
} from 'lucide-react';
import { formatPrice as centralizedFormatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';

interface TableDetailsDrawerProps {
  table: PosTable;
  zone?: PosZone;
  allZones: PosZone[];
  currency?: string;
  onClose: () => void;
  onRefresh: () => void;
}

export const TableDetailsDrawer: React.FC<TableDetailsDrawerProps> = ({
  table,
  zone,
  allZones,
  currency = 'PKR',
  onClose,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const updateStatusMutation = useUpdateTableStatusMutation();
  const { setSelectedTable, setOrderType } = useCartStore();

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<OrderRecord | null>(null);
  const [completedPaymentResult, setCompletedPaymentResult] =
    useState<PaymentResponseData | null>(null);
  const [viewingReceiptOrderId, setViewingReceiptOrderId] = useState<{
    id: string;
    code: string;
  } | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);

  const formatPrice = (val: number) => {
    return centralizedFormatPrice(val, currency);
  };

  const getStatusBadge = (status: PosTable['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <Badge
            variant="success"
            size="sm"
            className="flex items-center gap-1 font-semibold"
          >
            <CheckCircle2 size={11} />
            <span>Available</span>
          </Badge>
        );
      case 'OCCUPIED':
        return (
          <Badge
            variant="warning"
            size="sm"
            className="flex items-center gap-1 font-semibold"
          >
            <UtensilsCrossed size={11} />
            <span>Occupied</span>
          </Badge>
        );
      case 'BILL_PRINTED':
        return (
          <Badge
            variant="info"
            size="sm"
            className="flex items-center gap-1 font-semibold"
          >
            <Printer size={11} />
            <span>Bill Printed</span>
          </Badge>
        );
      case 'RESERVED':
        return (
          <Badge
            variant="default"
            size="sm"
            className="flex items-center gap-1 font-semibold"
          >
            <Users size={11} />
            <span>Reserved</span>
          </Badge>
        );
      case 'CLEANING':
        return (
          <Badge
            variant="danger"
            size="sm"
            className="flex items-center gap-1 font-semibold"
          >
            <AlertTriangle size={11} />
            <span>Needs Cleaning</span>
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

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'SERVED':
        return (
          <Badge
            variant="success"
            size="sm"
            className="flex items-center gap-1 font-semibold"
          >
            <CheckCircle2 size={11} /> Food Served
          </Badge>
        );
      case 'READY':
        return (
          <Badge
            variant="success"
            size="sm"
            className="flex items-center gap-1 font-semibold"
          >
            <Sparkles size={11} /> Ready
          </Badge>
        );
      case 'PREPARING':
        return (
          <Badge
            variant="warning"
            size="sm"
            className="flex items-center gap-1 font-semibold"
          >
            <ChefHat size={11} /> In Kitchen
          </Badge>
        );
      case 'BILL_PRINTED':
        return (
          <Badge
            variant="info"
            size="sm"
            className="flex items-center gap-1 font-semibold"
          >
            <Printer size={11} /> Bill Printed
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

  // 1. Action: Launch POS Register for this table (Add more items)
  const handleOpenPOSRegister = () => {
    setSelectedTable({ id: table.id, name: table.name });
    setOrderType('DINE_IN');
    navigate('/orders');
  };

  // 2. Action: Settle Bill & Open Payment Modal
  const handleSettleOrder = async (orderId: string) => {
    setIsLoadingOrder(true);
    setErrorMessage(null);
    try {
      const response = await OrdersApi.getOrder(orderId);
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
  };

  // 3. Action: Change Table Operational Status
  const handleStatusChange = async (newStatus: TableStatus) => {
    if (newStatus === table.status) return;
    setErrorMessage(null);

    try {
      await updateStatusMutation.mutateAsync({
        tableId: table.id,
        status: newStatus,
      });
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update table status';
      setErrorMessage(msg);
    }
  };

  const totalAmount =
    table.activeOrders?.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0) || 0;

  const totalGuests =
    table.activeOrders?.reduce((sum, ord) => sum + (ord.guestCount || 0), 0) || 0;

  const statusOptions: Array<{ id: TableStatus; label: string; icon: typeof Sparkles }> =
    [
      { id: 'AVAILABLE', label: 'Mark Available', icon: Sparkles },
      { id: 'OCCUPIED', label: 'Mark Occupied', icon: UtensilsCrossed },
      { id: 'BILL_PRINTED', label: 'Bill Printed', icon: Printer },
      { id: 'CLEANING', label: 'Needs Cleaning', icon: Clock },
      { id: 'RESERVED', label: 'Reserve Table', icon: Users },
    ];

  return (
    <>
      <div className="w-full xl:w-[390px] flex flex-col bg-pos-surface border border-pos-border rounded-lg shadow-dropdown overflow-hidden shrink-0">
        {/* Drawer Header */}
        <div className="p-3.5 sm:p-4 border-b border-pos-border bg-pos-surface flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-pos-text">{table.name}</h3>
              {getStatusBadge(table.status)}
            </div>
            <p className="text-xs text-pos-text-muted mt-0.5 font-medium">
              {zone?.name || 'Floor Zone'} • {table.capacity} Seats Capacity
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close details drawer"
            className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Error Banner */}
        {errorMessage && (
          <div className="p-3 bg-pos-danger-soft border-b border-[#FECACA] text-pos-danger text-xs flex items-center gap-2 shrink-0">
            <AlertCircle size={15} className="shrink-0" />
            <span className="flex-1 font-medium">{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 custom-scrollbar">
          {/* Table Summary Financial Card */}
          <div className="p-3.5 rounded-lg bg-pos-surface-subtle border border-pos-border flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pos-text-muted">
                Active Table Total
              </span>
              <p className="text-2xl font-black text-pos-primary font-mono mt-0.5">
                {formatPrice(totalAmount)}
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pos-text-muted">
                Guests Seated
              </span>
              <p className="font-bold text-pos-text mt-0.5 font-mono">
                {totalGuests > 0 ? totalGuests : table.capacity} Persons
              </p>
            </div>
          </div>

          {/* Primary Action Buttons Bar */}
          {table.activeOrders && table.activeOrders.length > 0 ? (
            <div className="space-y-2">
              {/* Primary Settlement Button (Dominant Action) */}
              <Button
                variant="primary"
                size="lg"
                disabled={isLoadingOrder}
                onClick={() => {
                  if (table.activeOrders && table.activeOrders.length > 0) {
                    handleSettleOrder(table.activeOrders[0].id);
                  }
                }}
                className="w-full font-bold flex items-center justify-center gap-2 min-h-[44px] bg-pos-success hover:bg-pos-success/90 text-white shadow-xs text-sm"
              >
                <CreditCard size={17} />
                <span>Settle & Pay Bill ({formatPrice(totalAmount)})</span>
              </Button>

              {/* Secondary Actions: Add More Dishes & Print Pre-Bill */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleOpenPOSRegister}
                  className="font-semibold flex items-center justify-center gap-1.5 min-h-[38px] text-xs"
                >
                  <Plus size={15} />
                  <span>+ Add Dishes</span>
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    if (table.activeOrders && table.activeOrders.length > 0) {
                      handleStatusChange('BILL_PRINTED');
                      setViewingReceiptOrderId({
                        id: table.activeOrders[0].id,
                        code: table.activeOrders[0].orderCode,
                      });
                    }
                  }}
                  className="font-semibold flex items-center justify-center gap-1.5 min-h-[38px] text-xs"
                >
                  <Printer size={15} />
                  <span>View / Print Bill</span>
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={handleOpenPOSRegister}
              className="w-full font-bold flex items-center justify-center gap-2 shadow-xs min-h-[44px]"
            >
              <ShoppingBag size={18} />
              <span>Start Order in POS</span>
            </Button>
          )}

          {/* Unified Order & Dishes Item Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary">
                Order Dishes & Portions
              </h4>
              {table.activeOrders && table.activeOrders.length > 0 && (
                <span className="text-[11px] font-mono text-pos-primary font-bold">
                  #{table.activeOrders[0].orderCode}
                </span>
              )}
            </div>

            {table.activeOrders && table.activeOrders.length > 0 ? (
              <div className="space-y-3">
                {table.activeOrders.map((ord, orderIdx) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-lg bg-pos-surface border border-pos-border text-xs space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-pos-text flex items-center gap-1.5 font-mono">
                        <Receipt size={14} className="text-pos-primary" />
                        {table.activeOrders && table.activeOrders.length > 1
                          ? `Round #${orderIdx + 1} (${ord.orderCode})`
                          : `Order #${ord.orderCode}`}
                      </span>
                      {getOrderStatusBadge(ord.status)}
                    </div>

                    {/* Ordered Items List */}
                    {ord.items && ord.items.length > 0 ? (
                      <div className="bg-pos-surface-subtle rounded-md p-2 space-y-1.5 border border-pos-border text-[11px]">
                        {ord.items.map(it => (
                          <div key={it.id} className="flex justify-between items-center text-pos-text">
                            <div className="min-w-0 pr-2">
                              <span className="font-semibold text-pos-text">
                                {it.quantity}x {it.itemName}
                              </span>
                              {it.variantName && (
                                <span className="text-[10px] text-pos-primary ml-1 font-medium">
                                  ({it.variantName})
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-medium text-pos-text shrink-0">
                              {formatPrice(it.quantity * it.unitPrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-pos-text-muted italic">
                        No dishes listed on this ticket.
                      </p>
                    )}

                    <div className="flex items-center justify-between text-pos-text-muted pt-1.5 border-t border-pos-border text-xs">
                      <span>Sub-Total:</span>
                      <span className="font-bold font-mono text-pos-text">
                        {formatPrice(ord.totalAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-pos-text-muted bg-pos-surface-subtle rounded-lg border border-dashed border-pos-border">
                No active orders on this table. Click "Start Order in POS" above to seat guests.
              </div>
            )}
          </div>

          {/* Operational Status Quick Change */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-2">
              Update Table Status
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map(opt => {
                const isCurrent = table.status === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleStatusChange(opt.id)}
                    disabled={updateStatusMutation.isPending}
                    className={cn(
                      'p-2 rounded-lg border text-xs font-medium transition-colors text-left flex items-center gap-2 min-h-[38px]',
                      isCurrent
                        ? 'border-pos-primary bg-pos-primary-soft text-pos-primary font-semibold ring-1 ring-pos-primary'
                        : 'border-pos-border bg-pos-surface text-pos-text-secondary hover:text-pos-text hover:bg-pos-surface-subtle'
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transfer Action */}
          <div className="pt-2 border-t border-pos-border">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsTransferModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold"
            >
              <ArrowRightLeft size={15} />
              <span>Transfer / Merge Table</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Transfer / Merge Modal */}
      {isTransferModalOpen && (
        <TableTransferModal
          sourceTable={table}
          zones={allZones}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={() => {
            setIsTransferModalOpen(false);
            onRefresh();
            onClose();
          }}
        />
      )}

      {/* View Bill / Receipt Preview Modal */}
      {viewingReceiptOrderId && (
        <BillReceiptModal
          orderId={viewingReceiptOrderId.id}
          orderCode={viewingReceiptOrderId.code}
          onClose={() => setViewingReceiptOrderId(null)}
          onSettleBill={() => {
            const orderIdToSettle = viewingReceiptOrderId.id;
            setViewingReceiptOrderId(null);
            handleSettleOrder(orderIdToSettle);
          }}
        />
      )}

      {/* Settle Bill / Payment Modal */}
      {payingOrder && (
        <PaymentModal
          order={payingOrder}
          currency={currency}
          onClose={() => setPayingOrder(null)}
          onPaymentSuccess={(result) => {
            setPayingOrder(null);
            setCompletedPaymentResult(result);
            onRefresh();
          }}
        />
      )}

      {/* Official Payment Success & Tax Receipt Modal */}
      {completedPaymentResult && (
        <OrderSuccessModal
          result={completedPaymentResult}
          currency={currency}
          onNewSale={() => {
            setCompletedPaymentResult(null);
            onClose();
          }}
        />
      )}
    </>
  );
};
