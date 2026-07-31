import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { COLORS } from '../lib/theme';

/** Returns to role-select, keeping all four core screens reachable. */
export function SwitchRoleButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.dismissTo('/')}
      className="flex-row items-center rounded-full border border-border bg-surface px-3 py-1.5"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Ionicons name="swap-horizontal" size={13} color={COLORS.slate} />
      <Text className="font-sans-semibold ml-1.5 text-[12px] text-slate">Switch role</Text>
    </Pressable>
  );
}
