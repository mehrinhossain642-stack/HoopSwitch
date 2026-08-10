import '../global.css';

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
import { ActivityIndicator, View } from 'react-native';
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
          <StatusBar style="dark" />
          {ready ? (
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.bg },
              }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="player" />
              <Stack.Screen name="coach" />
            </Stack>
          ) : (
            <View className="flex-1 items-center justify-center bg-bg">
              <ActivityIndicator color={COLORS.primary} />
            </View>
          )}
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
