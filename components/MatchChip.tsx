import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import type { ApiMatch } from '../lib/api';
import { COLORS } from '../lib/theme';

type MatchChipProps = {
  score: number;
  /** Scoring is server-side now, so the tier comes off the API payload. */
  tier: ApiMatch['tier'];
  reason: string;
};

/**
 * Core fit indicator: percentage on the left, short reason on the right.
 * Green when the tier is `good`, amber otherwise.
 */
export function MatchChip({ score, tier, reason }: MatchChipProps) {
  const isGood = tier === 'good';
  const accent = isGood ? COLORS.good : COLORS.partial;

  return (
    <View
      className="flex-row items-center self-start rounded-full px-2.5 py-1.5"
      style={{ backgroundColor: isGood ? 'rgba(31,169,113,0.10)' : 'rgba(232,163,61,0.12)' }}>
      <Ionicons
        name={isGood ? 'checkmark-circle' : 'alert-circle'}
        size={14}
        color={accent}
      />
      <Text className="font-sans-bold ml-1.5 text-[13px]" style={{ color: accent }}>
        {score}%
      </Text>
      <View className="mx-2 h-3 w-px" style={{ backgroundColor: accent, opacity: 0.3 }} />
      <Text
        className="font-sans-medium text-[12px]"
        style={{ color: accent }}
        numberOfLines={1}>
        {reason}
      </Text>
    </View>
  );
}
