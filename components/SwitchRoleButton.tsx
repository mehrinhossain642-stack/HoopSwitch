import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useSession } from '../lib/session';
import { COLORS } from '../lib/theme';

/**
 * Signs out and returns to the splash screen. Now that roles come from a real
 * account rather than a picker, switching role means ending the session —
 * revoking the JWT server-side and clearing it from secure storage.
 */
export function SwitchRoleButton() {
  const router = useRouter();
  const { signOut } = useSession();

  return (
    <Pressable
      onPress={() => {
        signOut().finally(() => router.replace('/'));
      }}
      className="flex-row items-center rounded-full border border-border bg-surface px-3 py-1.5"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Ionicons name="log-out-outline" size={13} color={COLORS.slate} />
      <Text className="font-sans-semibold ml-1.5 text-[12px] text-slate">Sign out</Text>
    </Pressable>
  );
}
