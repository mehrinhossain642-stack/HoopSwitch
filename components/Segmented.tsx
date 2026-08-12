import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { COLORS } from '../lib/theme';
import { Touchable } from './Touchable';

export type Segment<T extends string> = {
  value: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

/**
 * Segmented control for a small set of mutually exclusive choices. Preferred
 * over two stacked buttons when the options are peers — the shared track makes
 * it obvious that exactly one is selected.
 */
export function Segmented<T extends string>({
  segments,
  value,
  onChange,
  onDark = false,
  className = '',
}: {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (next: T) => void;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <View
      className={`flex-row rounded-btn p-1 ${onDark ? 'bg-ink-800' : 'bg-mist'} ${className}`}
      accessibilityRole="tablist">
      {segments.map((segment) => {
        const active = segment.value === value;

        return (
          <Touchable
            key={segment.value}
            onPress={() => onChange(segment.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={segment.label}
            scaleTo={1}
            dimTo={0.7}
            className={`h-10 flex-1 flex-row items-center justify-center rounded-md ${
              active ? (onDark ? 'bg-primary' : 'bg-ink') : ''
            }`}>
            {segment.icon ? (
              <Ionicons
                name={segment.icon}
                size={15}
                color={active ? COLORS.surface : COLORS.slate}
                style={{ marginRight: 6 }}
              />
            ) : null}
            <Text
              className={`font-sans-semibold text-[13px] ${
                active ? 'text-surface' : onDark ? 'text-slate-soft' : 'text-slate'
              }`}>
              {segment.label}
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
}
