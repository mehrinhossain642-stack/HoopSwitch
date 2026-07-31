import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import { COLORS } from '../lib/theme';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Renders the settled state: muted fill, check icon, not pressable. */
  done?: boolean;
  doneLabel?: string;
  className?: string;
};

/** Full-width orange CTA by default; 14px radius, bold white text. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  done = false,
  doneLabel,
  className = '',
}: ButtonProps) {
  const isPrimary = variant === 'primary';

  if (done) {
    return (
      <View
        className={`h-11 flex-row items-center justify-center rounded-btn border border-good/30 bg-good/10 ${className}`}>
        <Ionicons name="checkmark" size={16} color={COLORS.good} />
        <Text className="font-sans-bold ml-1.5 text-[14px] text-good">
          {doneLabel ?? label}
        </Text>
      </View>
    );
  }

  const base = 'h-11 flex-row items-center justify-center rounded-btn';
  const look = isPrimary
    ? 'bg-primary'
    : variant === 'secondary'
      ? 'border border-border bg-surface'
      : '';

  return (
    <Pressable
      onPress={onPress}
      className={`${base} ${look} ${className}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      <Text
        className={`font-sans-bold text-[14px] ${isPrimary ? 'text-surface' : 'text-ink'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
