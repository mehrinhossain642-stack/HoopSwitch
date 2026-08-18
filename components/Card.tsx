import { View, type ViewProps } from 'react-native';
import { CARD_SHADOW } from '../lib/theme';

type CardProps = ViewProps & {
  /** Drop the default padding when the card manages its own insets. */
  bare?: boolean;
  /**
   * Left accent rail colour. Feed cards use it to encode fit tier, so ranking
   * stays legible while scrolling past at speed.
   */
  rail?: string;
  /** Ink panel instead of a light surface — for emphasis blocks. */
  tone?: 'light' | 'dark';
};

/**
 * The app's surface. A real 1px border does the definition work and the shadow
 * only lifts it slightly, which stops a stack of cards turning into a blur of
 * identical floating rectangles.
 */
export function Card({
  bare = false,
  rail,
  tone = 'light',
  className = '',
  style,
  children,
  ...rest
}: CardProps) {
  const surface =
    tone === 'dark'
      ? 'bg-chrome border border-chrome-border'
      : 'bg-surface border border-border';

  return (
    <View
      className={`overflow-hidden rounded-card ${surface} ${className}`}
      style={[tone === 'light' ? CARD_SHADOW : undefined, style]}
      {...rest}>
      {rail ? (
        <View
          className="absolute bottom-0 left-0 top-0 w-[4px]"
          style={{ backgroundColor: rail }}
        />
      ) : null}
      <View className={`${bare ? '' : 'p-4'} ${rail ? 'pl-[4px]' : ''}`}>{children}</View>
    </View>
  );
}

/** Divider tuned per surface — visible on light and on the ink chrome. */
export function Divider({
  tone = 'light',
  className = '',
}: {
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <View className={`h-px ${tone === 'dark' ? 'bg-chrome-border' : 'bg-border'} ${className}`} />
  );
}
