import React from 'react';
import { Package } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const TakeawayPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="Takeaway Management & Token Queue"
      subtitle="Counter takeaway orders, auto-increment daily token sequences, pickup notifications, and ready queues."
      icon={Package}
      apiPrefix="/api/v1/takeaway"
      permissionKey="orders.view"
      features={[
        'Daily reset token number generation (e.g. Token #101)',
        'Customer phone number & name lookup for rapid ordering',
        'Pay on pickup authorization flag for verified customers',
        'Takeaway queue status board (Pending -> Preparing -> Ready)',
        'Customer SMS / WhatsApp ready notification dispatch',
        'Fast counter checkout & receipt printing integration',
      ]}
    />
  );
};
