import { Stack } from 'expo-router';
import { View } from 'react-native';
import { COLORS } from '../../lib/theme';
import { useAuthGuard } from '../../lib/useAuthGuard';

/** Coach flow: tab group, with player detail pushed on top of the tabs. */
export default function CoachLayout() {
  const signedIn = useAuthGuard();

  // Unmounts every coach screen the instant the session ends, so none of them
  // can fire an authenticated request without a token.
  if (!signedIn) return <View className="flex-1 bg-bg" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="player/[id]" options={{ presentation: 'card' }} />
    </Stack>
  );
}
