import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useThemeColors } from '../../lib/theme';
import { useAuthGuard } from '../../lib/useAuthGuard';

/** Parent flow: tab group, with settings pushed on top of the tabs. */
export default function ParentLayout() {
  const signedIn = useAuthGuard();
  const colors = useThemeColors();

  // Unmounts every parent screen the instant the session ends.
  if (!signedIn) return <View className="flex-1 bg-bg" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" options={{ presentation: 'card' }} />
    </Stack>
  );
}