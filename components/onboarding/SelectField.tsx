import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/theme';
import { Label } from './FormField';

type SelectFieldProps<T extends string | number> = {
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
};

/**
 * Dropdown-style picker. React Native has no cross-platform native select, so
 * this is a button that opens a bottom sheet of options — which also matches
 * the mock's "Select year ▾" affordance better than a wheel picker would.
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
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-4 flex-1">
      <Label label={label} optional={optional} required={required} />

      <Pressable
        onPress={() => setOpen(true)}
        className={`mt-2 h-12 flex-row items-center rounded-btn border bg-surface px-3 ${
          error ? 'border-primary' : 'border-border'
        }`}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        {icon ? <Ionicons name={icon} size={16} color={COLORS.slate} /> : null}
        <Text
          className={`font-sans flex-1 text-[14px] ${icon ? 'px-2' : ''} ${
            value === null ? 'text-slate' : 'text-ink'
          }`}
          numberOfLines={1}>
          {value === null ? placeholder : labelFor(value)}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.slate} />
      </Pressable>

      {error ? <Text className="font-sans mt-1 text-[11px] text-primary">{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(20,21,24,0.45)' }}
          onPress={() => setOpen(false)}>
          {/* Stop taps inside the sheet from dismissing it. */}
          <Pressable onPress={() => {}} className="max-h-[70%] rounded-t-3xl bg-surface">
            <SafeAreaView edges={['bottom']}>
              <View className="flex-row items-center justify-between border-b border-border px-5 py-4">
                <Text className="font-display text-[17px] text-ink">{label}</Text>
                <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                  <Ionicons name="close" size={20} color={COLORS.slate} />
                </Pressable>
              </View>

              <FlatList
                data={options as T[]}
                keyExtractor={(item) => String(item)}
                renderItem={({ item }) => {
                  const active = item === value;
                  return (
                    <Pressable
                      onPress={() => {
                        onSelect(item);
                        setOpen(false);
                      }}
                      className="flex-row items-center justify-between border-b border-border px-5 py-4"
                      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                      <Text
                        className={`text-[15px] ${
                          active ? 'font-sans-bold text-primary' : 'font-sans text-ink'
                        }`}>
                        {labelFor(item)}
                      </Text>
                      {active ? (
                        <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                      ) : null}
                    </Pressable>
                  );
                }}
              />
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
