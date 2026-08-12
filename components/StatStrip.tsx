import { Text, View } from 'react-native';

export type Stat = { value: string | number; label: string };

type Size = 'sm' | 'md' | 'lg';

const VALUE: Record<Size, string> = {
  sm: 'text-[20px] leading-[22px]',
  md: 'text-[26px] leading-[28px]',
  lg: 'text-[34px] leading-[36px]',
};

const CAPTION: Record<Size, string> = {
  sm: 'text-[10px]',
  md: 'text-[11px]',
  lg: 'text-[12px]',
};

const PAD: Record<Size, string> = { sm: 'py-2', md: 'py-3', lg: 'py-3.5' };

/**
 * Scoreboard row — condensed numerals over wide-tracked captions, divided into
 * equal cells. This is the app's stat vocabulary: the same strip appears on
 * feed cards, profile heroes and team panels, at three sizes.
 */
export function StatStrip({
  stats,
  tone = 'light',
  size = 'md',
  className = '',
}: {
  stats: Stat[];
  tone?: 'light' | 'dark' | 'plain';
  size?: Size;
  className?: string;
}) {
  const surface =
    tone === 'dark'
      ? 'bg-ink-900 border border-ink-700'
      : tone === 'light'
        ? 'bg-mist'
        : '';
  const divider = tone === 'dark' ? 'bg-ink-700' : 'bg-border';
  const valueColor = tone === 'dark' ? 'text-surface' : 'text-ink';
  const captionColor = tone === 'dark' ? 'text-slate-soft' : 'text-slate';

  return (
    <View className={`flex-row rounded-md ${surface} ${PAD[size]} ${className}`}>
      {stats.map((stat, index) => (
        <View key={stat.label} className="flex-1 flex-row items-center">
          <View className="flex-1 items-center">
            <Text className={`font-stat tracking-stat ${VALUE[size]} ${valueColor}`}>
              {stat.value}
            </Text>
            <Text
              className={`font-sans-semibold mt-0.5 tracking-eyebrow ${CAPTION[size]} ${captionColor}`}>
              {stat.label.toUpperCase()}
            </Text>
          </View>

          {index < stats.length - 1 ? (
            <View className={`h-6 w-px ${divider}`} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

/**
 * Label-above-value strip for specification data (ideal height, weight,
 * minutes). Distinct from `StatStrip` on purpose — specs are requirements, so
 * the caption leads and the value is the answer.
 */
export function SpecStrip({
  specs,
  tone = 'light',
  className = '',
}: {
  specs: Stat[];
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const surface =
    tone === 'dark' ? 'bg-ink-800 border border-ink-700' : 'bg-mist border border-border';
  const divider = tone === 'dark' ? 'bg-ink-700' : 'bg-border-strong';
  const valueColor = tone === 'dark' ? 'text-surface' : 'text-ink';
  const captionColor = tone === 'dark' ? 'text-slate-soft' : 'text-slate';

  return (
    <View className={`flex-row rounded-md py-2.5 ${surface} ${className}`}>
      {specs.map((spec, index) => (
        <View key={spec.label} className="flex-1 flex-row items-center">
          <View className="flex-1 items-center px-1">
            <Text
              className={`font-sans-semibold text-[9px] tracking-eyebrow ${captionColor}`}
              numberOfLines={1}>
              {spec.label.toUpperCase()}
            </Text>
            <Text
              className={`font-stat mt-1 text-[18px] leading-[18px] tracking-stat ${valueColor}`}
              numberOfLines={1}>
              {spec.value}
            </Text>
          </View>

          {index < specs.length - 1 ? <View className={`h-8 w-px ${divider}`} /> : null}
        </View>
      ))}
    </View>
  );
}
