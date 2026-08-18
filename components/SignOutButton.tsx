import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Text } from 'react-native';
import { useSession } from '../lib/session';
import { useThemeColors } from '../lib/theme';
import { ConfirmDialog } from './ConfirmDialog';
import { Touchable } from './Touchable';

/**
 * Sign out, with a confirmation.
 *
 * Lives on the settings screen rather than the profile, spatially separated from
 * everything editable, so the one irreversible control in the app isn't sitting
 * next to fields people tap all the time.
 */
export function SignOutButton() {
  const { signOut } = useSession();
  const colors = useThemeColors();
  const [confirming, setConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  function handleConfirm() {
    setSigningOut(true);

    // No navigation and no state update afterwards on purpose: signOut clears the
    // session synchronously before its first await, the route guard sees that and
    // redirects, and this component unmounts with the rest of the group. Anything
    // after the await would be setting state on a dead tree.
    void signOut();
  }

  return (
    <>
      <Touchable
        onPress={() => setConfirming(true)}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        className="h-12 flex-row items-center justify-center rounded-btn border border-danger/25 bg-danger-soft">
        <Ionicons name="log-out-outline" size={17} color={colors.danger} />
        <Text className="font-sans-bold ml-2 text-[14px] text-danger">Sign out</Text>
      </Touchable>

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
    </>
  );
}
