import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const TablesPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="Dine-In Floor & Tables Management"
      subtitle="Visual dining floor layout, seating zones, active table status, and table-order linking."
      icon={UtensilsCrossed}
      apiPrefix="/api/v1/tables & /api/v1/zones"
      permissionKey="tables.view"
      features={[
        'Interactive floor zone maps (Main Dining, Terrace, VIP)',
        'Live table states (Available, Occupied, Bill Printed, Cleaning)',
        'Table order opening & sub-bill management',
        'Table merging, table transfers & split tables',
        'Real-time seating occupancy timers',
        'Guest count & server assignment tracking',
      ]}
    />
  );
};
