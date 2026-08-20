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

/** Where a user lands after authenticating. */
export type LandingRoute = '/onboarding/basics' | '/player' | '/coach' | '/parent';

export type AuthOutcome = { user: ApiUser; route: LandingRoute };

type SessionState = {
  token: string | null;
  user: ApiUser | null;
  /** True until the persisted session has been read back from storage. */
  restoring: boolean;
  /**
   * Set when a stored token was rejected by the API rather than the user choosing
   * to leave. Lets the UI route to sign-in (they have an account) and say why,
   * instead of dumping them on role selection with no explanation.
   */
  sessionExpired: boolean;
  signIn: (email: string, password: string) => Promise<AuthOutcome>;
  signUp: (
    email: string,
    password: string,
    passwordConfirmation: string,
    role: UserRole,
    fullName?: string
  ) => Promise<AuthOutcome>;
  signOut: () => Promise<void>;
  /** Token guaranteed non-null; throws if called while signed out. */
  requireToken: () => string;
  /**
   * Where a signed-in user belongs: the onboarding flow if they're a player who
   * hasn't finished it, otherwise their role's home. Coaches skip onboarding —
   * the designed flow is player-specific and /signup already seeds their team.
   */
  landingRoute: () => Promise<LandingRoute>;
};

/**
 * Resolved against an explicit token so it works immediately after sign-in,
 * before the token has landed in React state.
 */
async function resolveLandingRoute(user: ApiUser, token: string): Promise<LandingRoute> {
  if (user.role === 'coach') return '/coach';
  if (user.role === 'parent') return '/parent';

  try {
    const profile = await api.getProfile(token);
    return profile.onboarding_complete ? '/player' : '/onboarding/basics';
  } catch {
    return '/player';
  }
}


const SessionContext = createContext<SessionState | null>(null);

/** Holds the JWT and current user, persisted across app restarts. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  /**
   * Drops the session locally, without telling the server. Used both by sign-out
   * (after it has captured the token to revoke) and when the API rejects a token
   * we were holding — in that case there is nothing to revoke, and calling
   * /logout with a dead token would just 401 again.
   */
  const clearLocalSession = useCallback(async () => {
    setToken(null);
    setUser(null);
    await Promise.all([storage.remove(TOKEN_KEY), storage.remove(USER_KEY)]);
  }, []);

  // A stored token can be dead before the app even opens: signing out on another
  // device revokes it (JTIMatcher rotates the user's jti), and tokens expire.
  // Treat that as "signed out" rather than letting every screen fail its fetch.
  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      setSessionExpired(true);
      void clearLocalSession();
    });
    return () => api.setUnauthorizedHandler(null);
  }, [clearLocalSession]);

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
    // Authenticating successfully clears the expiry notice.
    setSessionExpired(false);
    await Promise.all([
      storage.set(TOKEN_KEY, nextToken),
      storage.set(USER_KEY, JSON.stringify(nextUser)),
    ]);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthOutcome> => {
      const result = await api.login(email, password);
      await persist(result.token, result.user);
      return {
        user: result.user,
        route: await resolveLandingRoute(result.user, result.token),
      };
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
    ): Promise<AuthOutcome> => {
      const result = await api.signup(email, password, passwordConfirmation, role);

      // /signup seeds the role record with a placeholder name derived from the
      // email. If the form collected a real name, write it through so the
      // profile isn't wrong the first time the user opens it.
      const name = fullName?.trim();
      if (name) {
        try {
          if (result.user.role === 'player') {
  await api.updateProfile(result.token, { name });
} else if (result.user.role === 'coach') {
  await api.updateTeam(result.token, { coach_name: name });
}
        } catch {
          // Non-fatal: the account exists and the name is editable in-app.
        }
      }

      await persist(result.token, result.user);
      return {
        user: result.user,
        // A brand-new player always needs onboarding; the helper still routes
        // coaches straight to their team.
        route: await resolveLandingRoute(result.user, result.token),
      };
    },
    [persist]
  );

  const signOut = useCallback(async () => {
    // Clear locally *first*. Revocation is a network round trip, and while it
    // was in flight `user` stayed set — long enough for the splash screen to
    // decide it had a live session and route straight back into the app.
    const revoking = token;
    // Leaving on purpose isn't an expiry, so the sign-in screen shouldn't claim it was.
    setSessionExpired(false);
    await clearLocalSession();

    // Best-effort revocation; the local session is already gone either way, so
    // a failure here must not surface as a failed sign-out.
    if (revoking) {
      try {
        await api.logout(revoking);
      } catch {
        // Already expired or offline — nothing more to do server-side.
      }
    }
  }, [token, clearLocalSession]);

  const requireToken = useCallback(() => {
    if (!token) throw new Error('Not signed in');
    return token;
  }, [token]);

  // For the splash screen, where a restored session already has its token in state.
  const landingRoute = useCallback(async (): Promise<LandingRoute> => {
    if (!user || !token) return '/player';
    return resolveLandingRoute(user, token);
  }, [user, token]);

  const value = useMemo<SessionState>(
    () => ({
      token,
      user,
      restoring,
      sessionExpired,
      signIn,
      signUp,
      signOut,
      requireToken,
      landingRoute,
    }),
    [token, user, restoring, sessionExpired, signIn, signUp, signOut, requireToken, landingRoute]
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
