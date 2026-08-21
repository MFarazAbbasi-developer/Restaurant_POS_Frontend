import React from 'react';
import { cn } from '@/utils/cn';
import { SocketConnectionStatus } from '@/types';

export interface StatusIndicatorProps {
  status: SocketConnectionStatus | 'online' | 'offline';
  label?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
      case 'online':
        return {
          dotClass: 'bg-emerald-500 animate-pulse',
          bgClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          defaultText: status === 'connected' ? 'Live Sync' : 'Online',
        };
      case 'connecting':
      case 'reconnecting':
        return {
          dotClass: 'bg-amber-500 animate-ping',
          bgClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          defaultText: 'Reconnecting...',
        };
      case 'disconnected':
      case 'offline':
      case 'error':
      default:
        return {
          dotClass: 'bg-rose-500',
          bgClass: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          defaultText: status === 'offline' ? 'Offline' : 'Disconnected',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium tracking-wide transition-all',
        config.bgClass,
        className
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', config.dotClass)} />
      <span>{label || config.defaultText}</span>
    </div>
  );
};
