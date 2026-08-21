import React from 'react';
import { PosTable } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Users, Receipt, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';

interface TableCardProps {
  table: PosTable;
  currency?: string;
  isSelected?: boolean;
  onClick: () => void;
}

export const TableCard: React.FC<TableCardProps> = ({
  table,
  currency = 'USD',
  isSelected = false,
  onClick,
}) => {
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

  // Compute total active amount on this table
  const totalAmount =
    table.activeOrders?.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0) || 0;

  const totalGuestsSeated =
    table.activeOrders?.reduce((sum, ord) => sum + (ord.guestCount || 0), 0) || 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between min-h-[135px] shadow-sm select-none group',
        isSelected
          ? 'border-pos-accent bg-pos-accent/15 ring-2 ring-pos-accent shadow-md'
          : 'border-pos-border bg-pos-surface hover:border-pos-accent/40 hover:bg-pos-surface-hover active:scale-[0.98]'
      )}
    >
      {/* Top Table Name & Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-black text-pos-text group-hover:text-pos-accent transition-colors leading-tight">
            {table.name}
          </h3>
          <span className="text-[11px] text-pos-text-muted flex items-center gap-1 mt-0.5 font-medium">
            <Users size={12} /> {table.capacity} Seats
          </span>
        </div>
        {getStatusBadge(table.status)}
      </div>

      {/* Active Orders Info / Empty State */}
      <div className="pt-2 border-t border-pos-border/40 mt-3 flex items-end justify-between">
        {table.activeOrders && table.activeOrders.length > 0 ? (
          <>
            <div>
              <span className="text-[10px] uppercase font-bold text-pos-text-muted flex items-center gap-1">
                <Receipt size={11} />
                {table.activeOrders.length === 1
                  ? `#${table.activeOrders[0].orderCode}`
                  : `${table.activeOrders.length} Sub-bills`}
              </span>
              {totalGuestsSeated > 0 && (
                <span className="text-[10px] text-pos-text-muted">
                  {totalGuestsSeated} guest(s)
                </span>
              )}
            </div>

            <span className="text-sm font-black font-mono text-pos-accent">
              {formatPrice(totalAmount)}
            </span>
          </>
        ) : (
          <div className="flex items-center justify-between w-full text-[11px] text-pos-text-muted">
            <span className="italic">
              {table.status === 'AVAILABLE'
                ? 'Ready for seating'
                : table.status.toLowerCase()}
            </span>
            {table.status === 'CLEANING' && (
              <Clock size={12} className="text-pos-danger" />
            )}
          </div>
        )}
      </div>
    </button>
  );
};
