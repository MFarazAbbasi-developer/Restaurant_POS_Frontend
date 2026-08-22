import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PosTable, PosZone, TableStatus, OrderRecord } from '@/types';
import {
  useUpdateTableStatusMutation,
  useCreateTableOrderMutation,
} from '@/features/orders/hooks/usePosData';
import { useCartStore } from '@/features/orders/store/cartStore';
import { OrdersApi } from '@/core/api/ordersApi';
import { PaymentModal } from '@/features/orders/components/PaymentModal';
import { BillReceiptModal } from '@/components/receipts/BillReceiptModal';
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
  FileText,
} from 'lucide-react';
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
  currency = 'USD',
  onClose,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const updateStatusMutation = useUpdateTableStatusMutation();
  const createTableOrderMutation = useCreateTableOrderMutation();
  const { setSelectedTable, setOrderType } = useCartStore();

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<OrderRecord | null>(null);
  const [viewingReceiptOrderId, setViewingReceiptOrderId] = useState<{ id: string; code: string } | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const getStatusBadge = (status: PosTable['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="success">Available</Badge>;
      case 'OCCUPIED':
        return <Badge variant="warning">Occupied</Badge>;
      case 'BILL_PRINTED':
        return <Badge variant="info">Bill Printed</Badge>;
      case 'RESERVED':
        return <Badge variant="default">Reserved</Badge>;
      case 'CLEANING':
        return <Badge variant="danger">Cleaning</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'SERVED':
        return (
          <Badge variant="success" size="sm" className="flex items-center gap-1">
            <CheckCircle2 size={11} /> Food Served
          </Badge>
        );
      case 'READY':
        return (
          <Badge variant="info" size="sm" className="flex items-center gap-1 bg-purple-500/15 text-purple-600 border-purple-300">
            <Sparkles size={11} /> Ready
          </Badge>
        );
      case 'PREPARING':
        return (
          <Badge variant="warning" size="sm" className="flex items-center gap-1">
            <ChefHat size={11} /> In Kitchen
          </Badge>
        );
      case 'BILL_PRINTED':
        return (
          <Badge variant="info" size="sm" className="flex items-center gap-1">
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
      const msg = err instanceof Error ? err.message : 'Failed to fetch order details for settlement';
      setErrorMessage(msg);
    } finally {
      setIsLoadingOrder(false);
    }
  };

  // 3. Action: Create New Sub-bill / Order
  const handleCreateSubBill = async () => {
    setErrorMessage(null);
    try {
      await createTableOrderMutation.mutateAsync({
        tableId: table.id,
        payload: {
          guestCount: 1,
          subBillName: `Bill #${(table.activeOrders?.length || 0) + 1}`,
        },
      });
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create sub-bill';
      setErrorMessage(msg);
    }
  };

  // 4. Action: Change Table Operational Status
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
      <div className="w-full lg:w-96 flex flex-col bg-pos-surface border border-pos-border rounded-lg shadow-dropdown overflow-hidden shrink-0">
        {/* Drawer Header */}
        <div className="p-4 border-b border-pos-border bg-pos-surface flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-pos-text">{table.name}</h3>
              {getStatusBadge(table.status)}
            </div>
            <p className="text-xs text-pos-text-muted mt-0.5">
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Table Summary Financial Card */}
          <div className="p-3.5 rounded-xl bg-pos-surface-subtle border border-pos-border flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted">
                Active Table Bill
              </span>
              <p className="text-xl font-black text-pos-primary font-mono mt-0.5">
                {formatPrice(totalAmount)}
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="text-pos-text-muted">Guests Seated:</span>
              <p className="font-bold text-pos-text mt-0.5 font-mono">
                {totalGuests > 0 ? totalGuests : table.capacity} Persons
              </p>
            </div>
          </div>

          {/* Primary POS Action Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleOpenPOSRegister}
            className="w-full font-semibold flex items-center justify-center gap-2 shadow-xs"
          >
            <ShoppingBag size={18} />
            <span>Add Items in POS Register</span>
          </Button>

          {/* Active Orders List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary">
                Active Orders & Bills ({table.activeOrders?.length || 0})
              </h4>
              <button
                type="button"
                onClick={handleCreateSubBill}
                disabled={createTableOrderMutation.isPending}
                className="text-xs text-pos-primary hover:underline font-semibold flex items-center gap-1"
              >
                <Plus size={12} /> New Sub-Bill
              </button>
            </div>

            {table.activeOrders && table.activeOrders.length > 0 ? (
              <div className="space-y-3">
                {table.activeOrders.map(ord => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-xl bg-pos-surface border border-pos-border text-xs space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-pos-text flex items-center gap-1.5 font-mono">
                        <Receipt size={14} className="text-pos-primary" />#{ord.orderCode}
                      </span>
                      {getOrderStatusBadge(ord.status)}
                    </div>

                    {/* Items preview if available */}
                    {ord.items && ord.items.length > 0 && (
                      <div className="bg-pos-surface-subtle/70 rounded-lg p-2 space-y-1 border border-pos-border/60 text-[11px]">
                        {ord.items.map(it => (
                          <div key={it.id} className="flex justify-between text-pos-text">
                            <span className="font-medium">
                              {it.quantity}x {it.itemName}
                            </span>
                            <span className="font-mono text-pos-text-muted">
                              {formatPrice(it.quantity * it.unitPrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-pos-text-muted pt-2 border-t border-pos-border text-xs">
                      <span>{ord.guestCount} Guest(s)</span>
                      <span className="font-bold font-mono text-sm text-pos-primary">
                        {formatPrice(ord.totalAmount)}
                      </span>
                    </div>

                    {/* Action Buttons: View Bill & Settle Bill */}
                    <div className="pt-1 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          handleStatusChange('BILL_PRINTED');
                          setViewingReceiptOrderId({ id: ord.id, code: ord.orderCode });
                        }}
                        className="text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <FileText size={13} />
                        <span>View Bill</span>
                      </Button>

                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={isLoadingOrder}
                        onClick={() => handleSettleOrder(ord.id)}
                        className="text-xs font-bold flex items-center justify-center gap-1 bg-pos-success hover:bg-pos-success/90 text-white"
                      >
                        <CreditCard size={13} />
                        <span>Settle Bill</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-pos-text-muted bg-pos-surface-subtle/50 rounded-lg border border-dashed border-pos-border">
                No active orders on this table.
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
                      'p-2.5 rounded-lg border text-xs font-medium transition-colors text-left flex items-center gap-2 min-h-[40px]',
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
          onPaymentSuccess={() => {
            setPayingOrder(null);
            onRefresh();
            onClose();
          }}
        />
      )}
    </>
  );
};
