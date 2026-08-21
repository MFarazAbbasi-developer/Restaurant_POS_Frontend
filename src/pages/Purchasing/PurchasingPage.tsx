import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const PurchasingPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="Purchasing & Supplier Management"
      subtitle="Purchase orders, supplier profiles, goods receiving logs, purchase returns, and supplier payment terms."
      icon={FileSpreadsheet}
      apiPrefix="/api/v1/purchasing"
      permissionKey="purchasing.view"
      features={[
        'Supplier catalog directory with contact details & payment terms',
        'Purchase order creation with line items, units, and unit costs',
        'Goods receiving workflow with batch numbers and expiry dates',
        'Supplier invoice matching & payment record tracking',
        'Purchase return recording for defective or incorrect shipments',
        'Procurement history & supplier purchase analytics',
      ]}
    />
  );
};
