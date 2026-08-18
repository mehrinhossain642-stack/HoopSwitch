import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import { IndeterminateBar } from '../components/Meter';
import { useLayout } from '../lib/layout';
import { useSession } from '../lib/session';

/**
 * Launch screen.
 *
 * A real launch screen, not a landing page: it holds the brand while the stored
 * session is read back, then routes. Signed in goes to the right home (or back
 * into onboarding if it was abandoned); signed out goes to role selection, where
 * the "get started vs sign in" choice actually belongs.
 *
 * It fills the viewport rather than rendering a fixed-size frame, so it's correct
 * on a small phone, a tablet and a maximised browser window alike.
 */
export default function LaunchScreen() {
  const { user, restoring, landingRoute } = useSession();
  const { isTablet } = useLayout();

  useEffect(() => {
    // Nothing to decide until the persisted session has been read.
    if (restoring) return;

    let cancelled = false;

    if (!user) {
      router.replace('/auth/welcome');
      return;
    }

    landingRoute().then((route) => {
      if (!cancelled) router.replace(route);
    });

    return () => {
      cancelled = true;
    };
  }, [restoring, user, landingRoute]);

  // Scales with the viewport instead of the old hardcoded 62px/27px pair, which
  // looked lost on a tablet and cramped on a small phone.
  const markSize = isTablet ? 92 : 76;
  const wordmarkWidth = isTablet ? 260 : 216;

  return (
    <View className="flex-1 items-center justify-center bg-chrome px-8">
      <View className="items-center">
        <Image
          source={require('../assets/hoopswitch-icon.png')}
          resizeMode="contain"
          accessibilityLabel="HoopSwitch"
          style={{ width: markSize, height: markSize, borderRadius: markSize * 0.22 }}
        />

        <View className="mt-6 h-[3px] w-11 rounded-full bg-primary" />

        <Image
          source={require('../assets/hoopswitch_logo_transparent.png')}
          resizeMode="contain"
          // 7.184:1 native aspect, held explicitly so the mark can't shift layout
          // as it decodes.
          style={{ width: wordmarkWidth, height: wordmarkWidth / 7.184, marginTop: 22 }}
        />

        <Text className="font-stat mt-5 text-center text-[16px] tracking-eyebrow text-chrome-text-muted">
          CONNECT · COMPETE · GET RECRUITED
        </Text>
      </View>

      {/* Pinned low so the mark stays optically centred while the bar reports
          progress. Absolute, so it can't nudge the lockup as it appears. */}
      <View className="absolute bottom-0 left-0 right-0 items-center pb-16">
        <IndeterminateBar width={132} />
      </View>
    </View>
  );
}
