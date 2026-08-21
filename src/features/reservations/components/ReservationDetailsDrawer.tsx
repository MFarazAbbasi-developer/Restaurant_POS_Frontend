import React from 'react';
import { ReservationRecord } from '@/types';
import { useUpdateReservationStatusMutation } from '../hooks/useReservationData';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  X,
  CalendarCheck,
  User,
  Phone,
  Mail,
  Users,
  Clock,
  Calendar,
  Grid,
  FileText,
  Edit2,
  CheckCircle2,
  Ban,
  UserX,
  Sparkles,
} from 'lucide-react';

interface ReservationDetailsDrawerProps {
  reservation: ReservationRecord;
  onClose: () => void;
  onEdit: (reservation: ReservationRecord) => void;
  onAssignTable: (reservation: ReservationRecord) => void;
  onCancel: (reservation: ReservationRecord) => void;
  onSuccess: () => void;
}

export const ReservationDetailsDrawer: React.FC<ReservationDetailsDrawerProps> = ({
  reservation,
  onClose,
  onEdit,
  onAssignTable,
  onCancel,
  onSuccess,
}) => {
  const updateStatusMutation = useUpdateReservationStatusMutation();

  const handleStatusChange = async (
    status: 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'NO_SHOW'
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: reservation.id,
        payload: { status },
      });
      onSuccess();
    } catch {
      // handled
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <Badge variant="success" className="text-[10px]">
            Confirmed
          </Badge>
        );
      case 'SEATED':
        return (
          <Badge variant="default" className="text-[10px] bg-pos-accent text-white">
            Seated
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="warning" className="text-[10px]">
            Pending Hold
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="success" className="text-[10px]">
            Completed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" className="text-[10px]">
            Cancelled
          </Badge>
        );
      case 'NO_SHOW':
        return (
          <Badge variant="danger" className="text-[10px]">
            No-Show
          </Badge>
        );
      default:
        return (
          <Badge variant="default" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  const formattedDate = new Date(reservation.reservationDate).toLocaleDateString(
    undefined,
    { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
  );

  const startTimeStr = new Date(reservation.startTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const endTimeStr = new Date(reservation.endTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-pos-surface border-l border-pos-border shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pos-accent/15 border border-pos-accent/30 text-pos-accent flex items-center justify-center">
              <CalendarCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-pos-text font-mono">
                  #{reservation.reservationCode}
                </h3>
                {getStatusBadge(reservation.status)}
              </div>
              <p className="text-xs text-pos-text-muted mt-0.5 font-medium">
                {reservation.customerName} • {reservation.guestCount} Guests
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(reservation.status) && (
              <button
                type="button"
                onClick={() => onEdit(reservation)}
                className="p-2 rounded-xl text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
                title="Edit booking"
                aria-label="Edit booking"
              >
                <Edit2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-colors"
              aria-label="Close drawer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Quick Lifecycle Action Bar */}
          {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(reservation.status) && (
            <div className="p-3.5 rounded-2xl bg-pos-bg border border-pos-border space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pos-text-muted block">
                Reservation Actions
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {reservation.status === 'PENDING' && (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={updateStatusMutation.isPending}
                    onClick={() => handleStatusChange('CONFIRMED')}
                    className="font-bold text-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    <span>Confirm Booking</span>
                  </Button>
                )}

                {(reservation.status === 'CONFIRMED' ||
                  reservation.status === 'PENDING') && (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={updateStatusMutation.isPending}
                    onClick={() => handleStatusChange('SEATED')}
                    className="font-bold text-xs flex items-center gap-1.5 bg-pos-accent text-white shadow-xs"
                  >
                    <Sparkles size={14} />
                    <span>Seat Guests Now</span>
                  </Button>
                )}

                {reservation.status === 'SEATED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={updateStatusMutation.isPending}
                    onClick={() => handleStatusChange('COMPLETED')}
                    className="font-bold text-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    <span>Mark Dining Completed</span>
                  </Button>
                )}

                {reservation.status === 'CONFIRMED' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={updateStatusMutation.isPending}
                    onClick={() => handleStatusChange('NO_SHOW')}
                    className="text-xs font-semibold text-pos-danger hover:bg-pos-danger/10 flex items-center gap-1.5"
                  >
                    <UserX size={14} />
                    <span>No-Show</span>
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onAssignTable(reservation)}
                  className="text-xs font-semibold flex items-center gap-1.5"
                >
                  <Grid size={14} />
                  <span>{reservation.tableId ? 'Change Table' : 'Assign Table'}</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onCancel(reservation)}
                  className="text-xs font-semibold text-pos-danger hover:bg-pos-danger/10 flex items-center gap-1.5"
                >
                  <Ban size={14} />
                  <span>Cancel</span>
                </Button>
              </div>
            </div>
          )}

          {/* Timing & Party Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-pos-surface border border-pos-border">
              <span className="text-[10px] text-pos-text-muted flex items-center gap-1 font-semibold uppercase">
                <Calendar size={11} /> Date
              </span>
              <span className="text-xs font-bold text-pos-text mt-1 block">
                {formattedDate}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-pos-surface border border-pos-border">
              <span className="text-[10px] text-pos-text-muted flex items-center gap-1 font-semibold uppercase">
                <Clock size={11} /> Time Window
              </span>
              <span className="text-xs font-bold text-pos-text mt-1 block font-mono">
                {startTimeStr} - {endTimeStr}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-pos-surface border border-pos-border">
              <span className="text-[10px] text-pos-text-muted flex items-center gap-1 font-semibold uppercase">
                <Users size={11} /> Party Size
              </span>
              <span className="text-xs font-bold text-pos-text mt-1 block font-mono">
                {reservation.guestCount} Guests ({reservation.durationMinutes}m)
              </span>
            </div>
          </div>

          {/* Table & Seating Status */}
          <div className="p-4 rounded-2xl bg-pos-bg border border-pos-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-pos-text flex items-center gap-1.5">
                <Grid size={14} className="text-pos-accent" />
                <span>Assigned Table</span>
              </span>

              {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(reservation.status) && (
                <button
                  type="button"
                  onClick={() => onAssignTable(reservation)}
                  className="text-xs text-pos-accent hover:underline font-bold"
                >
                  {reservation.table ? 'Reassign' : '+ Assign Table'}
                </button>
              )}
            </div>

            {reservation.table ? (
              <div className="p-3 rounded-xl bg-pos-surface border border-pos-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-black text-sm text-pos-text block">
                    Table {reservation.table.name}
                  </span>
                  <span className="text-[11px] text-pos-text-muted">
                    Zone: {reservation.table.zone?.name || 'Floor'}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-pos-text font-bold">
                    Capacity: {reservation.table.capacity} guests
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-pos-surface border border-pos-border text-xs text-pos-text-muted">
                No floor table assigned yet. Guest will be assigned upon arrival.
              </div>
            )}
          </div>

          {/* Guest Contact Details */}
          <div className="p-4 rounded-2xl bg-pos-bg border border-pos-border space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-pos-text flex items-center gap-1.5">
              <User size={14} className="text-pos-accent" />
              <span>Guest Information</span>
            </span>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-pos-text">
                <User size={14} className="text-pos-text-muted" />
                <span className="font-semibold">{reservation.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-pos-text font-mono">
                <Phone size={14} className="text-pos-text-muted" />
                <span>{reservation.customerPhone}</span>
              </div>
              {reservation.customerEmail && (
                <div className="flex items-center gap-2 text-pos-text font-mono">
                  <Mail size={14} className="text-pos-text-muted" />
                  <span>{reservation.customerEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Special Requests */}
          {reservation.specialRequests && (
            <div className="p-3.5 rounded-xl bg-pos-bg border border-pos-border space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pos-text-muted flex items-center gap-1">
                <FileText size={12} /> Special Requests & Occasion
              </span>
              <p className="text-xs text-pos-text font-medium">
                {reservation.specialRequests}
              </p>
            </div>
          )}

          {/* Cancellation Reason */}
          {reservation.cancelReason && (
            <div className="p-3.5 rounded-xl bg-pos-danger/10 border border-pos-danger/30 space-y-1 text-xs">
              <span className="font-bold text-pos-danger block">
                Cancellation Reason:
              </span>
              <p className="text-pos-text">{reservation.cancelReason}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pos-border bg-pos-header flex items-center justify-end shrink-0">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
