import '../global.css';

import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
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
import { COLORS } from '../lib/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Sora_700Bold,
    Sora_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Condensed scoreboard face — every stat numeral and eyebrow label.
    BebasNeue_400Regular,
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
        <SessionProvider>
          {/* The splash and auth screens are dark; light content keeps the
              status bar readable over them. Screens with the ink header slab
              also sit under a dark surface. */}
          <StatusBar style="light" />
          {ready ? (
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.bg },
              }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="player" />
              <Stack.Screen name="coach" />
            </Stack>
          ) : (
            // Matches the splash background so the handoff isn't a white flash.
            <View className="flex-1 bg-ink-900" />
          )}
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
