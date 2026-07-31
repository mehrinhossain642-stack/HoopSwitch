import { Stack } from 'expo-router';
import { COLORS } from '../../lib/theme';

/** Player flow: tab group, with posting detail pushed on top of the tabs. */
export default function PlayerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="posting/[id]" options={{ presentation: 'card' }} />
    </Stack>
  );
}
