import React from 'react';
import { Truck } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const DeliveryPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="Delivery & Dispatch Management"
      subtitle="Direct delivery orders, delivery zones, rider assignment, delivery settlements, and aggregator integration."
      icon={Truck}
      apiPrefix="/api/v1/delivery"
      permissionKey="delivery.view"
      features={[
        'Phone-in customer search & saved address picker',
        'Delivery zones with automatic delivery charges calculation',
        'Rider assignment queue (Pending -> Dispatched -> Delivered)',
        'Rider cash collection & shift-end settlement reconciliation',
        'Aggregator tagging (FoodPanda, UberEats, Deliveroo)',
        'Delivery time estimation & dispatch tracking',
      ]}
    />
  );
};
