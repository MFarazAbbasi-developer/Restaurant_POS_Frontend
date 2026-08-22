import React, { useEffect, useState } from 'react';
import { env } from '@/config/env';
import { useAuthStore } from '@/core/auth/authStore';
import { StaffLoginForm } from '@/components/auth/StaffLoginForm';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { useSocketStatus } from '@/core/socket/useSocket';
import { Monitor, ShieldCheck, Clock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { terminal } = useAuthStore();
  const { status: socketStatus } = useSocketStatus();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-screen bg-pos-bg flex flex-col justify-between text-pos-text select-none p-4 sm:p-6 overflow-y-auto">
      {/* Top Terminal Info Header */}
      <header className="flex items-center justify-between w-full max-w-5xl mx-auto py-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-pos-primary flex items-center justify-center font-bold text-white text-base shadow-xs">
            F
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-pos-text">
              {env.appName}
            </h1>
            <p className="text-xs text-pos-text-muted flex items-center gap-1 font-mono">
              <Monitor size={12} />
              {terminal?.terminalId || env.defaultTerminalId} •{' '}
              {terminal?.terminalName || 'Main Station'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs font-semibold text-pos-text-secondary bg-pos-surface px-3 py-1.5 rounded-lg border border-pos-border">
            <Clock size={14} className="text-pos-text-muted" />
            {currentTime}
          </div>
          <StatusIndicator status={socketStatus} />
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center py-6">
        <StaffLoginForm />
      </main>

      {/* Bottom Footer Info */}
      <footer className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-pos-text-muted gap-2 pt-4 border-t border-pos-border">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-pos-primary" />
          <span>Secure Staff Session Management & RBAC Protected</span>
        </div>
        <div className="font-mono text-[11px]">v0.1.0 • Environment: {env.appEnv}</div>
      </footer>
    </div>
  );
};
