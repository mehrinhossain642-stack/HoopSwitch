import { colorScheme } from 'nativewind';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'hoopswitch.theme';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/**
 * SecureStore has no web implementation, so fall back to localStorage there —
 * mirroring the shim in session.tsx. A theme choice isn't a secret; this only
 * needs to survive a restart.
 */
const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
};

function isPreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

type ThemeState = {
  /** What the user picked. */
  preference: ThemePreference;
  /** What that resolves to right now — 'system' followed to the OS setting. */
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

/**
 * Owns the light/dark choice and pushes it into NativeWind.
 *
 * `colorScheme.set()` toggles the `dark` class that tailwind.config.js is
 * configured for (`darkMode: 'class'`), which is what flips the CSS variables in
 * global.css — so a single call restyles every `bg-surface`/`text-ink` in the app.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );

  // Restore the saved choice. Until it lands we follow the system, which is the
  // least surprising default and avoids a flash of the wrong theme.
  useEffect(() => {
    let cancelled = false;
    storage
      .get(KEY)
      .then((stored) => {
        if (!cancelled && isPreference(stored)) setPreferenceState(stored);
      })
      .catch(() => {
        // An unreadable preference just means "follow the system".
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Only matters while the preference is 'system', but the listener is cheap and
  // unconditional subscription keeps the effect free of extra dependencies.
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: next }) => {
      setSystemTheme(next === 'dark' ? 'dark' : 'light');
    });
    return () => subscription.remove();
  }, []);

  const resolved: ResolvedTheme = preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    colorScheme.set(resolved);
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    // Fire-and-forget: the in-memory choice is already applied, and failing to
    // persist shouldn't surface as a failed interaction.
    void storage.set(KEY, next).catch(() => {});
  }, []);

  const value = useMemo<ThemeState>(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference(): ThemeState {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useThemePreference must be used inside <ThemeProvider>');
  }
  return context;
}
