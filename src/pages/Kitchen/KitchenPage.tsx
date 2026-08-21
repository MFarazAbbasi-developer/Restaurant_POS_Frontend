import React from 'react';
import { ChefHat } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const KitchenPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="Kitchen Display System (KDS)"
      subtitle="Real-time prep tickets, kitchen station routing (Grill, Fryer, Drinks), order bumping, and elapsed timers."
      icon={ChefHat}
      apiPrefix="/api/v1/kitchen"
      permissionKey="kitchen.view"
      features={[
        'Live kitchen station ticket stream powered by WebSocket',
        'Station routing by item category (Bar, Grill, Main Kitchen)',
        'Item-level and order-level prep status toggling',
        'Elapsed prep time alert colors (Normal, Warning, Overdue)',
        'Touch bump bar & hardware keyboard shortcut bumping',
        'Recall recently completed KOT tickets',
      ]}
    />
  );
};
