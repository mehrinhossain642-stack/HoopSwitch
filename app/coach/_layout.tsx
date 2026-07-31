import { Stack } from 'expo-router';
import { COLORS } from '../../lib/theme';

/** Coach flow: tab group, with player detail pushed on top of the tabs. */
export default function CoachLayout() {
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
