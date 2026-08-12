import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import type { Position } from '../../data/types';
import { POSITION_LABEL } from '../../lib/labels';
import { COLORS } from '../../lib/theme';
import { Label } from './FormField';

const POSITIONS: readonly Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

type PositionPickerProps = {
  label: string;
  helper?: string;
  value: Position | null;
  onSelect: (next: Position | null) => void;
  /** Greyed out — used so a secondary pick can't duplicate the primary. */
  disabled?: Position | null;
  optional?: boolean;
  required?: boolean;
  /** Secondary picker shows abbreviations only, matching the mock. */
  compact?: boolean;
  error?: string | null;
};

/** Row of five position cards. Tapping the active one clears it when optional. */
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
}: PositionPickerProps) {
  return (
    <View className="mb-4">
      <Label label={label} optional={optional} required={required} />
      {helper ? (
        <Text className="font-sans mt-0.5 text-[12px] text-slate">{helper}</Text>
      ) : null}

      <View className="mt-2 flex-row gap-2">
        {POSITIONS.map((position) => {
          const active = position === value;
          const isDisabled = disabled === position;

          return (
            <Pressable
              key={position}
              disabled={isDisabled}
              onPress={() => onSelect(active && optional ? null : position)}
              className={`flex-1 items-center justify-center rounded-btn border ${
                compact ? 'py-3' : 'py-2.5'
              } ${
                active
                  ? 'border-primary bg-primary/5'
                  : isDisabled
                    ? 'border-border bg-bg'
                    : 'border-border bg-surface'
              }`}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : isDisabled ? 0.4 : 1 })}>
              {active ? (
                <View className="absolute right-1 top-1">
                  <Ionicons name="checkmark-circle" size={13} color={COLORS.primary} />
                </View>
              ) : null}

              <Text
                className={`font-sans-bold text-[14px] ${active ? 'text-primary' : 'text-ink'}`}>
                {position}
              </Text>

              {compact ? null : (
                <Text
                  className={`font-sans mt-0.5 text-center text-[8px] leading-[11px] ${
                    active ? 'text-primary' : 'text-slate'
                  }`}
                  numberOfLines={2}>
                  {POSITION_LABEL[position]}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {error ? <Text className="font-sans mt-1 text-[11px] text-primary">{error}</Text> : null}
    </View>
  );
}
