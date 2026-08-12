import { View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CONTENT_MAX_WIDTH, useLayout } from '../lib/layout';

type ScreenProps = {
  children: React.ReactNode;
  /** Skip the top safe-area inset when a dark header slab already covers it. */
  edges?: ('top' | 'bottom')[];
  className?: string;
};

/**
 * Page shell. Owns the background and the safe-area contract so no screen has
 * to remember which edges it needs.
 */
export function Screen({ children, edges = ['top'], className = '' }: ScreenProps) {
  return (
    <SafeAreaView className={`flex-1 bg-bg ${className}`} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

type ContentProps = ViewProps & {
  /** Caps the column at a wider measure — for profile and detail pages. */
  wide?: boolean;
  children: React.ReactNode;
};

/**
 * Centres and caps the content column. On a phone this is a no-op; in a
 * maximised browser window it's what keeps a feed row from stretching to
 * 2000px and a paragraph from running 300 characters wide.
 */
export function Content({ wide = false, className = '', style, children, ...rest }: ContentProps) {
  const { gutter } = useLayout();

  return (
    <View
      className={`w-full self-center ${className}`}
      style={[
        { maxWidth: wide ? 1080 : CONTENT_MAX_WIDTH, paddingHorizontal: gutter },
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

/**
 * The same measure and gutter as `Content`, shaped for a scroll view's
 * `contentContainerStyle` — where a wrapper View would break sticky headers
 * and `FlatList` virtualisation.
 */
export function useContentContainerStyle(options?: { wide?: boolean; paddingBottom?: number }) {
  const { gutter } = useLayout();

  return {
    width: '100%' as const,
    maxWidth: options?.wide ? 1080 : CONTENT_MAX_WIDTH,
    alignSelf: 'center' as const,
    paddingHorizontal: gutter,
    paddingBottom: options?.paddingBottom ?? 32,
  };
}
