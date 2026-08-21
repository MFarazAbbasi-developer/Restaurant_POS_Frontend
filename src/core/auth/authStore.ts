import { create } from 'zustand';
import { AuthTokens, TerminalSession, User } from '@/types';
import { authStorage } from './storage';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  terminal: TerminalSession | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => void;
  setAuth: (payload: {
    user: User;
    tokens: AuthTokens;
    terminal?: TerminalSession;
  }) => void;
  setUser: (user: User) => void;
  setTerminalSession: (session: TerminalSession) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  terminal: null,
  isAuthenticated: false,
  isInitialized: false,

  initialize: () => {
    if (get().isInitialized) return;

    const tokens = authStorage.getTokens();
    const user = authStorage.getUser();
    const terminal = authStorage.getTerminalSession();

    const isAuthenticated = Boolean(tokens?.accessToken && user);

    set({
      tokens,
      user,
      terminal,
      isAuthenticated,
      isInitialized: true,
    });
  },

  setAuth: ({ user, tokens, terminal }) => {
    authStorage.setTokens(tokens);
    authStorage.setUser(user);
    if (terminal) {
      authStorage.setTerminalSession(terminal);
    }

    set({
      user,
      tokens,
      terminal: terminal || get().terminal,
      isAuthenticated: true,
    });
  },

  setUser: (user: User) => {
    authStorage.setUser(user);
    set({ user });
  },

  setTerminalSession: (terminal: TerminalSession) => {
    authStorage.setTerminalSession(terminal);
    set({ terminal });
  },

  logout: () => {
    authStorage.clearAll();
    set({
      user: null,
      tokens: null,
      terminal: null,
      isAuthenticated: false,
    });
  },
}));
