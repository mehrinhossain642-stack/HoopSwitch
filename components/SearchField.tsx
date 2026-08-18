import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { COLORS, useThemeColors } from '../lib/theme';
import { Touchable } from './Touchable';

/** Search input. Lives inside the chrome slab, so it has a dark treatment. */
export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search',
  onDark = false,
}: {
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  /** Styles for sitting on the ink chrome. */
  onDark?: boolean;
}) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);

  const surface = onDark
    ? focused
      ? 'bg-chrome-raised border-primary'
      : 'bg-chrome-raised border-chrome-border'
    : focused
      ? 'bg-surface border-primary'
      : 'bg-surface border-border-strong';

  const glyph = focused
    ? colors.primary
    : onDark
      ? COLORS.chromeTextMuted
      : colors.slate;

  return (
    <View
      className={`h-11 flex-row items-center rounded-btn border px-3 ${surface}`}
      style={{ borderWidth: focused ? 2 : 1 }}>
      <Ionicons name="search" size={16} color={glyph} />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={onDark ? COLORS.chromeTextMuted : colors.slate}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={placeholder}
        className={`font-sans h-full flex-1 px-2.5 text-[14px] ${
          onDark ? 'text-chrome-text' : 'text-ink'
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
            color={onDark ? COLORS.chromeTextMuted : colors.slate}
          />
        </Touchable>
      ) : null}
    </View>
  );
}
