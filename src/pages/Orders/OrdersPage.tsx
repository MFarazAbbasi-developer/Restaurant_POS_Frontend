import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const OrdersPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="POS Register & Sales Orders"
      subtitle="Main cashier order taking, item variant selection, modifier selection, and checkout pipeline."
      icon={ShoppingBag}
      apiPrefix="/api/v1/orders"
      permissionKey="orders.view"
      features={[
        'Interactive menu category & item selector grid',
        'Item variants, size selection & modifier groups',
        'Live order cart with subtotal, taxes, and service charges',
        'Order line item notes & cooking preferences',
        'Hold order, recall order & split billing',
        'Direct payment gateway / tender processing modal',
      ]}
    />
  );
};
