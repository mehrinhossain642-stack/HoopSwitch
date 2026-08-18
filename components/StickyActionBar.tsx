import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONTENT_MAX_WIDTH, useLayout } from '../lib/layout';

/**
 * Pinned bottom action bar for detail screens. The primary action on a long
 * scrolling page shouldn't be buried at the end of it, and pinning also keeps the
 * CTA clear of the gesture area on both platforms.
 *
 * Pair with `STICKY_BAR_CLEARANCE` on the scroll content so nothing hides behind
 * it.
 */
export function StickyActionBar({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { gutter } = useLayout();

  return (
    <View
      className="border-t border-border bg-surface"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <View
        className="w-full flex-row items-center self-center pt-3"
        style={{ maxWidth: CONTENT_MAX_WIDTH, paddingHorizontal: gutter }}>
        {children}
      </View>
    </View>
  );
}

/** Bottom inset that keeps scroll content clear of the pinned bar. */
export const STICKY_BAR_CLEARANCE = 24;
