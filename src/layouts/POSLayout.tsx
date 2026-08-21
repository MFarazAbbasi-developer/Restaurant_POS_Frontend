import React, { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutGrid, Menu, X, Server } from 'lucide-react';
import { useSocketStatus } from '@/core/socket/useSocket';
import { socketManager } from '@/core/socket/socketClient';
import { useAuthStore } from '@/core/auth/authStore';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { env } from '@/config/env';
import { cn } from '@/utils/cn';

export const POSLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const { status: socketStatus } = useSocketStatus();
  const { user, terminal } = useAuthStore();

  useEffect(() => {
    socketManager.connect();
    return () => {
      // Disconnect on unmount if needed
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [{ label: 'POS Terminal', path: '/', icon: LayoutGrid }];

  return (
    <div className="h-screen w-screen flex flex-col bg-pos-bg text-pos-text overflow-hidden select-none">
      {/* Header Bar */}
      <header className="h-16 bg-pos-header border-b border-pos-border px-4 flex items-center justify-between shrink-0 shadow-pos z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg hover:bg-pos-surface-hover text-pos-text-muted hover:text-pos-text transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-pos-accent flex items-center justify-center font-black text-white text-base shadow-sm">
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
        </div>

        {/* Center Clock & Status */}
        <div className="hidden md:flex items-center gap-4">
          <div className="font-mono text-sm font-semibold tracking-wider text-pos-text-muted bg-pos-bg/60 px-3 py-1.5 rounded-lg border border-pos-border/40">
            {currentTime}
          </div>
          <StatusIndicator status={socketStatus} />
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-pos-text">
              {user?.name || 'Cashier Station'}
            </p>
            <p className="text-[10px] text-pos-text-muted uppercase tracking-wider">
              {user?.role || 'Operator'}
            </p>
          </div>
          <div className="h-9 w-9 rounded-full bg-pos-surface border border-pos-border flex items-center justify-center font-bold text-xs text-pos-accent">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'POS'}
          </div>
        </div>
      </header>

      {/* Main View Shell */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside
          className={cn(
            'bg-pos-sidebar border-r border-pos-border transition-all duration-200 ease-in-out flex flex-col shrink-0 z-10',
            sidebarOpen ? 'w-56' : 'w-16'
          )}
        >
          <nav className="flex-1 p-2 space-y-1.5 overflow-y-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors select-none min-h-[44px]',
                      isActive
                        ? 'bg-pos-accent text-white shadow-sm'
                        : 'text-pos-text-muted hover:bg-pos-surface hover:text-pos-text'
                    )
                  }
                >
                  <Icon size={20} className="shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3 border-t border-pos-border">
            <div
              className={cn(
                'flex items-center gap-2 text-xs text-pos-text-muted font-mono',
                !sidebarOpen && 'justify-center'
              )}
            >
              <Server size={14} className="shrink-0" />
              {sidebarOpen && (
                <span className="truncate text-[11px]">v0.1.0 • {env.appEnv}</span>
              )}
            </div>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 flex flex-col overflow-hidden bg-pos-bg relative">
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
