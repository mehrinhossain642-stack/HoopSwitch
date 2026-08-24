import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayout } from '../../lib/layout';
import { COLORS } from '../../lib/theme';
import { Wordmark } from '../AppHeader';
import { Button } from '../Button';
import { Card } from '../Card';
import { FitScore } from '../FitScore';
import { PositionBadge } from '../PositionBadge';
import { Screen } from '../Screen';
import { SpecStrip } from '../StatStrip';
import { StatusPill } from '../StatusPill';
import { Touchable } from '../Touchable';
import { HeroReveal, ScrollReveal } from './ScrollReveal';

/** Wider than the app's reading column — marketing sections want the room. */
const PAGE_MAX = 1080;

const FEATURES = [
  {
    icon: 'speedometer-outline' as const,
    title: 'Scored, not guessed',
    body: 'Every opening gets a fit score against your actual measurements and production — and tells you which part drove it.',
  },
  {
    icon: 'swap-horizontal-outline' as const,
    title: 'Every side of the court',
    body: 'Players see openings ranked by fit. Coaches see candidates ranked against one slot. Parents keep track of approvals and invitations.',
  },
  {
    icon: 'videocam-outline' as const,
    title: 'Your tape, front and centre',
    body: 'Highlights and season stats live on your profile, so a coach evaluating you has everything in one place.',
  },
];

const STEPS = [
  {
    title: 'Build your profile',
    body: 'Height, weight, wingspan, position, production. Two minutes.',
  },
  {
    title: 'See openings ranked by fit',
    body: 'Every roster spot scored against you, best fit first, with the reason attached.',
  },
  {
    title: 'Apply where you fit',
    body: "The coach sees you scored against the exact slot they're trying to fill.",
  },
];

/**
 * Marketing landing page — the web entry point.
 *
 * Only rendered on web, and only for visitors without a session: a phone app
 * should open into the product, not a pitch for it. Everything is built from the
 * app's own components, so the page can't drift from what it's advertising — the
 * hero card is a real `FitScore` and a real `SpecStrip`.
 */
