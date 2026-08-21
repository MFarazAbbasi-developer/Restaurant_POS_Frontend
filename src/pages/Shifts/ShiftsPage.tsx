import React from 'react';
import { Banknote } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const ShiftsPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="Payments & Register Shift Management"
      subtitle="Cash drawer opening/closing floats, register shifts, cash drops, and payment transaction logs."
      icon={Banknote}
      apiPrefix="/api/v1/shifts & /api/v1/payments"
      permissionKey="shifts.view"
      features={[
        'Shift opening float declaration & cash drawer initialization',
        'Mid-shift cash drop & petty cash disbursements',
        'Payment method breakdown (Cash, Card, QR, Online, Gift Card)',
        'Shift close blind count reconciliation with variance calculation',
        'End-of-Shift Z-Report generation & thermal slip print',
        'Historical cashier shift audit trail',
      ]}
    />
  );
};
