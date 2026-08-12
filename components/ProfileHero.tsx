import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONTENT_MAX_WIDTH, useLayout } from '../lib/layout';
import { Avatar } from './Avatar';
import { StatStrip, type Stat } from './StatStrip';

type ProfileHeroProps = {
  /** Small uppercase line at the very top — "My profile", "Team profile". */
  eyebrow: string;
  name: string;
  /** Location · age · eligibility, or league · location. */
  meta: string;
  /** Optional second metadata line, e.g. "Head coach · A. Miller". */
  submeta?: string;
  /** Sits next to the name — a position badge, typically. */
  badge?: React.ReactNode;
  /** Status pill under the metadata. */
  pill?: React.ReactNode;
  stats: Stat[];
  avatarShape?: 'round' | 'square';
  /** Top-right action, e.g. sign out. */
  action?: React.ReactNode;
};

/**
 * Profile header. Rather than a white card floating under dark chrome, the ink
 * slab extends to hold the whole identity block — avatar, name, status and the
 * stat line — so the top of the screen reads as one surface and the stats get
 * the contrast they deserve.
 */
export function ProfileHero({
  eyebrow,
  name,
  meta,
  submeta,
  badge,
  pill,
  stats,
  avatarShape = 'round',
  action,
}: ProfileHeroProps) {
  const insets = useSafeAreaInsets();
  const { gutter, isDesktop } = useLayout();

  return (
    <View className="bg-ink-900" style={{ paddingTop: isDesktop ? 20 : insets.top + 6 }}>
      <View
        className="w-full self-center pb-4"
        style={{ maxWidth: CONTENT_MAX_WIDTH, paddingHorizontal: gutter }}>
        <View className="mb-3.5 flex-row items-center justify-between">
          <Text className="font-stat text-[14px] tracking-eyebrow text-slate-soft">
            {eyebrow.toUpperCase()}
          </Text>
          {action}
        </View>

        <View className="flex-row items-center">
          <Avatar name={name} size={64} shape={avatarShape} ring />

          <View className="ml-4 flex-1">
            <View className="flex-row items-center">
              <Text
                className="font-display flex-shrink text-[22px] leading-[27px] text-surface"
                numberOfLines={2}
                style={{ letterSpacing: -0.4 }}
                accessibilityRole="header">
                {name}
              </Text>
              {badge ? <View className="ml-2.5">{badge}</View> : null}
            </View>

            <Text className="font-sans mt-1 text-[12px] leading-[17px] text-slate-soft">
              {meta}
            </Text>
            {submeta ? (
              <Text className="font-sans-medium mt-0.5 text-[12px] text-surface">{submeta}</Text>
            ) : null}
          </View>
        </View>

        {pill ? <View className="mt-3.5">{pill}</View> : null}

        <StatStrip className="mt-4" tone="dark" size="md" stats={stats} />
      </View>

      <View className="h-[3px] bg-primary" />
    </View>
  );
}
