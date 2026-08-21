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
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { NAVIGATION_GROUPS } from '@/config/navigation';
import { env } from '@/config/env';
import { cn } from '@/utils/cn';

export const POSLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { status: socketStatus } = useSocketStatus();
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
      : 'Faraz Flagship Bistro';

  return (
    <div className="h-screen w-screen flex flex-col bg-pos-bg text-pos-text overflow-hidden select-none">
      {/* Header Bar */}
      <header className="h-16 bg-pos-header border-b border-pos-border px-3 sm:px-4 flex items-center justify-between shrink-0 shadow-pos z-20">
        {/* Left Side: Brand, Sidebar Toggle, Terminal & Store */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg hover:bg-pos-surface-hover text-pos-text-muted hover:text-pos-text transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-pos-accent flex items-center justify-center font-black text-white text-base shadow-sm shrink-0">
              F
            </div>
            <div>
              <h1 className="font-bold text-sm leading-none text-pos-text">
                {env.appName}
              </h1>
              <p className="text-[11px] text-pos-text-muted mt-0.5 font-mono">
                {terminal?.terminalId || env.defaultTerminalId}
              </p>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 ml-4 pl-4 border-l border-pos-border/60 text-xs text-pos-text-muted">
            <Store size={14} className="text-pos-accent" />
            <span className="font-semibold text-pos-text truncate max-w-[200px]">
              {restaurantName}
            </span>
          </div>
        </div>

        {/* Center: Date, Shift Status Pill, Digital Clock, & Network Status */}
        <div className="hidden md:flex items-center gap-3">
          {/* Business Date Pill */}
          <div className="flex items-center gap-1.5 text-xs text-pos-text-muted bg-pos-bg/80 px-2.5 py-1.5 rounded-lg border border-pos-border/50">
            <Calendar size={13} className="text-pos-accent" />
            <span className="font-medium text-[11px]">{currentDate}</span>
          </div>

          {/* Shift Status */}
          <div className="flex items-center gap-1.5 text-xs bg-pos-bg/80 px-2.5 py-1.5 rounded-lg border border-pos-border/50">
            <CircleDot size={12} className="text-pos-success animate-pulse" />
            <span className="font-semibold text-[11px] text-pos-text">Shift Active</span>
          </div>

          {/* Digital Clock */}
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-pos-text bg-pos-bg/80 px-3 py-1.5 rounded-lg border border-pos-border/50 tracking-wider">
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
            className="p-2 rounded-lg hover:bg-pos-surface text-pos-text-muted hover:text-pos-text transition-colors hidden sm:flex items-center justify-center"
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
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-pos-surface border border-transparent hover:border-pos-border transition-all min-h-[44px]"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-pos-text leading-tight truncate max-w-[120px]">
                  {user?.name || 'Staff User'}
                </p>
                <p className="text-[10px] text-pos-text-muted uppercase tracking-wider font-semibold">
                  {roles.length > 0 ? roles[0] : 'Staff'}
                </p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-pos-accent/15 border border-pos-accent/30 flex items-center justify-center font-bold text-xs text-pos-accent shadow-sm shrink-0">
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
              <div className="absolute right-0 top-12 w-64 rounded-xl bg-pos-surface border border-pos-border shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 bg-pos-bg/70 rounded-lg border border-pos-border/60 mb-2">
                  <p className="text-xs font-bold text-pos-text">{user?.name}</p>
                  <p className="text-[11px] text-pos-text-muted font-mono mt-0.5">
                    @{user?.username}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-pos-text-muted">
                    <Shield size={12} className="text-pos-accent" />
                    <span>{permissions.length} Active Permissions</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-pos-text hover:bg-pos-surface-hover hover:text-pos-danger rounded-lg transition-colors text-left"
                  >
                    <LogOut size={14} className="text-pos-danger" />
                    <span>Log Out (Lock Station)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogoutAll}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-pos-text-muted hover:bg-pos-danger/10 hover:text-pos-danger rounded-lg transition-colors text-left"
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
        {/* Navigation Sidebar */}
        <aside
          className={cn(
            'bg-pos-sidebar border-r border-pos-border transition-all duration-200 ease-in-out flex flex-col shrink-0 z-10 select-none',
            sidebarOpen ? 'w-60' : 'w-16'
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
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-pos-text-muted/70">
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
                        title={!sidebarOpen ? item.label : undefined}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px]',
                          isActive
                            ? 'bg-pos-accent text-white shadow-sm'
                            : 'text-pos-text-muted hover:bg-pos-surface hover:text-pos-text'
                        )}
                      >
                        <Icon size={18} className="shrink-0" />
                        {sidebarOpen && (
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                              <span className="text-[10px] font-bold bg-pos-bg/80 px-1.5 py-0.5 rounded text-pos-accent">
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

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-pos-border bg-pos-surface/30">
            <div
              className={cn(
                'flex items-center gap-2 text-xs text-pos-text-muted font-mono',
                !sidebarOpen && 'justify-center'
              )}
            >
              <Server size={14} className="shrink-0 text-pos-accent" />
              {sidebarOpen && (
                <span className="truncate text-[11px]">Faraz POS • {env.appEnv}</span>
              )}
            </div>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 flex flex-col overflow-hidden bg-pos-bg relative">
          <div className="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
