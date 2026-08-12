import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { COLORS } from '../lib/theme';
import { Touchable } from './Touchable';

type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Trailing count, e.g. the number of matches behind a filter. */
  count?: number;
  /** Styles for sitting on the ink header slab rather than the page background. */
  onDark?: boolean;
};

/**
 * Filter pill. Selected state is a filled orange chip so an active filter is
 * unmistakable at a glance — the previous outline-vs-fill distinction was too
 * quiet to notice while scrolling.
 */
export function Chip({ label, active = false, onPress, icon, count, onDark = false }: ChipProps) {
  const fill = active
    ? 'bg-primary'
    : onDark
      ? 'bg-ink-700'
      : 'bg-surface border border-border-strong';

  const textColor = active ? 'text-surface' : onDark ? 'text-surface' : 'text-slate';
  const glyphColor = active ? COLORS.surface : onDark ? COLORS.slateSoft : COLORS.slate;

  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      scaleTo={0.96}
      // 36px tall with 8px gaps keeps every chip inside the 44pt target once
      // the row's vertical padding is counted.
      className={`mr-2 h-9 flex-row items-center rounded-full px-3.5 ${fill}`}>
      {icon ? (
        <Ionicons name={icon} size={14} color={glyphColor} style={{ marginRight: 6 }} />
      ) : null}

      <Text className={`font-sans-semibold text-[13px] ${textColor}`}>{label}</Text>

      {count !== undefined ? (
        <View
          className={`ml-2 min-w-[20px] items-center rounded-full px-1.5 py-0.5 ${
            active ? 'bg-white/25' : onDark ? 'bg-ink-900' : 'bg-mist'
          }`}>
          <Text
            className={`font-stat text-[12px] tracking-stat ${
              active ? 'text-surface' : onDark ? 'text-slate-soft' : 'text-slate'
            }`}>
            {count}
          </Text>
        </View>
      ) : null}
    </Touchable>
  );
}
