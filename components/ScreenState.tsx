import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../lib/theme';

/** Full-screen spinner for a first load. */
export function ScreenLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={COLORS.primary} />
        <Text className="font-sans mt-3 text-[13px] text-slate">{label}…</Text>
      </View>
    </SafeAreaView>
  );
}

/**
 * Full-screen error with a retry. Network failures are the common case here
 * (Rails not running, or the phone can't reach the laptop), so the message from
 * the API layer is shown verbatim rather than flattened to "Something failed".
 */
export function ScreenError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-1 items-center justify-center px-8">
        <Ionicons name="cloud-offline-outline" size={30} color={COLORS.slate} />
        <Text className="font-display mt-3 text-[17px] text-ink">Couldn&apos;t load</Text>
        <Text className="font-sans mt-2 text-center text-[13px] leading-[19px] text-slate">
          {message}
        </Text>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            className="mt-5 rounded-btn bg-primary px-5 py-3"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <Text className="font-sans-bold text-[14px] text-surface">Try again</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

/** Inline banner for a non-blocking failure (e.g. a mutation that didn't stick). */
export function InlineError({ message }: { message: string }) {
  return (
    <View className="mb-3 flex-row items-center rounded-btn border border-primary/30 bg-primary/10 px-3 py-2">
      <Ionicons name="alert-circle-outline" size={15} color={COLORS.primary} />
      <Text className="font-sans ml-2 flex-1 text-[12px] text-primary">{message}</Text>
    </View>
  );
}