export function LandingPage() {
  const { isTablet, isDesktop, gutter } = useLayout();
  const insets = useSafeAreaInsets();

  const column = {
    width: '100%' as const,
    maxWidth: PAGE_MAX,
    alignSelf: 'center' as const,
    paddingHorizontal: gutter,
  };

  const heroSize = isDesktop ? 60 : isTablet ? 48 : 34;
  const heroLead = isDesktop ? 62 : isTablet ? 52 : 40;

  const start = () => router.push('/auth/welcome');
  const signIn = () => router.push('/auth/sign-in');

  return (
    <Screen edges={[]} className="bg-chrome">
      {/* Outside the ScrollView rather than position:sticky — a plain sibling is
          always pinned, with no CSS the RN style types don't model. */}
      <View
        className="border-b border-chrome-border bg-chrome"
        style={{ paddingTop: insets.top + 8 }}>
        <View style={column}>
          <View className="h-14 flex-row items-center justify-between">
            <Wordmark size={20} onDark />

            <View className="flex-row items-center">
              <Touchable
                onPress={signIn}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                scaleTo={1}
                dimTo={0.6}
                className="h-10 justify-center px-3">
                <Text className="font-sans-semibold text-[13px] text-chrome-text">Sign in</Text>
              </Touchable>

              <Button
                label="Get started"
                size="sm"
                onPress={start}
                fullWidth={false}
                className="ml-1"
              />
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ---------- Hero ---------- */}
        <View className="bg-chrome pb-16 pt-12 md:pb-24 md:pt-20">
          <View style={column}>
            <View className={isDesktop ? 'flex-row items-center' : ''}>
              <View className={isDesktop ? 'flex-1 pr-12' : ''}>
                <HeroReveal>
                  <Text className="font-stat text-[15px] tracking-eyebrow text-primary">
                    THE BASKETBALL TRANSFER PORTAL
                  </Text>
                </HeroReveal>

                <HeroReveal delay={90}>
                  <Text
                    className="font-display mt-4 text-chrome-text"
                    style={{ fontSize: heroSize, lineHeight: heroLead, letterSpacing: -1.2 }}
                    accessibilityRole="header">
                    You&apos;re not short on openings.{'\n'}
                    You&apos;re short on <Text className="text-primary">fit</Text>.
                  </Text>
                </HeroReveal>

                <HeroReveal delay={180}>
                  <Text className="font-sans mt-5 max-w-[520px] text-[16px] leading-[25px] text-chrome-text-muted">
                    HoopSwitch scores every open roster spot against your actual game — height,
                    weight, position, production — so you apply where you&apos;ll actually play.
                  </Text>
                </HeroReveal>

                <HeroReveal delay={260}>
                  <View className={`mt-8 ${isTablet ? 'flex-row items-center' : ''}`}>
                    <Button
                      label="Get started"
                      size="lg"
                      icon="arrow-forward"
                      iconTrailing
                      onPress={start}
                      fullWidth={!isTablet}
                      className={isTablet ? 'px-7' : ''}
                    />
                    <Touchable
                      onPress={signIn}
                      accessibilityRole="button"
                      accessibilityLabel="Sign in to an existing account"
                      scaleTo={1}
                      dimTo={0.6}
                      className={`h-[52px] items-center justify-center ${
                        isTablet ? 'ml-5 px-2' : 'mt-3'
                      }`}>
                      <Text className="font-sans-semibold text-[14px] text-chrome-text">
                        I already have an account
                      </Text>
                    </Touchable>
                  </View>
                </HeroReveal>

                <HeroReveal delay={340}>
                  <Text className="font-sans mt-6 text-[12px] text-chrome-text-muted">
                    Free while we&apos;re in beta · Players, coaches and parents
                  </Text>
                </HeroReveal>
              </View>

              {/* The product's own output as the hero visual — the fastest way to
                  explain "fit score" is to show one. */}
              <HeroReveal delay={420} className={isDesktop ? 'w-[380px]' : 'mt-12'}>
                <ExampleCard />
              </HeroReveal>
            </View>
          </View>
        </View>

        {/* ---------- Body (light) ---------- */}
        <View className="bg-bg pb-20 pt-16 md:pt-24">
          <View style={column}>
            {/* Features */}
            <ScrollReveal>
              <Text
                className="font-display max-w-[620px] text-ink"
                style={{
                  fontSize: isTablet ? 34 : 26,
                  lineHeight: isTablet ? 42 : 34,
                  letterSpacing: -0.8,
                }}
                accessibilityRole="header">
                Recruiting runs on guesswork. This doesn&apos;t.
              </Text>
            </ScrollReveal>

            <View className={`mt-10 ${isTablet ? 'flex-row' : ''}`}>
              {FEATURES.map((feature, index) => (
                <ScrollReveal
                  key={feature.title}
                  delay={index * 110}
                  className={isTablet ? 'flex-1' : ''}
                  style={
                    isTablet
                      ? { marginRight: index < FEATURES.length - 1 ? 20 : 0 }
                      : { marginBottom: 14 }
                  }>
                  <Card className="h-full">
                    <View className="h-11 w-11 items-center justify-center rounded-md bg-primary-soft">
                      <Ionicons name={feature.icon} size={21} color={COLORS.primary} />
                    </View>
                    <Text className="font-display mt-4 text-[17px] text-ink">
                      {feature.title}
                    </Text>
                    <Text className="font-sans mt-2 text-[14px] leading-[21px] text-slate">
                      {feature.body}
                    </Text>
                  </Card>
                </ScrollReveal>
              ))}
            </View>

            {/* How it works */}
            <ScrollReveal className="mt-24">
              <Text className="font-stat text-[15px] tracking-eyebrow text-primary">
                HOW IT WORKS
              </Text>
              <Text
                className="font-display mt-3 max-w-[620px] text-ink"
                style={{
                  fontSize: isTablet ? 34 : 26,
                  lineHeight: isTablet ? 42 : 34,
                  letterSpacing: -0.8,
                }}
                accessibilityRole="header">
                Three steps, then you&apos;re in the feed.
              </Text>
            </ScrollReveal>

            <View className={`mt-10 ${isTablet ? 'flex-row' : ''}`}>
              {STEPS.map((step, index) => (
                <ScrollReveal
                  key={step.title}
                  delay={index * 110}
                  className={isTablet ? 'flex-1' : ''}
                  style={
                    isTablet
                      ? { marginRight: index < STEPS.length - 1 ? 24 : 0 }
                      : { marginBottom: 22 }
                  }>
                  <View className="border-t-2 border-primary pt-4">
                    <Text className="font-stat-bold text-[32px] leading-[34px] tracking-stat text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                    <Text className="font-display mt-2 text-[17px] text-ink">{step.title}</Text>
                    <Text className="font-sans mt-1.5 text-[14px] leading-[21px] text-slate">
                      {step.body}
                    </Text>
                  </View>
                </ScrollReveal>
              ))}
            </View>
          </View>
        </View>

        {/* ---------- Closing CTA ---------- */}
        <View className="bg-chrome py-20 md:py-28">
          <View style={column}>
            <ScrollReveal>
              <View className="items-center">
                <Text
                  className="font-display text-center text-chrome-text"
                  style={{
                    fontSize: isTablet ? 40 : 28,
                    lineHeight: isTablet ? 48 : 36,
                    letterSpacing: -1,
                  }}
                  accessibilityRole="header">
                  Find out where you fit.
                </Text>
                <Text className="font-sans mt-4 max-w-[460px] text-center text-[15px] leading-[23px] text-chrome-text-muted">
                  Build a profile and every open roster spot gets scored against it.
                  Coaching or supporting an athlete? There&apos;s a side of this for you too.
                </Text>

                <View className="mt-8 w-full max-w-[320px]">
                  <Button
                    label="Get started"
                    size="lg"
                    icon="arrow-forward"
                    iconTrailing
                    onPress={start}
                  />
                </View>
              </View>
            </ScrollReveal>
          </View>
        </View>

        {/* ---------- Footer ---------- */}
        <View
          className="border-t border-chrome-border bg-chrome pt-8"
          style={{ paddingBottom: Math.max(insets.bottom, 24) + 8 }}>
          <View style={column}>
            <View className={isTablet ? 'flex-row items-center justify-between' : ''}>
              <View>
                <Wordmark size={17} onDark />
                <Text className="font-sans mt-2 text-[12px] text-chrome-text-muted">
                  Scored roster openings for players, coaches and parents.
                </Text>
              </View>

              {/* Only real destinations — no placeholder links that go nowhere. */}
              <View className={`flex-row items-center ${isTablet ? '' : 'mt-5'}`}>
                <Touchable
                  onPress={signIn}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in"
                  scaleTo={1}
                  dimTo={0.6}
                  className="h-10 justify-center pr-5">
                  <Text className="font-sans-semibold text-[13px] text-chrome-text-muted">
                    Sign in
                  </Text>
                </Touchable>
                <Touchable
                  onPress={start}
                  accessibilityRole="button"
                  accessibilityLabel="Get started"
                  scaleTo={1}
                  dimTo={0.6}
                  className="h-10 justify-center">
                  <Text className="font-sans-semibold text-[13px] text-primary">Get started</Text>
                </Touchable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

/**
 * Illustrative feed card for the hero.
 *
 * The team is deliberately fictional — putting a real program's name on a
 * marketing page would imply an endorsement that doesn't exist.
 */
function ExampleCard() {
  return (
    <View>
      <Card bare rail={COLORS.good}>
        <View className="p-4">
          <View className="flex-row items-center">
            <View
              className="h-10 w-10 items-center justify-center rounded-md"
              style={{ backgroundColor: '#1E3A6E' }}>
              <Text className="font-stat-bold text-[15px] text-white">NR</Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-sans-bold text-[14px] text-ink">Northside Ravens</Text>
              <Text className="font-sans mt-0.5 text-[11px] text-slate">
                U SPORTS · Example listing
              </Text>
            </View>
            <StatusPill status="open" />
          </View>

          <View className="mt-3.5 flex-row items-start">
            <PositionBadge position="PG" tone="dark" />
            <Text
              className="font-display ml-2.5 flex-1 text-[17px] leading-[23px] text-ink"
              style={{ letterSpacing: -0.2 }}>
              Starting point guard wanted
            </Text>
          </View>

          <SpecStrip
            className="mt-3.5"
            specs={[
              { label: 'Ideal ht', value: `6'1"+` },
              { label: 'Ideal wt', value: '181+' },
              { label: 'Minutes', value: '28 MPG' },
            ]}
          />
        </View>

        <View className="border-t border-border bg-bg px-4 py-3">
          <FitScore score={96} tier="good" reason="height + production" />
        </View>
      </Card>

      <Text className="font-sans mt-3 text-center text-[11px] text-chrome-text-muted">
        Example of a scored opening.
      </Text>
    </View>
  );
}
