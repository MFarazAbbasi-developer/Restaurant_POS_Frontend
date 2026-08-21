import React from 'react';
import { Users } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const CustomersPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="Customer Directory & CRM"
      subtitle="Customer profiles, phone lookup, multiple saved delivery addresses, and lifetime visit history."
      icon={Users}
      apiPrefix="/api/v1/customers"
      permissionKey="customer.view"
      features={[
        'Fast phone number search for inbound calls & WhatsApp orders',
        'Customer profiles with dietary preferences & delivery notes',
        'Multiple saved addresses tagged with delivery zones',
        'Lifetime spend, visit count, and average order value metrics',
        'Linked loyalty rewards balance & transaction history',
        'Direct order initialization for returning customers',
      ]}
    />
  );
};
