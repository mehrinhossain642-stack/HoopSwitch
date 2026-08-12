import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { useSession } from '../lib/session';
import { COLORS } from '../lib/theme';
import { Touchable } from './Touchable';

/**
 * Signs out and returns to the splash screen. Now that roles come from a real
 * account rather than a picker, switching role means ending the session —
 * revoking the JWT server-side and clearing it from secure storage.
 */
export function SwitchRoleButton({ onDark = false }: { onDark?: boolean }) {
  const router = useRouter();
  const { signOut } = useSession();

  return (
    <Touchable
      onPress={() => {
        signOut().finally(() => router.replace('/'));
      }}
      accessibilityRole="button"
      accessibilityLabel="Sign out"
      hitSlop={8}
      className={`h-9 flex-row items-center rounded-full px-3 ${
        onDark ? 'bg-ink-700' : 'border border-border-strong bg-surface'
      }`}>
      <Ionicons
        name="log-out-outline"
        size={14}
        color={onDark ? COLORS.slateSoft : COLORS.slate}
      />
      <Text
        className={`font-sans-semibold ml-1.5 text-[12px] ${
          onDark ? 'text-slate-soft' : 'text-slate'
        }`}>
        Sign out
      </Text>
    </Touchable>
  );
}
