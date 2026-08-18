import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { COLORS } from '../lib/theme';
import { Touchable } from './Touchable';

/**
 * Filter pill. Selected state is a filled orange chip so an active filter is
 * unmistakable at a glance — an outline-vs-fill distinction is too quiet to
 * notice while scrolling.
 */
export function Chip({
  label,
  active = false,
  onPress,
  icon,
  count,
  onDark = false,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Trailing count, e.g. how many results sit behind the filter. */
  count?: number;
  /** Styles for sitting on the ink chrome rather than the page background. */
  onDark?: boolean;
}) {
  const fill = active
    ? 'bg-primary'
    : onDark
      ? 'bg-chrome-raised'
      : 'bg-surface border border-border-strong';

  const text = active ? 'text-white' : onDark ? 'text-chrome-text' : 'text-slate';
  const glyph = active ? '#FFFFFF' : onDark ? COLORS.chromeTextMuted : COLORS.slate;

  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      scaleTo={0.96}
      // 36px tall with 8px gaps keeps every chip inside the 44pt target once the
      // row's vertical padding is counted.
      className={`mr-2 h-9 flex-row items-center rounded-full px-3.5 ${fill}`}>
      {icon ? (
        <Ionicons name={icon} size={14} color={glyph} style={{ marginRight: 6 }} />
      ) : null}

      <Text className={`font-sans-semibold text-[13px] ${text}`}>{label}</Text>

      {count !== undefined ? (
        <View
          className={`ml-2 min-w-[20px] items-center rounded-full px-1.5 ${
            active ? 'bg-white/25' : onDark ? 'bg-chrome' : 'bg-mist'
          }`}>
          <Text
            className={`font-stat text-[13px] tracking-stat ${
              active ? 'text-white' : onDark ? 'text-chrome-text-muted' : 'text-slate'
            }`}>
            {count}
          </Text>
        </View>
      ) : null}
    </Touchable>
  );
}
