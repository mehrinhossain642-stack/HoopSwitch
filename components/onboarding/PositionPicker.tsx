import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import type { Position } from '../../data/types';
import { POSITION_LABEL } from '../../lib/labels';
import { COLORS } from '../../lib/theme';
import { Touchable } from '../Touchable';
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
  /** Secondary picker shows abbreviations only. */
  compact?: boolean;
  error?: string | null;
};

/**
 * Row of five position cards. Selection is a filled ink tile rather than a tint
 * plus a checkmark — at this size the tint alone was easy to miss, and the codes
 * are the thing being chosen, so they carry the emphasis.
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
}: PositionPickerProps) {
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
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: isDisabled }}
              accessibilityLabel={POSITION_LABEL[position]}
              scaleTo={0.95}
              className={`flex-1 items-center justify-center rounded-btn border ${
                compact ? 'py-3' : 'py-2.5'
              } ${
                active
                  ? 'border-ink bg-ink'
                  : isDisabled
                    ? 'border-border bg-mist opacity-40'
                    : 'border-border-strong bg-surface'
              }`}>
              <Text
                className={`font-stat text-[19px] tracking-stat ${
                  active ? 'text-surface' : 'text-ink'
                }`}>
                {position}
              </Text>

              {compact ? null : (
                <Text
                  className={`font-sans mt-0.5 text-center text-[8px] leading-[11px] ${
                    active ? 'text-white/70' : 'text-slate'
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
          <Ionicons name="alert-circle" size={13} color={COLORS.danger} />
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
