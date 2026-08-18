import '../global.css';

import {
  BarlowCondensed_500Medium,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Sora_600SemiBold, Sora_700Bold, useFonts } from '@expo-google-fonts/sora';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '../lib/session';
import { useThemeColors } from '../lib/theme';
import { ThemeProvider } from '../lib/themePreference';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Sora_700Bold,
    Sora_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Condensed athletic face — every stat numeral and eyebrow label.
    BarlowCondensed_500Medium,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
  });

  // Font loading must never be able to wedge the app. Bundled fonts resolve in
  // well under a second; if the environment can't deliver them (or errors), we
  // give up waiting and render with system fonts instead.
  const [waitedLongEnough, setWaitedLongEnough] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setWaitedLongEnough(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const ready = fontsLoaded || fontError !== null || waitedLongEnough;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* ThemeProvider sits above SessionProvider so a signed-out screen is
            already themed — the launch screen renders before any session exists. */}
        <ThemeProvider>
          <SessionProvider>
            {ready ? (
              <RootStack />
            ) : (
              // Matches the launch screen's fill so the handoff from fonts-pending
              // to first paint isn't a white flash.
              <View className="flex-1 bg-chrome" />
            )}
          </SessionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Split out so it can read the resolved theme — the navigator's own background
 * shows through during transitions, and a hardcoded light value flashes white on
 * every push in dark mode.
 */
function RootStack() {
  const colors = useThemeColors();

  return (
    <>
      {/* Every screen puts the ink chrome under the status bar, so light content is
          correct in both themes. */}
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="player" />
        <Stack.Screen name="coach" />
      </Stack>
    </>
  );
}
