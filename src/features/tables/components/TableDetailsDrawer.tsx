import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PosTable, PosZone, TableStatus } from '@/types';
import {
  useUpdateTableStatusMutation,
  useCreateTableOrderMutation,
} from '@/features/orders/hooks/usePosData';
import { useCartStore } from '@/features/orders/store/cartStore';
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

  // 1. Action: Launch POS Register for this table
  const handleOpenPOSRegister = () => {
    setSelectedTable({ id: table.id, name: table.name });
    setOrderType('DINE_IN');
    navigate('/orders');
  };

  // 2. Action: Create New Sub-bill / Order
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
      { id: 'CLEANING', label: 'Needs Cleaning', icon: Clock },
      { id: 'RESERVED', label: 'Reserve Table', icon: Users },
    ];

  return (
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
        <div className="p-3 rounded-lg bg-pos-surface-subtle border border-pos-border flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted">
              Accumulated Total
            </span>
            <p className="text-xl font-bold text-pos-primary font-mono mt-0.5">
              {formatPrice(totalAmount)}
            </p>
          </div>
          <div className="text-right text-xs">
            <span className="text-pos-text-muted">Active Guests:</span>
            <p className="font-bold text-pos-text mt-0.5 font-mono">
              {totalGuests} / {table.capacity}
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
          <span>Open in POS Register</span>
        </Button>

        {/* Active Sub-bills / Orders List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary">
              Active Orders & Sub-Bills ({table.activeOrders?.length || 0})
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
            <div className="space-y-2">
              {table.activeOrders.map(ord => (
                <div
                  key={ord.id}
                  className="p-3 rounded-lg bg-pos-surface border border-pos-border text-xs space-y-1.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-pos-text flex items-center gap-1.5">
                      <Receipt size={13} className="text-pos-primary" />#{ord.orderCode}
                    </span>
                    <Badge
                      variant={ord.status === 'BILL_PRINTED' ? 'info' : 'warning'}
                      size="sm"
                    >
                      {ord.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-pos-text-muted pt-1 border-t border-pos-border text-xs">
                    <span>
                      {ord.subBillName || 'Main Bill'} • {ord.guestCount}p
                    </span>
                    <span className="font-bold font-mono text-pos-text">
                      {formatPrice(ord.totalAmount)}
                    </span>
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
            variant="secondary"
            size="md"
            onClick={() => setIsTransferModalOpen(true)}
            className="w-full font-medium flex items-center justify-center gap-2 text-xs"
          >
            <ArrowRightLeft size={15} />
            <span>Transfer Table / Shift Orders</span>
          </Button>
        </div>
      </div>

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <TableTransferModal
          sourceTable={table}
          zones={allZones}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={() => {
            onRefresh();
            onClose();
          }}
        />
      )}
    </div>
  );
};
