import React from 'react';
import { PosTable } from '@/types';
import { Badge } from '@/components/ui/Badge';
import {
  Users,
  Receipt,
  Clock,
  CheckCircle2,
  Sparkles,
  Printer,
  UtensilsCrossed,
  AlertTriangle,
} from 'lucide-react';
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

  // Compute total active amount on this table
  const totalAmount =
    table.activeOrders?.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0) || 0;

  const totalGuestsSeated =
    table.activeOrders?.reduce((sum, ord) => sum + (ord.guestCount || 0), 0) || 0;

  const primaryOrder = table.activeOrders?.[0];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-3.5 rounded-lg border text-left transition-colors relative flex flex-col justify-between min-h-[135px] select-none shadow-xs group',
        isSelected
          ? 'border-pos-primary bg-pos-primary-soft/30 ring-1 ring-pos-primary shadow-sm'
          : table.status === 'OCCUPIED'
            ? 'border-pos-border bg-pos-surface hover:border-pos-border-strong hover:bg-pos-surface-subtle'
            : table.status === 'BILL_PRINTED'
              ? 'border-[#BFDBFE] bg-pos-info-soft/30 hover:border-pos-info hover:bg-pos-info-soft/50'
              : table.status === 'CLEANING'
                ? 'border-[#FECACA] bg-pos-danger-soft/30 hover:border-pos-danger hover:bg-pos-danger-soft/50'
                : 'border-pos-border bg-pos-surface hover:border-pos-border-strong hover:bg-pos-surface-subtle'
      )}
    >
      {/* Top Table Name & Status Badge */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-pos-text group-hover:text-pos-primary transition-colors leading-tight truncate">
              {table.name}
            </h3>
            <span className="text-[11px] text-pos-text-muted flex items-center gap-1 mt-0.5 font-medium">
              <Users size={12} className="shrink-0 text-pos-text-muted" />
              {totalGuestsSeated > 0 ? (
                <span className="font-semibold text-pos-text">
                  {totalGuestsSeated}/{table.capacity} Guests
                </span>
              ) : (
                <span>{table.capacity} Seats</span>
              )}
            </span>
          </div>
          <div className="shrink-0">{getStatusBadge(table.status)}</div>
        </div>
      </div>

      {/* Active Orders Info / Empty State */}
      <div className="pt-2.5 border-t border-pos-border/80 mt-2.5 flex items-end justify-between">
        {table.activeOrders && table.activeOrders.length > 0 ? (
          <>
            <div className="min-w-0 pr-1">
              <div className="flex items-center gap-1 text-[11px] font-bold font-mono text-pos-text truncate">
                <Receipt size={11} className="text-pos-primary shrink-0" />
                <span>
                  {table.activeOrders.length === 1
                    ? `#${primaryOrder?.orderCode}`
                    : `${table.activeOrders.length} Sub-bills`}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                {primaryOrder?.status === 'SERVED' ? (
                  <span className="text-[10px] text-pos-success font-semibold flex items-center gap-0.5">
                    ● Served
                  </span>
                ) : primaryOrder?.status === 'READY' ? (
                  <span className="text-[10px] text-purple-600 font-semibold flex items-center gap-0.5">
                    ● Ready
                  </span>
                ) : primaryOrder?.status === 'PREPARING' ? (
                  <span className="text-[10px] text-pos-warning font-semibold flex items-center gap-0.5">
                    ● In Kitchen
                  </span>
                ) : primaryOrder?.status === 'BILL_PRINTED' ? (
                  <span className="text-[10px] text-pos-info font-semibold flex items-center gap-0.5">
                    ● Bill Out
                  </span>
                ) : null}
              </div>
            </div>

            <span className="text-sm font-black font-mono text-pos-primary shrink-0">
              {formatPrice(totalAmount)}
            </span>
          </>
        ) : (
          <div className="flex items-center justify-between w-full text-xs text-pos-text-muted">
            <span className="text-[11px] font-medium">
              {table.status === 'AVAILABLE' ? (
                <span className="text-pos-success font-semibold flex items-center gap-1">
                  <Sparkles size={12} /> Ready to Seat
                </span>
              ) : table.status === 'CLEANING' ? (
                <span className="text-pos-danger font-semibold flex items-center gap-1">
                  <Clock size={12} /> Mark Clean
                </span>
              ) : (
                <span className="capitalize">{table.status.toLowerCase()}</span>
              )}
            </span>
          </div>
        )}
      </div>
    </button>
  );
};
