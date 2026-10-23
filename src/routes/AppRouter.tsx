import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { POSLayout } from '@/layouts/POSLayout';
import { NotFound } from '@/components/boundaries/NotFound';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { PublicRoute } from '@/routes/PublicRoute';
import { RequirePermission } from '@/routes/RequirePermission';
import { SetupGate } from '@/routes/SetupGate';

// Pages
import { LoginPage } from '@/pages/Login/LoginPage';
import { SetupPage } from '@/pages/Setup/SetupPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { OrdersPage } from '@/pages/Orders/OrdersPage';
import { TablesPage } from '@/pages/Tables/TablesPage';
import { TakeawayPage } from '@/pages/Takeaway/TakeawayPage';
import { DeliveryPage } from '@/pages/Delivery/DeliveryPage';
import { KitchenPage } from '@/pages/Kitchen/KitchenPage';
import { ShiftsPage } from '@/pages/Shifts/ShiftsPage';
import { MenuPage } from '@/pages/Menu/MenuPage';
import { InventoryPage } from '@/pages/Inventory/InventoryPage';
import { PurchasingPage } from '@/pages/Purchasing/PurchasingPage';
import { ExpensesPage } from '@/pages/Expenses/ExpensesPage';
import { CustomersPage } from '@/pages/Customers/CustomersPage';
import { ReservationsPage } from '@/pages/Reservations/ReservationsPage';
import { PromotionsPage } from '@/pages/Promotions/PromotionsPage';
import { LoyaltyPage } from '@/pages/Loyalty/LoyaltyPage';
import { ReportsPage } from '@/pages/Reports/ReportsPage';
import { StaffPage } from '@/pages/Staff/StaffPage';
import { SettingsPage } from '@/pages/Settings/SettingsPage';
import { LanTerminalsPage } from '@/pages/LanTerminals/LanTerminalsPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* First-run setup + public auth */}
      <Route element={<SetupGate />}>
        <Route path="/setup" element={<SetupPage />} />
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      {/* Protected POS Shell Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<POSLayout />}>
          {/* 1. Dashboard Overview */}
          <Route index element={<DashboardPage />} />

          {/* 2. Operations Modules */}
          <Route
            path="orders"
            element={
              <RequirePermission permissionKey="orders.create" moduleName="POS Register">
                <OrdersPage />
              </RequirePermission>
            }
          />
          <Route
            path="tables"
            element={
              <RequirePermission permissionKey="tables.view" moduleName="Floor & Tables">
                <TablesPage />
              </RequirePermission>
            }
          />
          <Route
            path="takeaway"
            element={
              <RequirePermission permissionKey="orders.view" moduleName="Takeaway Queue">
                <TakeawayPage />
              </RequirePermission>
            }
          />
          <Route
            path="delivery"
            element={
              <RequirePermission
                permissionKey="delivery.view"
                moduleName="Delivery Dispatch"
              >
                <DeliveryPage />
              </RequirePermission>
            }
          />
          <Route
            path="kitchen"
            element={
              <RequirePermission
                permissionKey="kitchen.view"
                moduleName="Kitchen Display"
              >
                <KitchenPage />
              </RequirePermission>
            }
          />

          {/* 3. Management Modules */}
          <Route
            path="shifts"
            element={
              <RequirePermission
                permissionKey="shifts.view"
                moduleName="Payments & Shifts"
              >
                <ShiftsPage />
              </RequirePermission>
            }
          />
          <Route
            path="menu"
            element={
              <RequirePermission permissionKey="menu.view" moduleName="Menu & Catalog">
                <MenuPage />
              </RequirePermission>
            }
          />
          <Route
            path="inventory"
            element={
              <RequirePermission
                permissionKey="inventory.view"
                moduleName="Stock & Inventory"
              >
                <InventoryPage />
              </RequirePermission>
            }
          />
          <Route
            path="customers"
            element={
              <RequirePermission
                permissionKey="customer.view"
                moduleName="Customer Directory"
              >
                <CustomersPage />
              </RequirePermission>
            }
          />
          <Route
            path="reservations"
            element={
              <RequirePermission
                permissionKey="reservations.view"
                moduleName="Reservations"
              >
                <ReservationsPage />
              </RequirePermission>
            }
          />

          {/* 4. Administration Modules */}
          <Route
            path="purchasing"
            element={
              <RequirePermission
                permissionKey="purchasing.view"
                moduleName="Purchasing & Suppliers"
              >
                <PurchasingPage />
              </RequirePermission>
            }
          />
          <Route
            path="expenses"
            element={
              <RequirePermission
                permissionKey="expenses.view"
                moduleName="Expenses & Petty Cash"
              >
                <ExpensesPage />
              </RequirePermission>
            }
          />
          <Route
            path="promotions"
            element={
              <RequirePermission
                permissionKey="promotions.view"
                moduleName="Discounts & Promotions"
              >
                <PromotionsPage />
              </RequirePermission>
            }
          />
          <Route
            path="loyalty"
            element={
              <RequirePermission
                permissionKey="loyalty.view"
                moduleName="Loyalty Rewards"
              >
                <LoyaltyPage />
              </RequirePermission>
            }
          />
          <Route
            path="reports"
            element={
              <RequirePermission
                permissionKey="reports.view"
                moduleName="Reports & Analytics"
              >
                <ReportsPage />
              </RequirePermission>
            }
          />
          <Route
            path="staff"
            element={
              <RequirePermission permissionKey="users.view" moduleName="Staff Management">
                <StaffPage />
              </RequirePermission>
            }
          />
          <Route
            path="settings"
            element={
              <RequirePermission
                permissionKey="settings.view"
                moduleName="Restaurant Settings"
              >
                <SettingsPage />
              </RequirePermission>
            }
          />
          <Route
            path="lan-terminals"
            element={
              <RequirePermission
                permissionKey="terminals.pair"
                moduleName="LAN Terminals"
              >
                <LanTerminalsPage />
              </RequirePermission>
            }
          />
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
