import { View, type ViewProps } from 'react-native';
import { CARD_SHADOW } from '../lib/theme';

type CardProps = ViewProps & {
  /** Drop the default padding when the card manages its own insets. */
  bare?: boolean;
  /**
   * Left accent rail colour. Feed cards use it to encode fit tier, so the
   * ranking is legible while scrolling past at speed.
   */
  rail?: string;
  /** Ink panel instead of white — for hero and emphasis surfaces. */
  tone?: 'light' | 'dark';
};

/**
 * The app's surface. A real 1px border does the definition work and the shadow
 * only lifts it a little, which keeps a stack of cards from turning into a
 * blur of identical floating rectangles.
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
    tone === 'dark' ? 'bg-ink-900 border border-ink-700' : 'bg-surface border border-border';

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

/** Divider tuned for each surface — visible on white and on ink. */
export function Divider({
  tone = 'light',
  className = '',
}: {
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return <View className={`h-px ${tone === 'dark' ? 'bg-ink-700' : 'bg-border'} ${className}`} />;
}

/**
 * Footer band inside a card — sits on a tinted strip so the action row reads as
 * separate from the content without needing extra whitespace.
 */
export function CardFooter({ className = '', children }: ViewProps & { children: React.ReactNode }) {
  return (
    <View className={`border-t border-border bg-bg px-4 py-3 ${className}`}>{children}</View>
  );
}
