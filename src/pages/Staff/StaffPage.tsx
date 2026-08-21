import React from 'react';
import { UserCog } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const StaffPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="Staff & User Management"
      subtitle="Employee directory, touch login PINs, passwords, role assignments, and granular RBAC permissions."
      icon={UserCog}
      apiPrefix="/api/v1/staff"
      permissionKey="users.view"
      features={[
        'Staff employee profiles with phone, active status, and last login',
        'Secure 4-digit touch PIN setup and password reset workflow',
        'Role assignment (Owner, Manager, Cashier, Waiter, Kitchen, Delivery)',
        'Custom system roles and granular role-permission mapping editor',
        'Staff activity audit logs and session history',
        'Staff performance and shift scheduling overview',
      ]}
    />
  );
};
