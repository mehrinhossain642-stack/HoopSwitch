import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { COLORS } from '../../lib/theme';

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  /** Leading glyph, matching the mock's inline field icons. */
  icon?: keyof typeof Ionicons.glyphMap;
  optional?: boolean;
  required?: boolean;
  helper?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  /** Unit suffix rendered inside the field, e.g. "ft" / "lb". */
  suffix?: string;
  error?: string | null;
};

/** Labeled text input used throughout the onboarding steps. */
export function FormField({
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
  suffix,
  error = null,
}: FormFieldProps) {
  return (
    <View className="mb-4">
      <Label label={label} optional={optional} required={required} />
      {helper ? (
        <Text className="font-sans mb-2 mt-0.5 text-[12px] text-slate">{helper}</Text>
      ) : null}

      <View
        className={`mt-2 flex-row items-center rounded-btn border bg-surface px-3 ${
          error ? 'border-primary' : 'border-border'
        }`}>
        {icon ? <Ionicons name={icon} size={16} color={COLORS.slate} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.slate}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          className={`font-sans h-12 flex-1 text-[14px] text-ink ${icon ? 'px-2' : ''}`}
        />
        {suffix ? (
          <Text className="font-sans-medium text-[13px] text-slate">{suffix}</Text>
        ) : null}
      </View>

      {error ? (
        <Text className="font-sans mt-1 text-[11px] text-primary">{error}</Text>
      ) : null}
    </View>
  );
}

export function Label({
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
      {optional ? <Text className="font-sans text-slate"> (Optional)</Text> : null}
    </Text>
  );
}
