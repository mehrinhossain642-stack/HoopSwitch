import { View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CONTENT_MAX_WIDTH,
  FORM_MAX_WIDTH,
  WIDE_CONTENT_MAX_WIDTH,
  useLayout,
} from '../lib/layout';

type Measure = 'content' | 'wide' | 'form';

function maxWidthFor(measure: Measure): number {
  if (measure === 'wide') return WIDE_CONTENT_MAX_WIDTH;
  if (measure === 'form') return FORM_MAX_WIDTH;
  return CONTENT_MAX_WIDTH;
}

type ScreenProps = {
  children: React.ReactNode;
  /**
   * Which safe-area edges to inset. Pass `[]` when a chrome slab handles the top
   * itself — the slab needs to paint *through* the inset, not below it.
   */
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
  measure?: Measure;
  children: React.ReactNode;
};

/**
 * Centres and caps the content column. A no-op on a phone; in a maximised
 * browser window it's what keeps a feed row from stretching to 2000px and a
 * paragraph from running 300 characters wide.
 */
export function Content({
  measure = 'content',
  className = '',
  style,
  children,
  ...rest
}: ContentProps) {
  const { gutter } = useLayout();

  return (
    <View
      className={`w-full self-center ${className}`}
      style={[{ maxWidth: maxWidthFor(measure), paddingHorizontal: gutter }, style]}
      {...rest}>
      {children}
    </View>
  );
}

/**
 * The same measure and gutter as `Content`, shaped for a scroll view's
 * `contentContainerStyle` — where a wrapper `View` would break `FlatList`
 * virtualisation and sticky headers.
 */
export function useContentContainerStyle(options?: {
  measure?: Measure;
  paddingTop?: number;
  paddingBottom?: number;
}) {
  const { gutter } = useLayout();

  return {
    width: '100%' as const,
    maxWidth: maxWidthFor(options?.measure ?? 'content'),
    alignSelf: 'center' as const,
    paddingHorizontal: gutter,
    paddingTop: options?.paddingTop ?? 0,
    paddingBottom: options?.paddingBottom ?? 32,
  };
}
