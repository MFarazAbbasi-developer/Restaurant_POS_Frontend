import React from 'react';
import { BookOpen } from 'lucide-react';
import { DomainPlaceholder } from '@/components/common/DomainPlaceholder';

export const MenuPage: React.FC = () => {
  return (
    <DomainPlaceholder
      title="Menu & Catalog Management"
      subtitle="Food item categories, menu items, portion variants, modifier groups, and rapid 86 item availability toggles."
      icon={BookOpen}
      apiPrefix="/api/v1/menu"
      permissionKey="menu.view"
      features={[
        'Category tree hierarchy & custom drag-and-drop sort order',
        'Menu items with item code, English/Urdu names, and base pricing',
        'Portion variants with distinct prices (e.g. Small, Medium, Large)',
        'Modifier groups (Single / Multiple selection, min/max constraints)',
        'One-click item availability toggle (86 item out-of-stock)',
        'Bulk price update tool and tax rate assignment',
      ]}
    />
  );
};
