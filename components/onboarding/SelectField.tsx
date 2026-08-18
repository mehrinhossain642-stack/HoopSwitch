import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useThemeColors } from '../../lib/theme';
import { Sheet, SheetRow } from '../Sheet';
import { Touchable } from '../Touchable';
import { Label } from './FormField';

/**
 * Dropdown-style picker. React Native has no cross-platform native select, so this
 * is a trigger styled like a text field that opens a bottom sheet — which keeps the
 * field's height stable instead of shoving the rest of the form down.
 */
export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select',
  icon,
  optional = false,
  required = false,
  labelFor = (option) => String(option),
  error = null,
}: {
  label: string;
  value: T | null;
  options: readonly T[];
  onSelect: (next: T) => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  optional?: boolean;
  required?: boolean;
  /** Renders an option for display when the raw value isn't user-friendly. */
  labelFor?: (option: T) => string;
  error?: string | null;
}) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);

  const border = error ? 'border-danger' : open ? 'border-primary' : 'border-border-strong';

  return (
    <View className="mb-4 flex-1">
      <Label label={label} optional={optional} required={required} />

      <Touchable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value === null ? placeholder : labelFor(value)}`}
        accessibilityState={{ expanded: open }}
        scaleTo={1}
        dimTo={0.7}
        className={`mt-2 h-12 flex-row items-center rounded-btn border-2 bg-surface px-3.5 ${border}`}>
        {icon ? (
          <Ionicons
            name={icon}
            size={17}
            color={open ? colors.primary : colors.slate}
            style={{ marginRight: 9 }}
          />
        ) : null}

        <Text
          className={`font-sans flex-1 text-[15px] ${
            value === null ? 'text-slate-soft' : 'text-ink'
          }`}
          numberOfLines={1}>
          {value === null ? placeholder : labelFor(value)}
        </Text>

        <Ionicons name="chevron-down" size={17} color={colors.slate} />
      </Touchable>

      {error ? (
        <Text
          className="font-sans mt-1.5 text-[12px] text-danger"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        <ScrollView>
          {options.map((option, index) => (
            <SheetRow
              key={String(option)}
              active={option === value}
              last={index === options.length - 1}
              accessibilityLabel={labelFor(option)}
              onPress={() => {
                onSelect(option);
                setOpen(false);
              }}>
              <Text
                className={`text-[15px] ${
                  option === value ? 'font-sans-bold text-primary' : 'font-sans text-ink'
                }`}>
                {labelFor(option)}
              </Text>
            </SheetRow>
          ))}
        </ScrollView>
      </Sheet>
    </View>
  );
}
