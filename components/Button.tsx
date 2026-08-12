import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Text, View } from 'react-native';
import { COLORS } from '../lib/theme';
import { Touchable } from './Touchable';

type Variant = 'primary' | 'secondary' | 'dark' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  /** Settled state: muted green fill, check icon, not pressable. */
  done?: boolean;
  doneLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Puts the icon after the label — for forward/next actions. */
  iconTrailing?: boolean;
  fullWidth?: boolean;
  className?: string;
};

const HEIGHT: Record<Size, string> = { sm: 'h-9', md: 'h-11', lg: 'h-[52px]' };
const TEXT: Record<Size, string> = { sm: 'text-[13px]', md: 'text-[14px]', lg: 'text-[15px]' };
const ICON: Record<Size, number> = { sm: 14, md: 16, lg: 18 };

const FILL: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface border border-border-strong',
  dark: 'bg-ink',
  ghost: 'bg-transparent',
  danger: 'bg-danger-soft border border-danger/25',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-surface',
  secondary: 'text-ink',
  dark: 'text-surface',
  ghost: 'text-primary',
  danger: 'text-danger',
};

const GLYPH: Record<Variant, string> = {
  primary: COLORS.surface,
  secondary: COLORS.ink,
  dark: COLORS.surface,
  ghost: COLORS.primary,
  danger: COLORS.danger,
};

/**
 * One button, five intents. Every state is reachable — loading disables and
 * shows a spinner, `done` becomes a non-interactive confirmation, and disabled
 * drops emphasis without hiding the label.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  done = false,
  doneLabel,
  loading = false,
  disabled = false,
  icon,
  iconTrailing = false,
  fullWidth = true,
  className = '',
}: ButtonProps) {
  const width = fullWidth ? 'w-full' : 'self-start px-4';
  const shape = `${HEIGHT[size]} flex-row items-center justify-center rounded-btn`;

  if (done) {
    return (
      <View
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        className={`${shape} ${width} border border-good/25 bg-good-soft ${className}`}>
        <Ionicons name="checkmark-circle" size={ICON[size]} color={COLORS.good} />
        <Text className={`font-sans-bold ml-1.5 ${TEXT[size]} text-good`}>
          {doneLabel ?? label}
        </Text>
      </View>
    );
  }

  const inactive = disabled || loading;

  return (
    <Touchable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      scaleTo={0.975}
      className={`${shape} ${width} ${FILL[variant]} ${inactive ? 'opacity-40' : ''} ${className}`}>
      {loading ? (
        <ActivityIndicator size="small" color={GLYPH[variant]} />
      ) : (
        <>
          {icon && !iconTrailing ? (
            <Ionicons
              name={icon}
              size={ICON[size]}
              color={GLYPH[variant]}
              style={{ marginRight: 7 }}
            />
          ) : null}

          <Text className={`font-sans-bold ${TEXT[size]} ${LABEL[variant]}`}>{label}</Text>

          {icon && iconTrailing ? (
            <Ionicons
              name={icon}
              size={ICON[size]}
              color={GLYPH[variant]}
              style={{ marginLeft: 7 }}
            />
          ) : null}
        </>
      )}
    </Touchable>
  );
}
