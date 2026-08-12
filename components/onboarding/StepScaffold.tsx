import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/theme';
import { InlineError } from '../ScreenState';

export const TOTAL_STEPS = 4;

type StepScaffoldProps = {
  /** 1-based, drives both the progress bar and the "N of 4" caption. */
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
};

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
}: StepScaffoldProps) {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-row items-center px-5 pb-2 pt-1">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="h-10 w-10 items-center justify-start"
            accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
          </Pressable>
          <Text className="font-sans-semibold flex-1 text-center text-[15px] text-ink">
            Create your profile
          </Text>
          {/* Balances the back button so the title stays optically centred. */}
          <View className="h-10 w-10" />
        </View>

        <ProgressBar step={step} />

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text className="font-sans mb-3 mt-3 text-[12px] text-slate">
            {step} of {TOTAL_STEPS}
          </Text>

          <Text className="font-display text-[26px] leading-[32px] text-ink">{title}</Text>
          <Text className="font-sans mb-6 mt-1.5 text-[13px] leading-[19px] text-slate">
            {subtitle}
          </Text>

          {error ? <InlineError message={error} /> : null}

          {children}
        </ScrollView>

        <View className="border-t border-border px-5 pb-2 pt-3">
          <Pressable
            onPress={onContinue}
            disabled={submitting || !canContinue}
            className={`items-center justify-center rounded-btn py-4 ${
              canContinue && !submitting ? 'bg-primary' : 'bg-primary/40'
            }`}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            {submitting ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <Text className="font-sans-bold text-[15px] text-surface">{ctaLabel}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Four segments; completed ones fill orange. */
function ProgressBar({ step }: { step: number }) {
  return (
    <View className="flex-row gap-2 px-5">
      {Array.from({ length: TOTAL_STEPS }, (_, index) => (
        <View
          key={index}
          className={`h-1 flex-1 rounded-full ${index < step ? 'bg-primary' : 'bg-border'}`}
        />
      ))}
    </View>
  );
}
