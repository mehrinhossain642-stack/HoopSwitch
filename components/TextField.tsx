import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import { useThemeColors } from '../lib/theme';
import { Touchable } from './Touchable';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  optional?: boolean;
  required?: boolean;
  /** Persistent guidance under the label — survives typing, unlike a placeholder. */
  helper?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  /** Unit shown inside the field, e.g. "ft" / "lb". */
  suffix?: string;
  secure?: boolean;
  multiline?: boolean;
  error?: string | null;
  onSubmitEditing?: () => void;
  returnKeyType?: TextInputProps['returnKeyType'];
  className?: string;
};

/**
 * The app's text input. Always carries a visible label — placeholder-only fields
 * lose their meaning the moment someone types — and shows an orange focus ring so
 * the active field is obvious on both platforms.
 */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  optional = false,
  required = false,
  helper,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  textContentType,
  suffix,
  secure = false,
  multiline = false,
  error = null,
  onSubmitEditing,
  returnKeyType,
  className = '',
}: TextFieldProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const border = error ? 'border-danger' : focused ? 'border-primary' : 'border-border-strong';

  return (
    <View className={`mb-4 ${className}`}>
      <FieldLabel label={label} optional={optional} required={required} />

      {helper ? (
        <Text className="font-sans mt-1 text-[12px] leading-[16px] text-slate">{helper}</Text>
      ) : null}

      <View
        className={`mt-2 flex-row items-center rounded-btn border bg-surface px-3.5 ${border}`}
        // 2px when active reads as a focus ring without shifting layout, since
        // the border box is the same size either way.
        style={{ borderWidth: focused || error ? 2 : 1 }}>
        {icon ? (
          <Ionicons
            name={icon}
            size={17}
            color={focused ? colors.primary : colors.slate}
            style={{ marginRight: 9 }}
          />
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.slateSoft}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          secureTextEntry={secure && !revealed}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          accessibilityLabel={label}
          className="font-sans flex-1 text-[15px] text-ink"
          // 48px clears the 44pt touch minimum, and 15px avoids mobile Safari's
          // auto-zoom on focus in the web build.
          style={
            multiline
              ? { minHeight: 96, paddingVertical: 12, textAlignVertical: 'top' }
              : { height: 48 }
          }
        />

        {secure ? (
          <Touchable
            onPress={() => setRevealed((prev) => !prev)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            className="h-8 w-8 items-center justify-center">
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={17}
              color={colors.slate}
            />
          </Touchable>
        ) : null}

        {suffix ? (
          <Text className="font-sans-medium ml-1 text-[13px] text-slate">{suffix}</Text>
        ) : null}
      </View>

      {error ? (
        <Text
          className="font-sans mt-1.5 text-[12px] text-danger"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function FieldLabel({
  label,
  optional = false,
  required = false,
}: {
  label: string;
  optional?: boolean;
  required?: boolean;
}) {
  return (
    <Text className="font-sans-semibold text-[13px] text-ink">
      {label}
      {required ? <Text className="text-primary"> *</Text> : null}
      {optional ? <Text className="font-sans text-slate"> (optional)</Text> : null}
    </Text>
  );
}
