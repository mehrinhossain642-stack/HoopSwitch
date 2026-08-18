import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { useThemeColors } from '../lib/theme';
import { Button } from './Button';
import { Content, Screen } from './Screen';
import { FeedSkeleton } from './Skeleton';

/**
 * First-load state. Renders the feed's own shape as skeletons rather than a
 * centred spinner, so arriving data doesn't reflow the screen.
 */
export function ScreenLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <Screen>
      <Content className="pt-5" accessibilityLabel={`${label}…`}>
        <FeedSkeleton />
      </Content>
    </Screen>
  );
}

/**
 * Full-screen error with a retry. Network failures are the common case here
 * (Rails not running, or the phone can't reach the laptop), so the message from
 * the API layer is shown verbatim rather than flattened to "Something failed".
 */
export function ScreenError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const colors = useThemeColors();

  return (
    <Screen>
      <View className="flex-1 items-center justify-center">
        <Content className="items-center">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-danger-soft">
            <Ionicons name="cloud-offline-outline" size={26} color={colors.danger} />
          </View>

          <Text className="font-display mt-4 text-center text-[19px] text-ink">
            Couldn&apos;t load
          </Text>
          <Text className="font-sans mt-2 max-w-[380px] text-center text-[13px] leading-[19px] text-slate">
            {message}
          </Text>

          {onRetry ? (
            <Button
              label="Try again"
              icon="refresh"
              onPress={onRetry}
              fullWidth={false}
              className="mt-5"
            />
          ) : null}
        </Content>
      </View>
    </Screen>
  );
}

/** Inline banner for a non-blocking failure (e.g. a mutation that didn't stick). */
export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const colors = useThemeColors();

  return (
    <View
      className="mb-3 flex-row items-center rounded-btn border border-danger/25 bg-danger-soft px-3 py-2.5"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite">
      <Ionicons name="alert-circle" size={16} color={colors.danger} />
      <Text className="font-sans-medium ml-2 flex-1 text-[12px] leading-[17px] text-danger">
        {message}
      </Text>
      {onRetry ? (
        <Button label="Retry" variant="ghost" size="sm" onPress={onRetry} fullWidth={false} />
      ) : null}
    </View>
  );
}

/**
 * Empty result set. Always says what to do next — an empty feed with no route
 * forward is the moment a user decides the app is broken.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  const colors = useThemeColors();

  return (
    <View className="items-center rounded-card border border-dashed border-border-strong bg-surface px-6 py-9">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-mist">
        <Ionicons name={icon} size={22} color={colors.slate} />
      </View>
      <Text className="font-display mt-3.5 text-center text-[16px] text-ink">{title}</Text>
      <Text className="font-sans mt-1.5 max-w-[320px] text-center text-[13px] leading-[19px] text-slate">
        {body}
      </Text>
      {action ? <View className="mt-4">{action}</View> : null}
    </View>
  );
}
