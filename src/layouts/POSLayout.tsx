import React, { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Server,
  LogOut,
  Shield,
  Store,
  ChevronDown,
  PowerOff,
  Maximize,
  Minimize,
  Calendar,
  Clock,
  CircleDot,
} from 'lucide-react';
import { useSocketStatus } from '@/core/socket/useSocket';
import { socketManager } from '@/core/socket/socketClient';
import { useAuthStore } from '@/core/auth/authStore';
import { usePermissions } from '@/core/auth/usePermissions';
import { useCurrentShiftQuery } from '@/features/shifts/hooks/useShiftsData';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { NAVIGATION_GROUPS } from '@/config/navigation';
import { PRODUCT_IDENTITY } from '@/config/product';
import { cn } from '@/utils/cn';

export const POSLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredNavItem, setHoveredNavItem] = useState<{
    label: string;
    badge?: string;
    top: number;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Clear hovered tooltip on navigation or sidebar toggle
  useEffect(() => {
    setHoveredNavItem(null);
  }, [location.pathname, sidebarOpen]);

  const { status: socketStatus } = useSocketStatus();
  const { data: currentShift } = useCurrentShiftQuery();
  const { user, terminal, logout, logoutAll, isLoading } = useAuthStore();
  const { roles, permissions, hasPermission } = usePermissions();

  useEffect(() => {
    socketManager.connect();
  }, []);

  // Live real-time clock & business date
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not supported or blocked
    }
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const handleLogoutAll = async () => {
    setUserMenuOpen(false);
    await logoutAll();
    navigate('/login', { replace: true });
  };

  const restaurantName =
    user && 'restaurant' in user && user.restaurant?.name
      ? user.restaurant.name
      : 'Restaurant';

  return (
    <div className="h-screen w-screen flex flex-col bg-pos-bg text-pos-text overflow-hidden select-none">
      {/* Top Bar (Height: 64px) */}
      <header className="h-16 bg-pos-surface border-b border-pos-border px-3 sm:px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left Side: Brand, Sidebar Toggle, Terminal & Store */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg hover:bg-pos-surface-subtle text-pos-text-muted hover:text-pos-text transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center border border-transparent hover:border-pos-border"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-pos-primary flex items-center justify-center font-bold text-white text-sm shadow-xs shrink-0">
              F
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-tight text-pos-text">
                {PRODUCT_IDENTITY.name}
              </h1>
              <p className="text-[11px] text-pos-text-muted font-mono leading-tight">
                {terminal?.terminalId || PRODUCT_IDENTITY.defaultTerminalId}
              </p>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 ml-4 pl-4 border-l border-pos-border text-xs text-pos-text-secondary">
            <Store size={14} className="text-pos-primary" />
            <span className="font-medium text-pos-text truncate max-w-[200px]">
              {restaurantName}
            </span>
          </div>
        </div>

        {/* Center: Date, Shift Status Pill, Digital Clock, & Network Status */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Business Date Pill */}
          <div className="flex items-center gap-1.5 text-xs text-pos-text-secondary bg-pos-surface-subtle px-2.5 py-1.5 rounded-lg border border-pos-border">
            <Calendar size={13} className="text-pos-primary" />
            <span className="font-medium text-xs">{currentDate}</span>
          </div>

          {/* Shift Status */}
          <NavLink
            to="/shifts"
            className={cn(
              'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors hover:border-pos-primary',
              currentShift?.status === 'OPEN'
                ? 'bg-pos-surface-subtle border-pos-border text-pos-text'
                : 'bg-pos-warning-soft border-[#FDE68A] text-pos-warning'
            )}
            title={
              currentShift?.status === 'OPEN'
                ? `Shift #${currentShift.id.slice(0, 8)}: ${currentShift.cashier?.name || currentShift.registerName}`
                : 'Click to open register shift'
            }
          >
            <CircleDot
              size={12}
              className={cn(
                currentShift?.status === 'OPEN' ? 'text-pos-success' : 'text-pos-warning'
              )}
            />
            <span className="font-semibold text-xs">
              {currentShift?.status === 'OPEN' ? 'Shift Open' : 'Open Shift'}
            </span>
          </NavLink>

          {/* Digital Clock */}
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-pos-text bg-pos-surface-subtle px-3 py-1.5 rounded-lg border border-pos-border tracking-wider">
            <Clock size={13} className="text-pos-text-muted" />
            {currentTime}
          </div>

          {/* Real-time Status */}
          <StatusIndicator status={socketStatus} />
        </div>

        {/* Right Side: Fullscreen & User Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Fullscreen Kiosk Mode Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 rounded-lg hover:bg-pos-surface-subtle text-pos-text-muted hover:text-pos-text transition-colors hidden sm:flex items-center justify-center border border-transparent hover:border-pos-border"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Kiosk Mode'}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(prev => !prev)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-pos-surface-subtle border border-pos-border transition-all min-h-[40px]"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-pos-text leading-tight truncate max-w-[120px]">
                  {user?.name || 'Staff User'}
                </p>
                <p className="text-[11px] text-pos-text-muted uppercase tracking-wider font-medium">
                  {roles.length > 0 ? roles[0] : 'Staff'}
                </p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-pos-primary-soft border border-[#FED7AA] flex items-center justify-center font-bold text-xs text-pos-primary shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'POS'}
              </div>
              <ChevronDown
                size={14}
                className={cn(
                  'text-pos-text-muted transition-transform duration-200 hidden sm:block',
                  userMenuOpen && 'rotate-180'
                )}
              />
            </button>

            {/* User Menu Modal / Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 top-12 w-64 rounded-xl bg-pos-surface border border-pos-border shadow-dropdown p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 bg-pos-surface-subtle rounded-lg border border-pos-border mb-2">
                  <p className="text-xs font-bold text-pos-text">{user?.name}</p>
                  <p className="text-[11px] text-pos-text-muted font-mono mt-0.5">
                    @{user?.username}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-pos-text-secondary">
                    <Shield size={12} className="text-pos-primary" />
                    <span>{permissions.length} Active Permissions</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-pos-text hover:bg-pos-surface-subtle hover:text-pos-danger rounded-lg transition-colors text-left"
                  >
                    <LogOut size={14} className="text-pos-danger" />
                    <span>Log Out (Lock Station)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogoutAll}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-pos-text-muted hover:bg-pos-danger-soft hover:text-pos-danger rounded-lg transition-colors text-left"
                  >
                    <PowerOff size={14} className="text-pos-danger" />
                    <span>Revoke All Sessions</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main View Shell */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar (Desktop Width: 248px) */}
        <aside
          className={cn(
            'bg-pos-surface border-r border-pos-border transition-all duration-200 ease-in-out flex flex-col shrink-0 z-10 select-none',
            sidebarOpen ? 'w-[248px]' : 'w-16'
          )}
        >
          <nav className="flex-1 p-2 space-y-4 overflow-y-auto custom-scrollbar">
            {NAVIGATION_GROUPS.map(group => {
              // Filter items by backend permission
              const visibleItems = group.items.filter(
                item => !item.permissionKey || hasPermission(item.permissionKey)
              );

              if (visibleItems.length === 0) return null;

              return (
                <div key={group.groupId} className="space-y-1">
                  {sidebarOpen && (
                    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted">
                      {group.groupLabel}
                    </div>
                  )}

                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const isActive =
                      item.path === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.path);

                    return (
                      <NavLink
                        key={item.id}
                        to={item.path}
                        onMouseEnter={e => {
                          if (!sidebarOpen) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredNavItem({
                              label: item.label,
                              badge: item.badge,
                              top: rect.top + rect.height / 2,
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredNavItem(null)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px]',
                          isActive
                            ? 'bg-pos-primary text-white font-semibold shadow-xs'
                            : 'text-pos-text-secondary hover:bg-pos-surface-subtle hover:text-pos-text',
                          !sidebarOpen && 'justify-center px-0'
                        )}
                      >
                        <Icon size={18} className="shrink-0" />
                        {sidebarOpen && (
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                              <span className="text-[10px] font-bold bg-pos-primary-soft text-pos-primary px-1.5 py-0.5 rounded">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* Instant Zero-Delay Tooltip when Sidebar is Closed */}
          {!sidebarOpen && hoveredNavItem && (
            <div
              style={{ top: `${hoveredNavItem.top}px` }}
              className="fixed left-[72px] -translate-y-1/2 z-[9999] pointer-events-none flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md shadow-dropdown whitespace-nowrap animate-in fade-in zoom-in-95 duration-75 border border-slate-700/50"
            >
              <span>{hoveredNavItem.label}</span>
              {hoveredNavItem.badge && (
                <span className="text-[10px] font-bold bg-pos-primary text-white px-1.5 py-0.5 rounded">
                  {hoveredNavItem.badge}
                </span>
              )}
            </div>
          )}

          {/* Sidebar Footer: Terminal Info */}
          <div className="p-3 border-t border-pos-border bg-pos-surface-subtle/50">
            <div
              className={cn(
                'flex items-center gap-2 text-xs text-pos-text-muted font-mono px-2',
                !sidebarOpen && 'justify-center px-0'
              )}
            >
              <Server size={14} className="shrink-0 text-pos-primary" />
              {sidebarOpen && (
                <span className="truncate text-[11px]">
                  {PRODUCT_IDENTITY.getSystemLabel()}
                </span>
              )}
            </div>
          </div>
        </aside>

        {/* Content Viewport (24px padding default) */}
        <main className="flex-1 flex flex-col overflow-hidden bg-pos-bg relative">
          <div className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
