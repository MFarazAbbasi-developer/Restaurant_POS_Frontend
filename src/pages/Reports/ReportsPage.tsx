import React from 'react';
import { BarChart3 } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const ReportsPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="Reporting & Business Analytics"
      subtitle="Comprehensive sales reports, product performance, hourly volume breakdowns, staff productivity, and CSV/PDF export."
      icon={BarChart3}
      apiPrefix="/api/v1/reports"
      permissionKey="reports.view"
      features={[
        'Daily end-of-day X/Z reports and sales breakdown by order type',
        'Top-selling menu items and category revenue contribution',
        'Hourly sales volume & peak dining rush analysis',
        'Staff cashier sales, discount volume, and void audit logs',
        'Payment method mix (Cash, Card, QR, Online) reconciliation',
        'Export reports to CSV and formatted printable PDF summaries',
      ]}
    />
  );
};
