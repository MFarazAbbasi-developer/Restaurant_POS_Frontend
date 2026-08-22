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
          dotClass: 'bg-pos-success',
          bgClass: 'bg-pos-success-soft border-[#BBF7D0] text-pos-success',
          defaultText: status === 'connected' ? 'Live Sync' : 'Online',
        };
      case 'connecting':
      case 'reconnecting':
        return {
          dotClass: 'bg-pos-warning animate-pulse',
          bgClass: 'bg-pos-warning-soft border-[#FDE68A] text-pos-warning',
          defaultText: 'Reconnecting...',
        };
      case 'disconnected':
      case 'offline':
      case 'error':
      default:
        return {
          dotClass: 'bg-pos-danger',
          bgClass: 'bg-pos-danger-soft border-[#FECACA] text-pos-danger',
          defaultText: status === 'offline' ? 'Offline' : 'Disconnected',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors duration-150',
        config.bgClass,
        className
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', config.dotClass)} />
      <span className="font-semibold">{label || config.defaultText}</span>
    </div>
  );
};
