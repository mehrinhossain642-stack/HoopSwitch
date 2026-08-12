import { Stack } from 'expo-router';
import { COLORS } from '../../lib/theme';

/**
 * "Create your profile" — a 4-step flow shown once, after signup and before the
 * app. Each step PATCHes /profile on Continue, so a half-finished profile is
 * saved and the flow resumes where the player left off.
 */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.surface },
      }}
    />
  );
}
