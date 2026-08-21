import React from 'react';
import { Tag } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const PromotionsPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="Discounts & Promotional Campaigns"
      subtitle="Promotional discount rules, coupon promo codes, category/item specific discounts, and usage limits."
      icon={Tag}
      apiPrefix="/api/v1/promotions"
      permissionKey="promotions.view"
      features={[
        'Discount rules (Percentage discount, Flat amount, Buy X Get Y)',
        'Coupon code verification and cashier quick-apply buttons',
        'Category-level & item-level promotional applicability constraints',
        'Minimum order amount and time-based active windows (Happy Hour)',
        'Per-customer and global usage frequency limit controls',
        'Promotional campaign redemption analytics and sales lift reports',
      ]}
    />
  );
};
