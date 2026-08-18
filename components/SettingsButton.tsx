import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { COLORS } from '../lib/theme';
import { Touchable } from './Touchable';

/**
 * Gear in the profile hero's action slot. Sits on the ink chrome, so its colours
 * are the constant chrome values rather than theme-aware ones.
 */
export function SettingsButton({ href }: { href: string }) {
  const router = useRouter();

  return (
    <Touchable
      onPress={() => router.push(href as never)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Settings"
      className="h-9 flex-row items-center rounded-full bg-chrome-raised px-3">
      <Ionicons name="settings-outline" size={15} color={COLORS.chromeText} />
      <Text className="font-sans-semibold ml-1.5 text-[12px] text-chrome-text">Settings</Text>
    </Touchable>
  );
}
