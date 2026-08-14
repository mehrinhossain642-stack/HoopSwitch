import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useSession } from './session';

/**
 * Gate for the authenticated route groups.
 *
 * Without it, a screen stays mounted after the session ends and its next fetch
 * runs with no token — which is how signing out used to crash the app rather
 * than just leaving. Guarding the group instead of the individual screens also
 * covers the case nobody clicks: a JWT that expired while the app was
 * backgrounded.
 *
 * Returns false while there's no usable session, so the caller renders nothing
 * and no child screen gets a chance to fetch.
 */
export function useAuthGuard(): boolean {
  const { token, restoring } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Wait for the restore pass to finish — on a cold start into a deep link
    // the token legitimately isn't in state yet.
    if (restoring || token) return;
    router.replace('/');
  }, [restoring, token, router]);

  return !restoring && token !== null;
}
