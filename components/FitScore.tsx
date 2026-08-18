import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import type { ApiMatch } from '../lib/api';
import { useTierColors } from '../lib/theme';
import { SegmentMeter } from './Meter';

type Tier = ApiMatch['tier'];

/**
 * The app's signature component. Server-side fit scoring is the whole product,
 * so the score gets typographic weight (condensed numerals at display size), a
 * segment meter, and a stated reason — never a pastel chip that reads as
 * decoration.
 *
 * Tier drives colour, and the label states the tier in words too, so the meaning
 * survives for anyone who can't separate the green from the amber.
 */
export function FitScore({
  score,
  tier,
  reason,
  variant = 'bar',
}: {
  /** 0–100, server-scored. */
  score: number;
  tier: Tier;
  /** Short explanation from the API, e.g. "height + production". */
  reason?: string;
  variant?: 'inline' | 'bar' | 'hero';
}) {
  const tiers = useTierColors();
  const color = tiers.color(tier);
  const rounded = Math.round(score);
  const label = tiers.label(tier);
  const a11y = `Fit score ${rounded} out of 100. ${label}${reason ? `. ${reason}` : ''}`;

  if (variant === 'inline') {
    return (
      <View
        className="flex-row items-center self-start rounded-full py-1 pl-2 pr-2.5"
        style={{ backgroundColor: tiers.soft(tier) }}
        accessibilityLabel={a11y}>
        <Ionicons
          name={tier === 'good' ? 'checkmark-circle' : 'alert-circle'}
          size={13}
          color={color}
        />
        <Text className="font-stat-bold ml-1.5 text-[16px] tracking-stat" style={{ color }}>
          {rounded}
        </Text>
        <Text className="font-stat ml-1 text-[12px] tracking-eyebrow" style={{ color }}>
          FIT
        </Text>
        {reason ? (
          <Text
            className="font-sans-medium ml-2 text-[11px] text-slate"
            numberOfLines={1}
            style={{ maxWidth: 150 }}>
            {reason}
          </Text>
        ) : null}
      </View>
    );
  }

  if (variant === 'hero') {
    return (
      <View className="w-full" accessibilityLabel={a11y}>
        <View className="flex-row items-end">
          <Text
            className="font-stat-bold text-[56px] leading-[54px] tracking-stat"
            style={{ color }}>
            {rounded}
          </Text>
          <View className="ml-2.5 pb-1.5">
            <Text className="font-stat text-[15px] tracking-eyebrow text-slate">FIT SCORE</Text>
            <Text className="font-sans-bold text-[13px]" style={{ color }}>
              {label}
            </Text>
          </View>
        </View>

        <View className="mt-3">
          <SegmentMeter score={rounded} color={color} height={8} />
        </View>

        {reason ? (
          <Text className="font-sans mt-2.5 text-[13px] leading-[18px] text-slate">
            Driven by {reason}.
          </Text>
        ) : null}
      </View>
    );
  }

  // `bar` — the card-footer read: number, meter, reason on one baseline.
  return (
    <View className="flex-1" accessibilityLabel={a11y}>
      <View className="flex-row items-center">
        <Text className="font-stat-bold text-[30px] leading-[30px] tracking-stat" style={{ color }}>
          {rounded}
        </Text>
        <Text className="font-stat ml-1 pt-1.5 text-[12px] tracking-eyebrow text-slate">FIT</Text>

        <View className="ml-3 flex-1">
          <SegmentMeter score={rounded} color={color} />
        </View>
      </View>

      {reason ? (
        <Text className="font-sans mt-1.5 text-[11px] text-slate" numberOfLines={1}>
          {label} · {reason}
        </Text>
      ) : null}
    </View>
  );
}
