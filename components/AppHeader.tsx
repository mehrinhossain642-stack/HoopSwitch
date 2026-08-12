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
      className={`font-display ${onDark ? 'text-surface' : 'text-ink'}`}
      style={{ fontSize: size, letterSpacing: -0.4 }}>
      Hoop<Text className="text-primary">Switch</Text>
    </Text>
  );
}

type AppHeaderProps = {
  /** Renders the wordmark instead of a text title. */
  brand?: boolean;
  title?: string;
  /** Small uppercase line above the title. */
  eyebrow?: string;
  /** One line of context below the title — counts, team name, sort order. */
  meta?: string;
  right?: React.ReactNode;
  /** Pinned below the title inside the slab: search field, segmented control. */
  children?: React.ReactNode;
};

/**
 * The dark slab that tops every primary screen. This is most of the app's
 * identity: an ink panel that runs under the status bar, a hairline orange rule
 * along the bottom, and condensed uppercase metadata — the visual language of a
 * broadcast graphic rather than a generic white dashboard.
 */
export function AppHeader({
  brand = false,
  title,
  eyebrow,
  meta,
  right,
  children,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { gutter, isDesktop } = useLayout();

  return (
    <View className="bg-ink-900" style={{ paddingTop: isDesktop ? 20 : insets.top + 6 }}>
      <View
        className="w-full self-center"
        style={{ maxWidth: CONTENT_MAX_WIDTH, paddingHorizontal: gutter }}>
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
                className="font-display text-[22px] text-surface"
                style={{ letterSpacing: -0.4 }}>
                {title}
              </Text>
            )}

            {meta ? (
              <Text className="font-stat mt-1 text-[14px] tracking-stat text-slate-soft">
                {meta.toUpperCase()}
              </Text>
            ) : null}
          </View>

          {right}
        </View>

        {children ? <View className="pb-3.5">{children}</View> : null}
      </View>

      {/* The orange rule reads as the seam between chrome and content. */}
      <View className="h-[3px] bg-primary" />
    </View>
  );
}

type DetailHeaderProps = {
  onBack: () => void;
  title: string;
  right?: React.ReactNode;
};

/**
 * Header for pushed screens. Same ink slab so navigating deeper never drops out
 * of the app's chrome, but compact — the content below is the subject.
 */
export function DetailHeader({ onBack, title, right }: DetailHeaderProps) {
  const insets = useSafeAreaInsets();
  const { gutter, isDesktop } = useLayout();

  return (
    <View className="bg-ink-900" style={{ paddingTop: isDesktop ? 16 : insets.top + 4 }}>
      <View
        className="w-full self-center"
        style={{ maxWidth: CONTENT_MAX_WIDTH, paddingHorizontal: gutter }}>
        <View className="flex-row items-center pb-3">
          <Touchable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="h-9 w-9 items-center justify-center rounded-full bg-ink-700">
            <Ionicons name="chevron-back" size={18} color={COLORS.surface} />
          </Touchable>

          <Text className="font-stat ml-3 flex-1 text-[17px] tracking-eyebrow text-surface">
            {title.toUpperCase()}
          </Text>

          {right}
        </View>
      </View>

      <View className="h-[3px] bg-primary" />
    </View>
  );
}

/** Circular icon button sized for the header slab's right slot. */
export function HeaderIconButton({
  icon,
  label,
  onPress,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  /** Count bubble — omitted when zero. */
  badge?: number;
}) {
  return (
    <Touchable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-10 w-10 items-center justify-center rounded-full bg-ink-700">
      <Ionicons name={icon} size={19} color={COLORS.surface} />
      {badge && badge > 0 ? (
        <View className="absolute -right-0.5 -top-0.5 h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-ink-900 bg-primary px-1">
          <Text className="font-sans-bold text-[10px] text-surface">{badge}</Text>
        </View>
      ) : null}
    </Touchable>
  );
}
