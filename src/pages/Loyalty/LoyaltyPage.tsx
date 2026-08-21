import React from 'react';
import { Award } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const LoyaltyPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="Loyalty & Customer Rewards Program"
      subtitle="Points accumulation rules, tier levels (Bronze, Silver, Gold), checkout redemptions, and manual adjustments."
      icon={Award}
      apiPrefix="/api/v1/loyalty"
      permissionKey="loyalty.view"
      features={[
        'Configurable points earn rate (e.g. 1 point per $10 spent)',
        'Tier level benefits (Bronze, Silver, Gold, Platinum) & multipliers',
        'Direct points balance redemption discount during order checkout',
        'Customer points transaction ledger (Earned, Redeemed, Expired)',
        'Manager authorized manual points adjustments with audit reason',
        'Loyalty member engagement and retention analytics',
      ]}
    />
  );
};
