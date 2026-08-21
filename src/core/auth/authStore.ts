import { create } from 'zustand';
import { AuthTokens, FullUserProfile, LoginCredentials, TerminalSession } from '@/types';
import { env } from '@/config/env';
import { AuthApi } from './authApi';
import { authStorage, StoredUser } from './storage';

interface AuthState {
  user: StoredUser | null;
  tokens: AuthTokens | null;
  terminal: TerminalSession | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  fetchMe: () => Promise<FullUserProfile | null>;
  setAuth: (payload: {
    user: StoredUser;
    tokens: AuthTokens;
    terminal?: TerminalSession;
  }) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: StoredUser) => void;
  setTerminalSession: (session: TerminalSession) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  terminal: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    if (get().isInitialized) return;

    const tokens = authStorage.getTokens();
    const user = authStorage.getUser();
    let terminal = authStorage.getTerminalSession();

    if (!terminal) {
      terminal = {
        terminalId: env.defaultTerminalId,
        terminalName: 'Main Terminal',
        registerOpen: false,
      };
      authStorage.setTerminalSession(terminal);
    }

    const isAuthenticated = Boolean(tokens?.accessToken && user);

    set({
      tokens,
      user,
      terminal,
      isAuthenticated,
      isInitialized: true,
    });

    // Optionally revalidate user profile and permissions in background if authenticated
    if (isAuthenticated && tokens?.accessToken) {
      try {
        const fullUser = await AuthApi.getMe();
        authStorage.setUser(fullUser);
        set({ user: fullUser });
      } catch {
        // If fetchMe fails due to expired/revoked session, ApiClient will handle refresh or logout
      }
    }
  },

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await AuthApi.login(credentials);
      const tokens: AuthTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      };

      authStorage.setTokens(tokens);
      authStorage.setUser(data.user);

      let terminal = authStorage.getTerminalSession();
      if (!terminal) {
        terminal = {
          terminalId: env.defaultTerminalId,
          terminalName: 'Main Terminal',
          registerOpen: false,
        };
        authStorage.setTerminalSession(terminal);
      }

      set({
        tokens,
        user: data.user,
        terminal,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Try fetching full profile with restaurant details & full role metadata
      try {
        const fullUser = await AuthApi.getMe();
        authStorage.setUser(fullUser);
        set({ user: fullUser });
      } catch {
        // Basic user info is already set from login response
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    const currentTokens = get().tokens || authStorage.getTokens();
    const currentRefreshToken = currentTokens?.refreshToken;

    try {
      if (currentRefreshToken && get().isAuthenticated) {
        await AuthApi.logout(currentRefreshToken);
      }
    } catch {
      // Ignore network errors on logout, proceed with local teardown
    } finally {
      authStorage.clearTokens();
      authStorage.clearUser();
      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  logoutAll: async () => {
    try {
      if (get().isAuthenticated) {
        await AuthApi.logoutAll();
      }
    } catch {
      // Ignore network errors
    } finally {
      authStorage.clearTokens();
      authStorage.clearUser();
      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  fetchMe: async () => {
    try {
      const fullProfile = await AuthApi.getMe();
      authStorage.setUser(fullProfile);
      set({ user: fullProfile });
      return fullProfile;
    } catch {
      return null;
    }
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

  setTokens: (tokens: AuthTokens) => {
    authStorage.setTokens(tokens);
    set({ tokens });
  },

  setUser: (user: StoredUser) => {
    authStorage.setUser(user);
    set({ user });
  },

  setTerminalSession: (terminal: TerminalSession) => {
    authStorage.setTerminalSession(terminal);
    set({ terminal });
  },

  clearError: () => {
    set({ error: null });
  },
}));
