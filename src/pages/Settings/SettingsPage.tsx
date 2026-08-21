import React from 'react';
import { Settings } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const SettingsPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="Restaurant Configuration & POS Settings"
      subtitle="Store profile, currency, timezone, tax rates, receipt headers/footers, order types, and hardware peripherals."
      icon={Settings}
      apiPrefix="/api/v1/restaurant"
      permissionKey="settings.view"
      features={[
        'Restaurant legal details, phone number, address, and logo URL',
        'Currency symbol, formatting, and operational timezone configuration',
        'Sales tax rates, inclusive/exclusive calculation, and tax ID number',
        'Service charge rate configuration and dine-in applicability toggles',
        'Order channel activation (Dine-in, Takeaway, Delivery)',
        'Thermal receipt layout customizer with header/footer message templates',
      ]}
    />
  );
};
