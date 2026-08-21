import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/core/auth/authStore';
import { usePermissions } from '@/core/auth/usePermissions';
import { env } from '@/config/env';
import {
  LayoutDashboard,
  ShieldCheck,
  UserCheck,
  Key,
  Lock,
  ShoppingBag,
  UtensilsCrossed,
  Package,
  Truck,
  ChefHat,
  Banknote,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user, terminal } = useAuthStore();
  const { roles, permissions, hasPermission } = usePermissions();

  const restaurantName =
    user && 'restaurant' in user && user.restaurant?.name
      ? user.restaurant.name
      : 'Faraz Flagship Bistro';

  const quickShortcuts = [
    {
      title: 'POS Register',
      desc: 'Open order line & register',
      path: '/orders',
      icon: ShoppingBag,
      permission: 'orders.view',
    },
    {
      title: 'Floor & Tables',
      desc: 'Dine-in floor status & seating',
      path: '/tables',
      icon: UtensilsCrossed,
      permission: 'tables.view',
    },
    {
      title: 'Takeaway Queue',
      desc: 'Quick pickup & counter orders',
      path: '/takeaway',
      icon: Package,
      permission: 'orders.view',
    },
    {
      title: 'Delivery Dispatch',
      desc: 'Rider queue & deliveries',
      path: '/delivery',
      icon: Truck,
      permission: 'delivery.view',
    },
    {
      title: 'Kitchen Display',
      desc: 'KDS station prep tickets',
      path: '/kitchen',
      icon: ChefHat,
      permission: 'kitchen.view',
    },
    {
      title: 'Register Shift',
      desc: 'Shift status & cash drops',
      path: '/shifts',
      icon: Banknote,
      permission: 'shifts.view',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="border-pos-accent/30 bg-pos-surface/60 backdrop-blur p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-pos-text">{restaurantName}</h2>
              <Badge variant="success">Authenticated</Badge>
            </div>
            <p className="text-xs text-pos-text-muted mt-1">
              Terminal register session active • {env.appName} Shell
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-pos-bg/80 border border-pos-border px-3 py-1.5 rounded-lg text-pos-text-muted">
              Terminal: {terminal?.terminalId || env.defaultTerminalId}
            </span>
          </div>
        </div>

        {/* Staff Identity & RBAC Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-pos-bg/80 border border-pos-border">
            <div className="flex items-center gap-2 text-xs text-pos-text-muted font-semibold uppercase">
              <UserCheck size={16} className="text-pos-accent" />
              Active Operator
            </div>
            <p className="text-base font-bold text-pos-text mt-2">
              {user?.name || 'Staff User'}
            </p>
            <p className="text-xs text-pos-text-muted mt-0.5 font-mono">
              @{user?.username}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-pos-bg/80 border border-pos-border">
            <div className="flex items-center gap-2 text-xs text-pos-text-muted font-semibold uppercase">
              <Lock size={16} className="text-pos-accent" />
              Assigned Roles
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {roles.map(role => (
                <Badge key={role} variant="default">
                  {role}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-pos-text-muted mt-2">Multi-tenant RBAC verified</p>
          </div>

          <div className="p-4 rounded-xl bg-pos-bg/80 border border-pos-border">
            <div className="flex items-center gap-2 text-xs text-pos-text-muted font-semibold uppercase">
              <Key size={16} className="text-pos-accent" />
              Permissions Catalog
            </div>
            <p className="text-base font-bold text-pos-text mt-2">
              {permissions.length} Granted Keys
            </p>
            <p className="text-xs text-pos-text-muted mt-0.5">
              Available for POS capability gates
            </p>
          </div>
        </div>

        {/* Quick Operations Navigation */}
        <div className="mt-8 pt-6 border-t border-pos-border/60">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-pos-text-muted mb-4 flex items-center gap-2">
            <LayoutDashboard size={14} className="text-pos-accent" />
            Quick Operational Modules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {quickShortcuts
              .filter(item => !item.permission || hasPermission(item.permission))
              .map(shortcut => {
                const Icon = shortcut.icon;
                return (
                  <Link
                    key={shortcut.path}
                    to={shortcut.path}
                    className="p-3.5 rounded-xl bg-pos-bg/80 hover:bg-pos-surface border border-pos-border hover:border-pos-accent/40 transition-all group flex items-start gap-3"
                  >
                    <div className="h-9 w-9 rounded-lg bg-pos-accent/10 border border-pos-accent/20 flex items-center justify-center text-pos-accent group-hover:scale-105 transition-transform shrink-0">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-pos-text group-hover:text-pos-accent transition-colors truncate">
                        {shortcut.title}
                      </p>
                      <p className="text-[11px] text-pos-text-muted mt-0.5 truncate">
                        {shortcut.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>

        {/* System & Architecture Integration Card */}
        <div className="mt-6 p-4 rounded-xl bg-pos-bg/50 border border-pos-border/70 flex items-start gap-3">
          <ShieldCheck size={20} className="text-pos-success shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-pos-text">
              Application Shell & Navigation Initialized
            </p>
            <p className="text-pos-text-muted mt-0.5 leading-relaxed">
              Permission-aware routing is active. All major restaurant domains have
              dedicated route placeholders ready for modular feature development.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
