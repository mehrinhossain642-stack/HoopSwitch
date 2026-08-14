import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSession } from '../lib/session';
import { COLORS } from '../lib/theme';
import { Card } from './Card';
import { ConfirmDialog } from './ConfirmDialog';
import { SectionTitle } from './SectionTitle';

/**
 * Account block for the bottom of both profile screens: who you're signed in
 * as, then signing out.
 *
 * Placed last and spatially separated from everything editable above it, so the
 * one irreversible control on the screen isn't sitting next to the fields people
 * tap all the time.
 */
export function SignOutSection() {
  const { user, signOut } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  function handleConfirm() {
    setSigningOut(true);

    // No navigation and no state update afterwards on purpose: signOut clears
    // the session synchronously before its first await, the route guard sees
    // that and redirects, and this component unmounts with the rest of the
    // group. Anything after the await would be setting state on a dead tree.
    void signOut();
  }

  return (
    <View className="mt-5">
      <SectionTitle title="Account" className="mb-3" />

      <Card>
        <Text className="font-sans-semibold text-[10px] uppercase tracking-widest text-slate">
          Signed in as
        </Text>
        <Text className="font-sans-semibold mt-1.5 text-[14px] text-ink" numberOfLines={1}>
          {user?.email ?? 'Unknown account'}
        </Text>
        <Text className="font-sans mt-0.5 text-[12px] text-slate">
          {user?.role === 'coach' ? 'Coach account' : 'Player account'}
        </Text>
      </Card>

      <Pressable
        onPress={() => setConfirming(true)}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        className="mt-3 h-12 flex-row items-center justify-center rounded-btn border border-danger/25 bg-danger-soft"
        style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
        <Ionicons name="log-out-outline" size={17} color={COLORS.danger} />
        <Text className="font-sans-bold ml-2 text-[14px] text-danger">Sign out</Text>
      </Pressable>

      <ConfirmDialog
        visible={confirming}
        icon="log-out-outline"
        destructive
        busy={signingOut}
        title="Sign out?"
        body="You'll need your email and password to get back in. Nothing on your profile is deleted."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />
    </View>
  );
}
