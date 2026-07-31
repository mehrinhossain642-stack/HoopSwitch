import { Text, View } from 'react-native';
import type { Position } from '../data/types';

type PositionBadgeProps = {
  position: Position;
  /** `dark` inverts to the ink-filled treatment used on hero rows. */
  variant?: 'default' | 'dark';
};

/** Small PG/SG/SF/PF/C pill. */
export function PositionBadge({ position, variant = 'default' }: PositionBadgeProps) {
  const isDark = variant === 'dark';
  return (
    <View className={`rounded-md px-1.5 py-0.5 ${isDark ? 'bg-ink' : 'bg-bg border border-border'}`}>
      <Text
        className={`font-sans-bold text-[11px] tracking-wide ${isDark ? 'text-surface' : 'text-slate'}`}>
        {position}
      </Text>
    </View>
  );
}
