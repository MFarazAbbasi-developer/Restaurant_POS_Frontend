import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Package,
  Truck,
  ChefHat,
  Banknote,
  BookOpen,
  Boxes,
  FileSpreadsheet,
  Receipt,
  Users,
  CalendarDays,
  Tag,
  Award,
  BarChart3,
  UserCog,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItemConfig {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
  permissionKey?: string;
  badge?: string;
}

export interface NavGroupConfig {
  groupId: string;
  groupLabel: string;
  items: NavItemConfig[];
}

export const NAVIGATION_GROUPS: NavGroupConfig[] = [
  {
    groupId: 'operations',
    groupLabel: 'POS Operations',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/',
        icon: LayoutDashboard,
        description: 'Terminal status, quick shortcuts, and shift summary',
      },
      {
        id: 'orders',
        label: 'POS Register',
        path: '/orders',
        icon: ShoppingBag,
        description: 'Create & manage active customer sales orders',
        permissionKey: 'orders.view',
      },
      {
        id: 'tables',
        label: 'Floor & Tables',
        path: '/tables',
        icon: UtensilsCrossed,
        description: 'Dine-in floor plan, seating zones, and active table bills',
        permissionKey: 'tables.view',
      },
      {
        id: 'takeaway',
        label: 'Takeaway Queue',
        path: '/takeaway',
        icon: Package,
        description: 'Counter takeaway token numbers and order queue',
        permissionKey: 'orders.view',
      },
      {
        id: 'delivery',
        label: 'Delivery & Dispatch',
        path: '/delivery',
        icon: Truck,
        description: 'Delivery orders, rider assignment, and dispatch queue',
        permissionKey: 'delivery.view',
      },
      {
        id: 'kitchen',
        label: 'Kitchen Display',
        path: '/kitchen',
        icon: ChefHat,
        description: 'Live KDS active tickets, bump queue, and prep stations',
        permissionKey: 'kitchen.view',
      },
    ],
  },
  {
    groupId: 'management',
    groupLabel: 'Store Management',
    items: [
      {
        id: 'shifts',
        label: 'Payments & Shifts',
        path: '/shifts',
        icon: Banknote,
        description: 'Register shift management, cash drops, and payment logs',
        permissionKey: 'shifts.view',
      },
      {
        id: 'menu',
        label: 'Menu & Pricing',
        path: '/menu',
        icon: BookOpen,
        description: 'Menu categories, variants, and modifier group catalog',
        permissionKey: 'menu.view',
      },
      {
        id: 'inventory',
        label: 'Stock & Inventory',
        path: '/inventory',
        icon: Boxes,
        description: 'Ingredient stock levels, wastage logs, and adjustments',
        permissionKey: 'inventory.view',
      },
      {
        id: 'customers',
        label: 'Customer Directory',
        path: '/customers',
        icon: Users,
        description: 'Customer profiles, delivery addresses, and order history',
        permissionKey: 'customer.view',
      },
      {
        id: 'reservations',
        label: 'Reservations',
        path: '/reservations',
        icon: CalendarDays,
        description: 'Table bookings, guest schedules, and confirmations',
        permissionKey: 'reservations.view',
      },
    ],
  },
  {
    groupId: 'administration',
    groupLabel: 'Back Office & Admin',
    items: [
      {
        id: 'purchasing',
        label: 'Purchasing & Suppliers',
        path: '/purchasing',
        icon: FileSpreadsheet,
        description: 'Purchase orders, supplier catalogs, and receiving logs',
        permissionKey: 'purchasing.view',
      },
      {
        id: 'expenses',
        label: 'Expenses & Petty Cash',
        path: '/expenses',
        icon: Receipt,
        description: 'Operational expenses and petty cash disbursement logs',
        permissionKey: 'expenses.view',
      },
      {
        id: 'promotions',
        label: 'Discounts & Promos',
        path: '/promotions',
        icon: Tag,
        description: 'Discount campaigns, coupon codes, and pricing rules',
        permissionKey: 'promotions.view',
      },
      {
        id: 'loyalty',
        label: 'Loyalty Rewards',
        path: '/loyalty',
        icon: Award,
        description: 'Customer points balances, tier rules, and redemptions',
        permissionKey: 'loyalty.view',
      },
      {
        id: 'reports',
        label: 'Reports & Analytics',
        path: '/reports',
        icon: BarChart3,
        description: 'Business intelligence, end-of-day sales, and exports',
        permissionKey: 'reports.view',
      },
      {
        id: 'staff',
        label: 'Staff & Roles',
        path: '/staff',
        icon: UserCog,
        description: 'Staff directory, PIN assignment, and role permissions',
        permissionKey: 'users.view',
      },
      {
        id: 'settings',
        label: 'Restaurant Settings',
        path: '/settings',
        icon: Settings,
        description: 'Store parameters, tax rules, receipts, and POS hardware',
        permissionKey: 'settings.view',
      },
    ],
  },
];
