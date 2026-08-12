import { Text, View } from 'react-native';
import type { Position } from '../data/types';

type Tone = 'default' | 'dark' | 'primary' | 'onDark';
type Size = 'sm' | 'md' | 'lg';

const FILL: Record<Tone, string> = {
  default: 'bg-mist',
  dark: 'bg-ink',
  primary: 'bg-primary',
  onDark: 'bg-ink-700',
};

const LABEL: Record<Tone, string> = {
  default: 'text-ink',
  dark: 'text-surface',
  primary: 'text-surface',
  onDark: 'text-surface',
};

const BOX: Record<Size, string> = {
  sm: 'h-[22px] min-w-[28px] px-1.5',
  md: 'h-[26px] min-w-[34px] px-2',
  lg: 'h-[34px] min-w-[44px] px-2.5',
};

const TEXT: Record<Size, string> = {
  sm: 'text-[14px]',
  md: 'text-[16px]',
  lg: 'text-[21px]',
};

/**
 * PG/SG/SF/PF/C badge. Set in the condensed face — position codes are the most
 * repeated token in the app, and the squared-off numerals-style treatment is
 * what makes them read as roster shorthand rather than generic tags.
 */
export function PositionBadge({
  position,
  tone = 'default',
  size = 'md',
}: {
  position: Position;
  tone?: Tone;
  size?: Size;
}) {
  return (
    <View
      className={`items-center justify-center rounded-badge ${FILL[tone]} ${BOX[size]}`}
      accessibilityLabel={`Position ${position}`}>
      <Text className={`font-stat tracking-stat ${LABEL[tone]} ${TEXT[size]}`}>{position}</Text>
    </View>
  );
}
