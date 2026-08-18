import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONTENT_MAX_WIDTH, useLayout } from '../../lib/layout';
import { COLORS } from '../../lib/theme';
import { Button } from '../Button';
import { Screen } from '../Screen';
import { InlineError } from '../ScreenState';
import { Touchable } from '../Touchable';

export const TOTAL_STEPS = 4;

/** Shared chrome for the "Create your profile" steps. */
export function StepScaffold({
  step,
  title,
  subtitle,
  ctaLabel = 'Continue',
  onContinue,
  submitting = false,
  error = null,
  canContinue = true,
  children,
}: {
  /** 1-based, drives both the progress bar and the "Step N of 4" caption. */
  step: number;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onContinue: () => void;
  submitting?: boolean;
  error?: string | null;
  /** Disables the CTA when required fields are missing. */
  canContinue?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { gutter, isDesktop } = useLayout();

  const column = {
    width: '100%' as const,
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center' as const,
    paddingHorizontal: gutter,
  };

  return (
    <Screen edges={[]}>
      {/* Same ink slab as the rest of the app, so onboarding doesn't read as a
          separate white-label flow bolted onto the front. */}
      <View className="bg-chrome" style={{ paddingTop: isDesktop ? 18 : insets.top + 6 }}>
        <View style={column}>
          <View className="h-12 flex-row items-center">
            <Touchable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="h-9 w-9 items-center justify-center rounded-full bg-chrome-raised">
              <Ionicons name="chevron-back" size={18} color={COLORS.chromeText} />
            </Touchable>

            <Text className="font-stat flex-1 text-center text-[15px] tracking-eyebrow text-chrome-text">
              CREATE YOUR PROFILE
            </Text>

            <View className="min-w-[36px] items-end">
              <Text className="font-stat text-[15px] tracking-stat text-chrome-text-muted">
                {step}/{TOTAL_STEPS}
              </Text>
            </View>
          </View>

          <ProgressBar step={step} />
        </View>

        <View className="mt-3.5 h-[3px] bg-primary" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ ...column, paddingTop: 22, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text className="font-stat text-[15px] tracking-eyebrow text-primary">
            STEP {step} OF {TOTAL_STEPS}
          </Text>

          <Text
            className="font-display mt-1.5 text-[26px] leading-[32px] text-ink"
            style={{ letterSpacing: -0.5 }}
            accessibilityRole="header">
            {title}
          </Text>
          <Text className="font-sans mb-6 mt-2 text-[14px] leading-[20px] text-slate">
            {subtitle}
          </Text>

          {error ? <InlineError message={error} /> : null}

          {children}
        </ScrollView>

        {/* Pinned, so the way forward is always visible however long the step is. */}
        <View
          className="border-t border-border bg-surface"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <View style={{ ...column, paddingTop: 12 }}>
            <Button
              label={ctaLabel}
              size="lg"
              icon="arrow-forward"
              iconTrailing
              loading={submitting}
              disabled={!canContinue}
              onPress={onContinue}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/** Four segments; completed ones fill orange. */
function ProgressBar({ step }: { step: number }) {
  return (
    <View
      className="mt-1 flex-row gap-1.5"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: TOTAL_STEPS, now: step }}>
      {Array.from({ length: TOTAL_STEPS }, (_, index) => (
        <View
          key={index}
          className={`h-[5px] flex-1 rounded-full ${
            index < step ? 'bg-primary' : 'bg-chrome-border'
          }`}
        />
      ))}
    </View>
  );
}
