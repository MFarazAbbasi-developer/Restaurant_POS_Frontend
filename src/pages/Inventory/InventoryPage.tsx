import React from 'react';
import { Boxes } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const InventoryPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="Stock & Inventory Management"
      subtitle="Raw ingredient stock levels, stock locations, recipe ingredient mapping, wastage logs, and physical adjustments."
      icon={Boxes}
      apiPrefix="/api/v1/inventory"
      permissionKey="inventory.view"
      features={[
        'Real-time raw ingredient on-hand stock balances',
        'Multi-location stock management (Main Store, Kitchen, Bar)',
        'Menu item recipe ingredient mapping for auto-deduction',
        'Physical stock count adjustment audits with manager authorization',
        'Spoilage, expiration, and wastage recording with reason codes',
        'Low-stock threshold alerts and reorder quantity warnings',
      ]}
    />
  );
};
