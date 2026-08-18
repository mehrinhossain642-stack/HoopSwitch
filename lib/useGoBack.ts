import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

/**
 * Back handler that always has somewhere to go.
 *
 * `router.back()` throws "The action 'GO_BACK' was not handled by any navigator"
 * whenever the history is empty, which is routine rather than exceptional here:
 * every screen reached by `router.replace()` starts with no entry behind it
 * (launch → welcome, launch → sign-in on an expired session, sign-up →
 * onboarding), and so does any screen opened directly by deep link or by typing
 * a URL in the web build.
 *
 * Callers pass the screen that logically sits behind them, and it's used only
 * when there's no real history to pop.
 */
export function useGoBack(fallback: Href): () => void {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    // replace, not push: this stands in for a back step, so it shouldn't add to
    // the history it's compensating for.
    router.replace(fallback);
  }, [router, fallback]);
}
