import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useThemeColors } from '../../lib/theme';
import { useAuthGuard } from '../../lib/useAuthGuard';

/** Admin flow: approvals + teams tabs, with settings and game upload pushed on top. */
export default function AdminLayout() {
  const signedIn = useAuthGuard();
  const colors = useThemeColors();

  // Unmounts every admin screen the instant the session ends.
  if (!signedIn) return <View className="flex-1 bg-bg" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" options={{ presentation: 'card' }} />
      <Stack.Screen name="statsheet" options={{ presentation: 'card' }} />
    </Stack>
  );
}
