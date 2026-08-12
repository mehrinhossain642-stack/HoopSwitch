import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONTENT_MAX_WIDTH, useLayout } from '../lib/layout';
import { COLORS } from '../lib/theme';
import { Wordmark } from './AppHeader';
import { Screen } from './Screen';
import { Touchable } from './Touchable';

type AuthScaffoldProps = {
  /** Small uppercase line above the title. */
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /** Hides the back control on the flow's first screen. */
  showBack?: boolean;
};

/**
 * Shared chrome for the auth flow: the same ink slab the signed-in app uses, so
 * signing in doesn't feel like a different product from the one behind it.
 */
export function AuthScaffold({
  eyebrow,
  title,
  subtitle,
  children,
  showBack = true,
}: AuthScaffoldProps) {
  const insets = useSafeAreaInsets();
  const { gutter, isDesktop } = useLayout();

  return (
    <Screen edges={[]}>
      <View className="bg-ink-900" style={{ paddingTop: isDesktop ? 18 : insets.top + 6 }}>
        <View
          className="w-full self-center"
          style={{ maxWidth: CONTENT_MAX_WIDTH, paddingHorizontal: gutter }}>
          <View className="h-12 flex-row items-center justify-between">
            {showBack ? (
              <Touchable
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                className="h-9 w-9 items-center justify-center rounded-full bg-ink-700">
                <Ionicons name="chevron-back" size={18} color={COLORS.surface} />
              </Touchable>
            ) : (
              <View className="h-9 w-9" />
            )}

            <Wordmark size={17} onDark />

            {/* Balances the back control so the wordmark stays optically centred. */}
            <View className="h-9 w-9" />
          </View>
        </View>

        <View className="h-[3px] bg-primary" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            width: '100%',
            maxWidth: 520,
            alignSelf: 'center',
            paddingHorizontal: gutter,
            paddingTop: 26,
            paddingBottom: Math.max(insets.bottom, 20) + 20,
          }}>
          <Text className="font-stat text-[15px] tracking-eyebrow text-primary">
            {eyebrow.toUpperCase()}
          </Text>

          <Text
            className="font-display mt-1.5 text-[28px] leading-[34px] text-ink"
            style={{ letterSpacing: -0.6 }}
            accessibilityRole="header">
            {title}
          </Text>

          <Text className="font-sans mb-7 mt-2 text-[14px] leading-[20px] text-slate">
            {subtitle}
          </Text>

          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/** Rule with a centred label, for separating a form from its alternative path. */
export function OrDivider({ label = 'or' }: { label?: string }) {
  return (
    <View className="my-5 flex-row items-center">
      <View className="h-px flex-1 bg-border" />
      <Text className="font-stat mx-3 text-[13px] tracking-eyebrow text-slate">
        {label.toUpperCase()}
      </Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}
