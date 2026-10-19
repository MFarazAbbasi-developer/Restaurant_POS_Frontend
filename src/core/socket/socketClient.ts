import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import { env } from '@/config/env';
import { authStorage } from '@/core/auth/storage';
import { SocketConnectionStatus } from '@/types';

interface SocketState {
  status: SocketConnectionStatus;
  lastConnectedAt: string | null;
  reconnectAttempts: number;
  setStatus: (status: SocketConnectionStatus) => void;
  incrementAttempts: () => void;
  resetAttempts: () => void;
  setConnected: () => void;
}

export const useSocketStore = create<SocketState>(set => ({
  status: 'disconnected',
  lastConnectedAt: null,
  reconnectAttempts: 0,
  setStatus: status => set({ status }),
  incrementAttempts: () =>
    set(state => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
  resetAttempts: () => set({ reconnectAttempts: 0 }),
  setConnected: () =>
    set({
      status: 'connected',
      lastConnectedAt: new Date().toISOString(),
      reconnectAttempts: 0,
    }),
}));

class SocketClientManager {
  private socket: Socket | null = null;

  public connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    useSocketStore.getState().setStatus('connecting');

    const tokens = authStorage.getTokens();
    const terminal = authStorage.getTerminalSession();

    const socketTarget =
      env.wsUrl || (typeof window !== 'undefined' ? window.location.origin : undefined);

    const socketOptions = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      auth: {
        token: tokens?.accessToken,
        terminalId: terminal?.terminalId || env.defaultTerminalId,
      },
      transports: ['websocket', 'polling'] as ('websocket' | 'polling')[],
    };

    this.socket = socketTarget ? io(socketTarget, socketOptions) : io(socketOptions);

    this.setupListeners();
    return this.socket;
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      useSocketStore.getState().setConnected();
    });

    this.socket.on('disconnect', reason => {
      useSocketStore.getState().setStatus('disconnected');
      if (reason === 'io server disconnect') {
        // Server disconnected the socket explicitly; try manual reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', () => {
      useSocketStore.getState().incrementAttempts();
      useSocketStore.getState().setStatus('reconnecting');
    });

    this.socket.on('reconnect', () => {
      useSocketStore.getState().setConnected();
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      useSocketStore.getState().setStatus('disconnected');
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public emit<T = unknown>(event: string, data?: T): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`[Socket] Attempted to emit "${event}" while disconnected.`);
    }
  }
}

export const socketManager = new SocketClientManager();
