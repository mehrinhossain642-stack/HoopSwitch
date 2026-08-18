import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import type { Position } from '../../data/types';
import { POSITION_LABEL } from '../../lib/labels';
import { useThemeColors } from '../../lib/theme';
import { Touchable } from '../Touchable';
import { Label } from './FormField';

const POSITIONS: readonly Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

/**
 * Row of five position cards. Selection is a filled ink tile rather than a faint
 * tint plus a checkmark — at this size the tint alone was easy to miss, and the
 * codes are the thing being chosen, so they carry the emphasis.
 */
export function PositionPicker({
  label,
  helper,
  value,
  onSelect,
  disabled = null,
  optional = false,
  required = false,
  compact = false,
  error = null,
}: {
  label: string;
  helper?: string;
  value: Position | null;
  onSelect: (next: Position | null) => void;
  /** Greyed out — so a secondary pick can't duplicate the primary. */
  disabled?: Position | null;
  optional?: boolean;
  required?: boolean;
  /** Secondary picker shows abbreviations only. */
  compact?: boolean;
  error?: string | null;
}) {
  const colors = useThemeColors();

  return (
    <View className="mb-4">
      <Label label={label} optional={optional} required={required} />
      {helper ? (
        <Text className="font-sans mt-1 text-[12px] leading-[16px] text-slate">{helper}</Text>
      ) : null}

      <View className="mt-2.5 flex-row gap-2">
        {POSITIONS.map((position) => {
          const active = position === value;
          const isDisabled = disabled === position;

          return (
            <Touchable
              key={position}
              disabled={isDisabled}
              onPress={() => onSelect(active && optional ? null : position)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active, disabled: isDisabled }}
              accessibilityLabel={POSITION_LABEL[position]}
              scaleTo={0.95}
              className={`flex-1 items-center justify-center rounded-btn border ${
                compact ? 'py-3' : 'py-2.5'
              } ${
                active
                  ? 'border-primary bg-chrome'
                  : isDisabled
                    ? 'border-border bg-mist opacity-40'
                    : 'border-border-strong bg-surface'
              }`}>
              <Text
                className={`font-stat-bold text-[20px] tracking-stat ${
                  active ? 'text-chrome-text' : 'text-ink'
                }`}>
                {position}
              </Text>

              {compact ? null : (
                <Text
                  className={`font-sans mt-0.5 text-center text-[8px] leading-[11px] ${
                    active ? 'text-chrome-text-muted' : 'text-slate'
                  }`}
                  numberOfLines={2}>
                  {POSITION_LABEL[position]}
                </Text>
              )}
            </Touchable>
          );
        })}
      </View>

      {error ? (
        <View className="mt-1.5 flex-row items-center">
          <Ionicons name="alert-circle" size={13} color={colors.danger} />
          <Text
            className="font-sans ml-1.5 text-[12px] text-danger"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite">
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
