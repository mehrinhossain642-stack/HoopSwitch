import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONTENT_MAX_WIDTH, useLayout } from '../lib/layout';
import { COLORS } from '../lib/theme';
import { Touchable } from './Touchable';

/** The wordmark, with the switch in brand orange. */
export function Wordmark({ size = 20, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <Text
      className={`font-display ${onDark ? 'text-chrome-text' : 'text-ink'}`}
      style={{ fontSize: size, letterSpacing: -0.4 }}>
      Hoop<Text className="text-primary">Switch</Text>
    </Text>
  );
}

/**
 * Shared shell for every chrome slab: paints through the top safe-area inset and
 * closes with the orange seam. Keeps the inset maths in one place.
 */
function Slab({
  children,
  compact = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { gutter, isDesktop } = useLayout();

  return (
    <View
      className="bg-chrome"
      style={{ paddingTop: isDesktop ? (compact ? 16 : 20) : insets.top + (compact ? 4 : 6) }}>
      <View
        className="w-full self-center"
        style={{ maxWidth: CONTENT_MAX_WIDTH, paddingHorizontal: gutter }}>
        {children}
      </View>

      {/* The orange seam reads as the join between chrome and content. It's the
          single most repeated brand cue in the app. */}
      <View className="h-[3px] bg-primary" />
    </View>
  );
}

type AppHeaderProps = {
  /** Renders the wordmark instead of a text title. */
  brand?: boolean;
  title?: string;
  /** Small uppercase line above the title. */
  eyebrow?: string;
  /** One line of context below: counts, team name, sort order. */
  meta?: string;
  right?: React.ReactNode;
  /** Pinned inside the slab, below the title: search field, filter chips. */
  children?: React.ReactNode;
};

/**
 * The slab that tops every primary screen — an ink panel running under the
 * status bar with condensed uppercase metadata. This is most of the app's
 * identity; without it every screen opens on plain text over grey.
 */
export function AppHeader({
  brand = false,
  title,
  eyebrow,
  meta,
  right,
  children,
}: AppHeaderProps) {
  return (
    <Slab>
      <View className="flex-row items-start justify-between pb-3">
        <View className="flex-1 pr-3">
          {eyebrow ? (
            <Text className="font-stat mb-0.5 text-[13px] tracking-eyebrow text-primary">
              {eyebrow.toUpperCase()}
            </Text>
          ) : null}

          {brand ? (
            <Wordmark size={22} onDark />
          ) : (
            <Text
              className="font-display text-[22px] text-chrome-text"
              style={{ letterSpacing: -0.4 }}
              accessibilityRole="header">
              {title}
            </Text>
          )}

          {meta ? (
            <Text className="font-stat mt-1 text-[14px] tracking-stat text-chrome-text-muted">
              {meta.toUpperCase()}
            </Text>
          ) : null}
        </View>

        {right}
      </View>

      {children ? <View className="pb-3.5">{children}</View> : null}
    </Slab>
  );
}

/**
 * Header for pushed screens. Same slab, so navigating deeper never drops out of
 * the app's chrome, but compact — the content below is the subject.
 */
export function DetailHeader({
  onBack,
  title,
  right,
}: {
  onBack: () => void;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <Slab compact>
      <View className="flex-row items-center pb-3">
        <Touchable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-9 w-9 items-center justify-center rounded-full bg-chrome-raised">
          <Ionicons name="chevron-back" size={18} color={COLORS.chromeText} />
        </Touchable>

        <Text
          className="font-stat ml-3 flex-1 text-[17px] tracking-eyebrow text-chrome-text"
          accessibilityRole="header">
          {title.toUpperCase()}
        </Text>

        {right}
      </View>
    </Slab>
  );
}

/** Circular icon button sized for a slab's right slot. */
export function HeaderIconButton({
  icon,
  label,
  onPress,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  /** Count bubble — hidden when zero. */
  badge?: number;
}) {
  return (
    <Touchable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-10 w-10 items-center justify-center rounded-full bg-chrome-raised">
      <Ionicons name={icon} size={19} color={COLORS.chromeText} />
      {badge && badge > 0 ? (
        <View className="absolute -right-0.5 -top-0.5 h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-chrome bg-primary px-1">
          <Text className="font-sans-bold text-[10px] text-white">{badge}</Text>
        </View>
      ) : null}
    </Touchable>
  );
}
