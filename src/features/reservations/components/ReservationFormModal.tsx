import React, { useState } from 'react';
import { ReservationRecord, ReservationStatus } from '@/types';
import {
  useCreateReservationMutation,
  useUpdateReservationMutation,
  useReservationAvailabilityQuery,
} from '../hooks/useReservationData';
import { Button } from '@/components/ui/Button';
import {
  X,
  CalendarCheck,
  User,
  Phone,
  Mail,
  Users,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  CheckCircle2,
} from 'lucide-react';

interface ReservationFormModalProps {
  reservation?: ReservationRecord | null;
  initialDate?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReservationFormModal: React.FC<ReservationFormModalProps> = ({
  reservation,
  initialDate,
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(reservation);
  const createMutation = useCreateReservationMutation();
  const updateMutation = useUpdateReservationMutation();

  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [customerName, setCustomerName] = useState<string>(
    reservation?.customerName || ''
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    reservation?.customerPhone || ''
  );
  const [customerEmail, setCustomerEmail] = useState<string>(
    reservation?.customerEmail || ''
  );
  const [guestCount, setGuestCount] = useState<string>(
    reservation?.guestCount !== undefined ? reservation.guestCount.toString() : '2'
  );
  const [reservationDate, setReservationDate] = useState<string>(
    reservation?.reservationDate
      ? new Date(reservation.reservationDate).toISOString().split('T')[0]
      : initialDate || getTodayDateString()
  );
  const [startTime, setStartTime] = useState<string>(
    reservation?.startTime
      ? new Date(reservation.startTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : '19:00'
  );
  const [durationMinutes, setDurationMinutes] = useState<string>(
    reservation?.durationMinutes !== undefined
      ? reservation.durationMinutes.toString()
      : '90'
  );
  const [tableId, setTableId] = useState<string>(reservation?.tableId || '');
  const [specialRequests, setSpecialRequests] = useState<string>(
    reservation?.specialRequests || ''
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real-time table availability check
  const parsedGuests = parseInt(guestCount, 10) || 2;
  const parsedDuration = parseInt(durationMinutes, 10) || 90;

  const { data: availabilityData, isFetching: isCheckingAvailability } =
    useReservationAvailabilityQuery({
      reservationDate,
      startTime,
      durationMinutes: parsedDuration,
      guestCount: parsedGuests,
    });

  const availableTables = availabilityData?.availableTables || [];
  const unavailableTables = availabilityData?.unavailableTables || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMessage('Guest name is required.');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Guest phone number is required.');
      return;
    }
    if (!reservationDate) {
      setErrorMessage('Reservation date is required.');
      return;
    }
    if (!startTime) {
      setErrorMessage('Start time is required.');
      return;
    }
    if (parsedGuests < 1) {
      setErrorMessage('Party size must be at least 1 guest.');
      return;
    }

    setErrorMessage(null);

    try {
      if (isEditing && reservation) {
        await updateMutation.mutateAsync({
          id: reservation.id,
          payload: {
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail.trim() || null,
            guestCount: parsedGuests,
            reservationDate,
            startTime,
            durationMinutes: parsedDuration,
            tableId: tableId || null,
            specialRequests: specialRequests.trim() || null,
          },
        });
      } else {
        await createMutation.mutateAsync({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || null,
          guestCount: parsedGuests,
          reservationDate,
          startTime,
          durationMinutes: parsedDuration,
          tableId: tableId || null,
          status: 'CONFIRMED' as ReservationStatus,
          specialRequests: specialRequests.trim() || null,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save reservation';
      setErrorMessage(msg);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-pos-surface border border-pos-border rounded-xl shadow-modal flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-pos-border flex items-center justify-between bg-pos-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <CalendarCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pos-text">
                {isEditing ? 'Edit Table Reservation' : 'New Table Reservation'}
              </h3>
              <p className="text-xs text-pos-text-muted">
                {isEditing
                  ? `Update #${reservation?.reservationCode} booking parameters`
                  : 'Schedule guest booking with table assignment and duration'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar"
        >
          {errorMessage && (
            <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Guest Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Guest Name <span className="text-pos-danger">*</span>
              </label>
              <div className="relative">
                <User
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Sara Ahmed"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Contact Phone <span className="text-pos-danger">*</span>
              </label>
              <div className="relative">
                <Phone
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Email & Party Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="sara@example.com"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Party Size (Guests) <span className="text-pos-danger">*</span>
              </label>
              <div className="relative">
                <Users
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={guestCount}
                  onChange={e => setGuestCount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Date, Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Date <span className="text-pos-danger">*</span>
              </label>
              <div className="relative">
                <Calendar
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="date"
                  required
                  value={reservationDate}
                  onChange={e => setReservationDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Start Time <span className="text-pos-danger">*</span>
              </label>
              <div className="relative">
                <Clock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
                />
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
                Duration (Mins)
              </label>
              <select
                value={durationMinutes}
                onChange={e => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary shadow-xs"
              >
                <option value="45">45 mins</option>
                <option value="60">60 mins (1 hr)</option>
                <option value="90">90 mins (1.5 hr)</option>
                <option value="120">120 mins (2 hr)</option>
                <option value="180">180 mins (3 hr)</option>
              </select>
            </div>
          </div>

          {/* Table Selection with Live Availability */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary">
                Assign Floor Table (Optional)
              </label>
              {isCheckingAvailability ? (
                <span className="text-[10px] text-pos-text-muted animate-pulse font-medium">
                  Checking floor availability...
                </span>
              ) : availableTables.length > 0 ? (
                <span className="text-[10px] text-pos-success font-semibold flex items-center gap-1">
                  <CheckCircle2 size={11} /> {availableTables.length} tables available
                </span>
              ) : null}
            </div>

            <select
              value={tableId}
              onChange={e => setTableId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary font-medium shadow-xs"
            >
              <option value="">-- Assign Table Later (Walk-in Hold) --</option>
              <optgroup label="Available Tables (Fits Party Size)">
                {availableTables.map(t => (
                  <option key={t.id} value={t.id}>
                    Table {t.name} (Cap: {t.capacity} guests • {t.zone?.name || 'Floor'})
                  </option>
                ))}
              </optgroup>
              {unavailableTables.length > 0 && (
                <optgroup label="Unavailable / Insufficient Capacity">
                  {unavailableTables.map(t => (
                    <option key={t.id} value={t.id} disabled>
                      Table {t.name} (Cap: {t.capacity} • {t.reason})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pos-text-secondary mb-1.5">
              Special Requests / Occasion (Optional)
            </label>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-3 text-pos-text-muted" />
              <textarea
                rows={2}
                value={specialRequests}
                onChange={e => setSpecialRequests(e.target.value)}
                placeholder="e.g. Birthday celebration, window seat requested, high chair needed..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text placeholder-pos-text-muted text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none font-medium shadow-xs"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-pos-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isPending}
              disabled={!customerName.trim() || !customerPhone.trim()}
              className="font-bold shadow-xs"
            >
              {isEditing ? 'Save Changes' : 'Confirm Reservation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
