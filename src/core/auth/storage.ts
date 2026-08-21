import { AuthTokens, TerminalSession, User } from '@/types';

export interface IAuthStorage {
  getTokens(): AuthTokens | null;
  setTokens(tokens: AuthTokens): void;
  clearTokens(): void;
  getUser(): User | null;
  setUser(user: User): void;
  clearUser(): void;
  getTerminalSession(): TerminalSession | null;
  setTerminalSession(session: TerminalSession): void;
  clearTerminalSession(): void;
  clearAll(): void;
}

const STORAGE_KEYS = {
  TOKENS: 'faraz_pos_auth_tokens',
  USER: 'faraz_pos_auth_user',
  TERMINAL: 'faraz_pos_terminal_session',
} as const;

/**
 * LocalStorage adapter implementation. Can be easily swapped with Tauri/Electron secure storage.
 */
export class LocalAuthStorage implements IAuthStorage {
  getTokens(): AuthTokens | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TOKENS);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
    } catch (e) {
      console.error('Failed to store auth tokens:', e);
    }
  }

  clearTokens(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKENS);
    } catch (e) {
      console.error('Failed to remove auth tokens:', e);
    }
  }

  getUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setUser(user: User): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to store user profile:', e);
    }
  }

  clearUser(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (e) {
      console.error('Failed to remove user profile:', e);
    }
  }

  getTerminalSession(): TerminalSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TERMINAL);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setTerminalSession(session: TerminalSession): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TERMINAL, JSON.stringify(session));
    } catch (e) {
      console.error('Failed to store terminal session:', e);
    }
  }

  clearTerminalSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.TERMINAL);
    } catch (e) {
      console.error('Failed to remove terminal session:', e);
    }
  }

  clearAll(): void {
    this.clearTokens();
    this.clearUser();
    this.clearTerminalSession();
  }
}

export const authStorage = new LocalAuthStorage();
