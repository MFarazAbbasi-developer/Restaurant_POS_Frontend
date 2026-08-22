import React, { useState } from 'react';
import {
  useReservationsQuery,
  useUpdateReservationStatusMutation,
} from '@/features/reservations/hooks/useReservationData';
import { ReservationRecord, ReservationStatus } from '@/types';
import { ReservationFormModal } from '@/features/reservations/components/ReservationFormModal';
import { AssignTableModal } from '@/features/reservations/components/AssignTableModal';
import { CancelReservationModal } from '@/features/reservations/components/CancelReservationModal';
import { ReservationDetailsDrawer } from '@/features/reservations/components/ReservationDetailsDrawer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  CalendarCheck,
  Clock,
  Users,
  Search,
  RotateCw,
  Plus,
  Phone,
  Grid,
  Ban,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const ReservationsPage: React.FC = () => {
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getTomorrowDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [dateFilterMode, setDateFilterMode] = useState<
    'TODAY' | 'TOMORROW' | 'ALL' | 'CUSTOM'
  >('TODAY');
  const [selectedStatus, setSelectedStatus] = useState<ReservationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawer State
  const [formModal, setFormModal] = useState<{
    open: boolean;
    reservation?: ReservationRecord | null;
  }>({ open: false });

  const [assignModalReservation, setAssignModalReservation] =
    useState<ReservationRecord | null>(null);

  const [cancelModalReservation, setCancelModalReservation] =
    useState<ReservationRecord | null>(null);

  const [selectedReservationForDrawer, setSelectedReservationForDrawer] =
    useState<ReservationRecord | null>(null);

  // Queries
  const {
    data: reservationsData,
    isLoading,
    isRefetching,
    refetch,
  } = useReservationsQuery({
    reservationDate: dateFilterMode !== 'ALL' ? selectedDate : undefined,
    status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
    search: searchQuery.trim() || undefined,
    limit: 100,
  });

  const updateStatusMutation = useUpdateReservationStatusMutation();

  const reservations = reservationsData?.reservations || [];

  // Metrics
  const todayCount = reservations.length;
  const confirmedCount = reservations.filter(r => r.status === 'CONFIRMED').length;
  const seatedCount = reservations.filter(r => r.status === 'SEATED').length;
  const totalGuests = reservations
    .filter(r => !['CANCELLED', 'NO_SHOW'].includes(r.status))
    .reduce((acc, r) => acc + r.guestCount, 0);

  const handleDateModeChange = (mode: 'TODAY' | 'TOMORROW' | 'ALL' | 'CUSTOM') => {
    setDateFilterMode(mode);
    if (mode === 'TODAY') {
      setSelectedDate(getTodayDateString());
    } else if (mode === 'TOMORROW') {
      setSelectedDate(getTomorrowDateString());
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <Badge variant="success" size="sm" className="text-[10px]">
            Confirmed
          </Badge>
        );
      case 'SEATED':
        return (
          <Badge variant="primary" size="sm" className="text-[10px]">
            Seated
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="warning" size="sm" className="text-[10px]">
            Pending Hold
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="success" size="sm" className="text-[10px]">
            Completed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" size="sm" className="text-[10px]">
            Cancelled
          </Badge>
        );
      case 'NO_SHOW':
        return (
          <Badge variant="danger" size="sm" className="text-[10px]">
            No-Show
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="sm" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden select-none -m-4 md:-m-6 p-3 sm:p-4 bg-pos-bg">
      {/* =========================================================================
          TOP HEADER BAR: Metrics & Quick Action CTAs
      ========================================================================= */}
      <div className="p-3 sm:p-3.5 border-b border-pos-border bg-pos-surface rounded-t-lg flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
            <CalendarCheck size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-pos-text">
                Reservations & Table Bookings
              </h2>
              <Badge variant="default" size="sm" className="text-[10px] font-mono">
                {todayCount} Bookings
              </Badge>
            </div>
            <p className="text-[11px] text-pos-text-muted mt-0.5 font-medium">
              Manage floor table bookings, guest arrivals, seating, and live availability
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="min-h-[36px] px-3 font-medium flex items-center gap-1.5"
          >
            <RotateCw size={14} className={isRefetching ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setFormModal({ open: true, reservation: null })}
            className="min-h-[36px] text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={16} />
            <span>+ New Reservation</span>
          </Button>
        </div>
      </div>

      {/* =========================================================================
          SUMMARY METRICS TILES
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 border-b border-pos-border bg-pos-surface shrink-0">
        <div className="p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary block">
            Bookings in View
          </span>
          <span className="text-base font-mono font-bold text-pos-text mt-0.5 block">
            {todayCount}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-success block">
            Confirmed Bookings
          </span>
          <span className="text-base font-mono font-bold text-pos-success mt-0.5 block">
            {confirmedCount}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-primary block">
            Currently Seated
          </span>
          <span className="text-base font-mono font-bold text-pos-primary mt-0.5 block">
            {seatedCount}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-pos-surface-subtle border border-pos-border">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary block">
            Total Expected Guests
          </span>
          <span className="text-base font-mono font-bold text-pos-text mt-0.5 block">
            {totalGuests} Guests
          </span>
        </div>
      </div>

      {/* =========================================================================
          DATE & STATUS FILTER TOOLBAR
      ========================================================================= */}
      <div className="p-3 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Date Presets & Custom Date Picker */}
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-pos-surface-subtle border border-pos-border flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => handleDateModeChange('TODAY')}
              className={cn(
                'px-2.5 py-1 rounded-md font-semibold transition-colors',
                dateFilterMode === 'TODAY'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleDateModeChange('TOMORROW')}
              className={cn(
                'px-2.5 py-1 rounded-md font-semibold transition-colors',
                dateFilterMode === 'TOMORROW'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => handleDateModeChange('ALL')}
              className={cn(
                'px-2.5 py-1 rounded-md font-semibold transition-colors',
                dateFilterMode === 'ALL'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              All Dates
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={e => {
              setSelectedDate(e.target.value);
              setDateFilterMode('CUSTOM');
            }}
            className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text font-mono font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
          />
        </div>

        {/* Status Filters & Search Bar */}
        <div className="flex items-center gap-2">
          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value as ReservationStatus | 'ALL')}
            className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SEATED">Seated</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No-Show</option>
          </select>

          {/* Search Bar */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search guest or code..."
              className="pl-8 pr-3 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text placeholder-pos-text-muted focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary w-44 sm:w-56 font-medium"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          RESERVATIONS CONTENT AREA
      ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-pos-bg border-x border-b border-pos-border rounded-b-lg">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
            <Spinner size="lg" />
            <span>Loading Reservations...</span>
          </div>
        ) : reservations.length === 0 ? (
          <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-3">
            <CalendarCheck size={40} className="text-pos-text-muted/40" />
            <p className="font-bold text-base text-pos-text">No Reservations Found</p>
            <p className="text-xs max-w-sm text-pos-text-secondary">
              {searchQuery || selectedStatus !== 'ALL'
                ? 'No bookings match your active status or search filter.'
                : 'No table reservations scheduled for the selected date.'}
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setFormModal({ open: true, reservation: null })}
              className="font-bold mt-2 shadow-xs"
            >
              + Create Reservation
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {reservations.map(res => {
              const startTimeStr = new Date(res.startTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const endTimeStr = new Date(res.endTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={res.id}
                  className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs hover:border-pos-primary/40 transition-colors flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Time & Status */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-pos-text">
                        <Clock size={13} className="text-pos-primary" />
                        <span>
                          {startTimeStr} - {endTimeStr}
                        </span>
                      </div>

                      {getStatusBadge(res.status)}
                    </div>

                    {/* Guest Name & Code */}
                    <div className="mb-2.5">
                      <h4 className="font-bold text-pos-text text-sm">
                        {res.customerName}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-pos-text-muted font-mono mt-0.5">
                        <span className="flex items-center gap-1 text-pos-primary font-bold">
                          <Phone size={11} /> {res.customerPhone}
                        </span>
                        <span>#{res.reservationCode}</span>
                      </div>
                    </div>

                    {/* Party & Table Details */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-md bg-pos-surface-subtle border border-pos-border text-xs mb-2.5">
                      <div>
                        <span className="text-[10px] text-pos-text-muted flex items-center gap-1 font-medium">
                          <Users size={11} /> Party Size
                        </span>
                        <span className="font-bold text-pos-text block mt-0.5 font-mono">
                          {res.guestCount} Guests
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-pos-text-muted flex items-center gap-1 font-medium">
                          <Grid size={11} /> Table
                        </span>
                        <span className="font-bold text-pos-text block mt-0.5">
                          {res.table ? `Table ${res.table.name}` : 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    {/* Special Requests */}
                    {res.specialRequests && (
                      <p className="text-[11px] text-pos-text-secondary line-clamp-1 italic mb-2">
                        "{res.specialRequests}"
                      </p>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-pos-border flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      {res.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: res.id,
                              payload: { status: 'SEATED' },
                            })
                          }
                          className="px-2.5 py-1 rounded-md bg-pos-primary text-white font-semibold text-[11px] hover:bg-pos-primary-hover transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <Sparkles size={12} />
                          <span>Seat</span>
                        </button>
                      )}

                      {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(res.status) && (
                        <button
                          type="button"
                          onClick={() => setAssignModalReservation(res)}
                          className="px-2 py-1 rounded-md bg-pos-surface border border-pos-border text-pos-text hover:text-pos-primary font-semibold text-[11px] transition-colors"
                        >
                          {res.table ? 'Reassign' : 'Assign'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedReservationForDrawer(res)}
                        className="text-xs font-semibold flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ChevronRight size={12} />
                      </Button>

                      {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(res.status) && (
                        <button
                          type="button"
                          onClick={() => setCancelModalReservation(res)}
                          className="p-1.5 rounded-md text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger-soft transition-colors"
                          title="Cancel booking"
                          aria-label="Cancel booking"
                        >
                          <Ban size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          INTERACTIVE MODALS & DRAWERS
      ========================================================================= */}
      {formModal.open && (
        <ReservationFormModal
          reservation={formModal.reservation}
          initialDate={selectedDate}
          onClose={() => setFormModal({ open: false, reservation: null })}
          onSuccess={() => refetch()}
        />
      )}

      {assignModalReservation && (
        <AssignTableModal
          reservation={assignModalReservation}
          onClose={() => setAssignModalReservation(null)}
          onSuccess={() => refetch()}
        />
      )}

      {cancelModalReservation && (
        <CancelReservationModal
          reservation={cancelModalReservation}
          onClose={() => setCancelModalReservation(null)}
          onSuccess={() => refetch()}
        />
      )}

      {selectedReservationForDrawer && (
        <ReservationDetailsDrawer
          reservation={selectedReservationForDrawer}
          onClose={() => setSelectedReservationForDrawer(null)}
          onEdit={r => {
            setSelectedReservationForDrawer(null);
            setFormModal({ open: true, reservation: r });
          }}
          onAssignTable={r => {
            setSelectedReservationForDrawer(null);
            setAssignModalReservation(r);
          }}
          onCancel={r => {
            setSelectedReservationForDrawer(null);
            setCancelModalReservation(r);
          }}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};

export default ReservationsPage;
