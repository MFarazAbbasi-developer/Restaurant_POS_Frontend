import { useEffect } from 'react';
import { socketManager, useSocketStore } from './socketClient';
import { SocketConnectionStatus } from '@/types';

/**
 * Hook to access current Socket.IO connection status
 */
export function useSocketStatus(): {
  status: SocketConnectionStatus;
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastConnectedAt: string | null;
} {
  const { status, lastConnectedAt, reconnectAttempts } = useSocketStore();

  return {
    status,
    isConnected: status === 'connected',
    isReconnecting: status === 'reconnecting',
    reconnectAttempts,
    lastConnectedAt,
  };
}

/**
 * Hook to subscribe to a typed socket event
 */
export function useSocketEvent<T = unknown>(
  eventName: string,
  handler: (data: T) => void
): void {
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) return;

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  }, [eventName, handler]);
}
