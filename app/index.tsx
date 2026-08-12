import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Touchable } from '../components/Touchable';
import { CONTENT_MAX_WIDTH, useLayout } from '../lib/layout';
import { useSession } from '../lib/session';

export default function SplashScreen() {
  const { user, restoring, landingRoute } = useSession();
  const insets = useSafeAreaInsets();
  const { gutter, isDesktop } = useLayout();

  // A stored session should skip the sign-in gate entirely — otherwise
  // persisting the JWT buys nothing and every cold start asks for a password.
  // A player who abandoned onboarding resumes it instead of entering the app.
  useEffect(() => {
    if (restoring || !user) return;

    let cancelled = false;
    landingRoute().then((route) => {
      if (!cancelled) router.replace(route);
    });
    return () => {
      cancelled = true;
    };
  }, [restoring, user, landingRoute]);

  return (
    <View className="flex-1 bg-ink-900">
      <ImageBackground
        source={require('../assets/splash-bg.png')}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}>
        {/* Two scrims: a flat wash to seat the photo into the ink palette, and a
            bottom-weighted gradient that gives the copy a solid base to sit on
            without hiding the court. */}
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(13,14,17,0.42)' }]}
        />
        <LinearGradient
          colors={['rgba(13,14,17,0)', 'rgba(13,14,17,0.82)', 'rgba(13,14,17,0.98)']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </ImageBackground>

      {/* Content is bottom-anchored: the photo gets the top of the frame and the
          action sits under the thumb. */}
      <View className="flex-1 justify-end">
        <View
          className="w-full self-center"
          style={{
            maxWidth: CONTENT_MAX_WIDTH,
            paddingHorizontal: gutter,
            paddingBottom: Math.max(insets.bottom, 20) + 12,
          }}>
          <View className="h-[3px] w-11 rounded-full bg-primary" />

          <Image
            source={require('../assets/hoopswitch_logo_transparent.png')}
            resizeMode="contain"
            accessibilityLabel="HoopSwitch"
            // 7.184:1 native aspect — held explicitly so the mark can't shift
            // layout as it decodes.
            style={{ width: isDesktop ? 268 : 232, height: (isDesktop ? 268 : 232) / 7.184, marginTop: 18 }}
          />

          <Text
            className="font-display mt-5 text-[32px] leading-[38px] text-surface"
            style={{ letterSpacing: -0.8 }}>
            Connect. Compete.{'\n'}Get recruited.
          </Text>

          <Text className="font-sans mt-3 max-w-[420px] text-[14px] leading-[21px] text-slate-soft">
            The recruiting network where every roster spot is scored against your
            game — so you know the fit before you apply.
          </Text>

          <Button
            label="Get started"
            icon="arrow-forward"
            iconTrailing
            size="lg"
            onPress={() => router.push('/auth/welcome')}
            className="mt-7"
          />

          <Touchable
            onPress={() => router.push('/auth/sign-in')}
            accessibilityRole="button"
            accessibilityLabel="Sign in to an existing account"
            scaleTo={1}
            dimTo={0.6}
            className="mt-4 h-11 items-center justify-center">
            <Text className="font-sans text-[13px] text-slate-soft">
              Already have an account?{' '}
              <Text className="font-sans-bold text-surface">Sign in</Text>
            </Text>
          </Touchable>
        </View>
      </View>
    </View>
  );
}
