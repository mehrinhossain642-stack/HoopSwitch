import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useThemeColors } from '../../lib/theme';
import { useAuthGuard } from '../../lib/useAuthGuard';

/** Player flow: tab group, with posting detail pushed on top of the tabs. */
export default function PlayerLayout() {
  const signedIn = useAuthGuard();
  const colors = useThemeColors();

  // Unmounts every player screen the instant the session ends, so none of them
  // can fire an authenticated request without a token.
  if (!signedIn) return <View className="flex-1 bg-bg" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="posting/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="settings" options={{ presentation: 'card' }} />
    </Stack>
  );
}
