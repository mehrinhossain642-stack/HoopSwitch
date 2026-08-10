import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as api from './api';
import type { ApiUser, UserRole } from './api';

const TOKEN_KEY = 'hoopswitch.token';
const USER_KEY = 'hoopswitch.user';

/**
 * SecureStore has no web implementation, so fall back to localStorage there.
 * The web target is a dev convenience; the device path is the real one.
 */
const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(key) ?? null;
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

type SessionState = {
  token: string | null;
  user: ApiUser | null;
  /** True until the persisted session has been read back from storage. */
  restoring: boolean;
  signIn: (email: string, password: string) => Promise<ApiUser>;
  signUp: (
    email: string,
    password: string,
    passwordConfirmation: string,
    role: UserRole,
    fullName?: string
  ) => Promise<ApiUser>;
  signOut: () => Promise<void>;
  /** Token guaranteed non-null; throws if called while signed out. */
  requireToken: () => string;
};

const SessionContext = createContext<SessionState | null>(null);

/** Holds the JWT and current user, persisted across app restarts. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          storage.get(TOKEN_KEY),
          storage.get(USER_KEY),
        ]);
        if (cancelled) return;
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as ApiUser);
        }
      } catch {
        // A corrupt or unreadable session just means "signed out".
      } finally {
        if (!cancelled) setRestoring(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (nextToken: string, nextUser: ApiUser) => {
    setToken(nextToken);
    setUser(nextUser);
    await Promise.all([
      storage.set(TOKEN_KEY, nextToken),
      storage.set(USER_KEY, JSON.stringify(nextUser)),
    ]);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await api.login(email, password);
      await persist(result.token, result.user);
      return result.user;
    },
    [persist]
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      passwordConfirmation: string,
      role: UserRole,
      fullName?: string
    ) => {
      const result = await api.signup(email, password, passwordConfirmation, role);

      // /signup seeds the role record with a placeholder name derived from the
      // email. If the form collected a real name, write it through so the
      // profile isn't wrong the first time the user opens it.
      const name = fullName?.trim();
      if (name) {
        try {
          if (result.user.role === 'player') {
            await api.updateProfile(result.token, { name });
          } else {
            await api.updateTeam(result.token, { coach_name: name });
          }
        } catch {
          // Non-fatal: the account exists and the name is editable in-app.
        }
      }

      await persist(result.token, result.user);
      return result.user;
    },
    [persist]
  );

  const signOut = useCallback(async () => {
    // Best-effort revocation; the local session is cleared either way.
    if (token) {
      try {
        await api.logout(token);
      } catch {
        // Already expired or offline — nothing more to do server-side.
      }
    }
    setToken(null);
    setUser(null);
    await Promise.all([storage.remove(TOKEN_KEY), storage.remove(USER_KEY)]);
  }, [token]);

  const requireToken = useCallback(() => {
    if (!token) throw new Error('Not signed in');
    return token;
  }, [token]);

  const value = useMemo<SessionState>(
    () => ({ token, user, restoring, signIn, signUp, signOut, requireToken }),
    [token, user, restoring, signIn, signUp, signOut, requireToken]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (context === null) {
    throw new Error('useSession must be used inside <SessionProvider>');
  }
  return context;
}
