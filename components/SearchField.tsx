import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { COLORS } from '../lib/theme';
import { Touchable } from './Touchable';

type SearchFieldProps = {
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  /** Styles for sitting on the ink header slab. */
  onDark?: boolean;
};

/** Search input. Lives inside the header slab, so it has a dark treatment. */
export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search',
  onDark = false,
}: SearchFieldProps) {
  const [focused, setFocused] = useState(false);

  const surface = onDark
    ? focused
      ? 'bg-ink-800 border-primary'
      : 'bg-ink-800 border-ink-700'
    : focused
      ? 'bg-surface border-primary'
      : 'bg-surface border-border-strong';

  return (
    <View
      className={`h-11 flex-row items-center rounded-btn border px-3 ${surface}`}
      style={{ borderWidth: focused ? 2 : 1 }}>
      <Ionicons
        name="search"
        size={16}
        color={focused ? COLORS.primary : onDark ? COLORS.slateSoft : COLORS.slate}
      />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={onDark ? COLORS.slateSoft : COLORS.slate}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={placeholder}
        className={`font-sans h-full flex-1 px-2.5 text-[14px] ${
          onDark ? 'text-surface' : 'text-ink'
        }`}
      />

      {value.length > 0 ? (
        <Touchable
          onPress={() => onChangeText('')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          className="h-7 w-7 items-center justify-center">
          <Ionicons
            name="close-circle"
            size={17}
            color={onDark ? COLORS.slateSoft : COLORS.slate}
          />
        </Touchable>
      ) : null}
    </View>
  );
}
