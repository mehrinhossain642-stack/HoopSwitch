import { Text, View } from 'react-native';

export type Stat = { value: string | number; label: string };

type Size = 'sm' | 'md' | 'lg';

const VALUE: Record<Size, string> = {
  sm: 'text-[21px] leading-[23px]',
  md: 'text-[27px] leading-[29px]',
  lg: 'text-[35px] leading-[37px]',
};

const CAPTION: Record<Size, string> = {
  sm: 'text-[10px]',
  md: 'text-[11px]',
  lg: 'text-[12px]',
};

const PAD: Record<Size, string> = { sm: 'py-2', md: 'py-3', lg: 'py-3.5' };

/**
 * Scoreboard row — condensed numerals over wide-tracked captions, divided into
 * equal cells. This is the app's stat vocabulary: the same strip appears on feed
 * cards, profile heroes and team panels, at three sizes.
 */
export function StatStrip({
  stats,
  tone = 'light',
  size = 'md',
  className = '',
}: {
  stats: Stat[];
  /** `plain` drops the fill, for use directly inside a card. */
  tone?: 'light' | 'dark' | 'plain';
  size?: Size;
  className?: string;
}) {
  const surface =
    tone === 'dark'
      ? 'bg-chrome border border-chrome-border'
      : tone === 'light'
        ? 'bg-mist'
        : '';
  const divider = tone === 'dark' ? 'bg-chrome-border' : 'bg-border';
  const value = tone === 'dark' ? 'text-chrome-text' : 'text-ink';
  const caption = tone === 'dark' ? 'text-chrome-text-muted' : 'text-slate';

  return (
    <View className={`flex-row rounded-md ${surface} ${PAD[size]} ${className}`}>
      {stats.map((stat, index) => (
        <View key={stat.label} className="flex-1 flex-row items-center">
          <View className="flex-1 items-center">
            <Text className={`font-stat-bold tracking-stat ${VALUE[size]} ${value}`}>
              {stat.value}
            </Text>
            <Text
              className={`font-sans-semibold mt-0.5 tracking-eyebrow ${CAPTION[size]} ${caption}`}>
              {stat.label.toUpperCase()}
            </Text>
          </View>

          {index < stats.length - 1 ? <View className={`h-6 w-px ${divider}`} /> : null}
        </View>
      ))}
    </View>
  );
}

/**
 * Label-above-value strip for specification data (ideal height, weight,
 * minutes). Distinct from `StatStrip` on purpose — specs are requirements, so the
 * caption leads and the value answers it.
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
    tone === 'dark'
      ? 'bg-chrome-raised border border-chrome-border'
      : 'bg-mist border border-border';
  const divider = tone === 'dark' ? 'bg-chrome-border' : 'bg-border-strong';
  const value = tone === 'dark' ? 'text-chrome-text' : 'text-ink';
  const caption = tone === 'dark' ? 'text-chrome-text-muted' : 'text-slate';

  return (
    <View className={`flex-row rounded-md py-2.5 ${surface} ${className}`}>
      {specs.map((spec, index) => (
        <View key={spec.label} className="flex-1 flex-row items-center">
          <View className="flex-1 items-center px-1">
            <Text
              className={`font-sans-semibold text-[9px] tracking-eyebrow ${caption}`}
              numberOfLines={1}>
              {spec.label.toUpperCase()}
            </Text>
            <Text
              className={`font-stat-bold mt-1 text-[19px] leading-[19px] tracking-stat ${value}`}
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
