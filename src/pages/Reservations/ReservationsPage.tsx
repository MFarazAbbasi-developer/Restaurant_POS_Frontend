import React from 'react';
import { CalendarDays } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const ReservationsPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="Reservations & Table Bookings"
      subtitle="Guest booking calendar, time slot availability, table pre-assignment, and party size management."
      icon={CalendarDays}
      apiPrefix="/api/v1/reservations"
      permissionKey="reservations.view"
      features={[
        'Daily & weekly table reservation schedule timeline',
        'Time slot availability & maximum floor capacity check',
        'Guest party size, special occasion, and high chair requests',
        'Reservation status lifecycle (Confirmed -> Seated -> Completed / No-Show)',
        'Table pre-allocation linked to dining floor zones',
        'Customer phone booking lookup and SMS reminders',
      ]}
    />
  );
};
