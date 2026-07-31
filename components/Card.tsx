import { View, type ViewProps } from 'react-native';
import { CARD_SHADOW } from '../lib/theme';

type CardProps = ViewProps & {
  /** Drop the default 16px padding when the card manages its own insets. */
  bare?: boolean;
};

/** White 16px-radius surface with the standard soft shadow. */
export function Card({ bare = false, className = '', style, children, ...rest }: CardProps) {
  return (
    <View
      className={`rounded-card bg-surface ${bare ? '' : 'p-4'} ${className}`}
      style={[CARD_SHADOW, style]}
      {...rest}>
      {children}
    </View>
  );
}
