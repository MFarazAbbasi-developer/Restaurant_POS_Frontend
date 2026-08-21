import React from 'react';
import { Receipt } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const ExpensesPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="Expenses & Petty Cash Management"
      subtitle="Operational expenditure logs, expense categories (Utilities, Supplies, Staff Meals), and cash drawer payouts."
      icon={Receipt}
      apiPrefix="/api/v1/expenses"
      permissionKey="expenses.view"
      features={[
        'Operational expense categories & tax classification',
        'Direct petty cash drawer disbursements during active shifts',
        'Expense receipt image attachment & payment voucher logging',
        'Manager void & reversal workflow with audit logging',
        'Daily & monthly expense analytics vs revenue comparison',
        'Expense export to PDF/CSV for accounting integration',
      ]}
    />
  );
};
