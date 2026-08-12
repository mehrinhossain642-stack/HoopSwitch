import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useLayout } from '../lib/layout';
import { useSession } from '../lib/session';
import { COLORS } from '../lib/theme';
import { Wordmark } from './AppHeader';
import { Touchable } from './Touchable';

type IconPair = {
  active: keyof typeof Ionicons.glyphMap;
  idle: keyof typeof Ionicons.glyphMap;
};

const FALLBACK_ICON: IconPair = { active: 'ellipse', idle: 'ellipse-outline' };

const ICONS: Record<string, IconPair> = {
  index: { active: 'basketball', idle: 'basketball-outline' },
  profile: { active: 'person', idle: 'person-outline' },
};

type TabItem = {
  key: string;
  label: string;
  focused: boolean;
  icon: IconPair;
  a11yLabel: string;
  onPress: () => void;
};

/** Derives a plain list of tabs from the navigator state. */
function useTabItems({ state, descriptors, navigation }: BottomTabBarProps): TabItem[] {
  return state.routes.map((route, index) => {
    const options = descriptors[route.key]?.options;
    const label =
      typeof options?.tabBarLabel === 'string'
        ? options.tabBarLabel
        : (options?.title ?? route.name);
    const focused = state.index === index;

    return {
      key: route.key,
      label,
      focused,
      icon: ICONS[route.name] ?? FALLBACK_ICON,
      a11yLabel: options?.tabBarAccessibilityLabel ?? label,
      onPress: () => {
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });
        if (!focused && !event.defaultPrevented) {
          navigation.navigate(route.name);
        }
      },
    };
  });
}

/**
 * Adaptive primary navigation. Below `lg` this is a bottom tab bar; at `lg` and
 * above it becomes a persistent left rail, because a 1400px-wide browser window
 * with two tabs pinned to the bottom edge is the tell that a web build is just
 * a stretched phone app.
 *
 * The tab group sets `tabBarPosition` to match, so the navigator lays out in a
 * row when the rail is showing.
 */
export function TabBar(props: BottomTabBarProps) {
  const { isDesktop } = useLayout();
  return isDesktop ? <NavRail {...props} /> : <BottomTabs {...props} />;
}

function BottomTabs(props: BottomTabBarProps) {
  const items = useTabItems(props);
  const { insets } = props;

  return (
    <View
      className="flex-row border-t border-border bg-surface"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
      {items.map((item) => (
        <Touchable
          key={item.key}
          accessibilityRole="button"
          accessibilityState={item.focused ? { selected: true } : {}}
          accessibilityLabel={item.a11yLabel}
          onPress={item.onPress}
          scaleTo={1}
          dimTo={0.6}
          // 52px of content plus the safe-area pad clears the 44pt minimum.
          className="flex-1 items-center justify-center pb-1 pt-2.5">
          {/* Active marker sits above the icon and never changes layout. */}
          <View
            className={`absolute left-0 right-0 top-0 h-[3px] ${
              item.focused ? 'bg-primary' : 'bg-transparent'
            }`}
          />
          <Ionicons
            name={item.focused ? item.icon.active : item.icon.idle}
            size={22}
            color={item.focused ? COLORS.primary : COLORS.slate}
          />
          <Text
            className={`mt-1 text-[11px] ${
              item.focused ? 'font-sans-bold text-primary' : 'font-sans-medium text-slate'
            }`}>
            {item.label}
          </Text>
        </Touchable>
      ))}
    </View>
  );
}

/** Desktop left rail. Shares the ink chrome with the header slab. */
function NavRail(props: BottomTabBarProps) {
  const items = useTabItems(props);
  const router = useRouter();
  const { signOut, user } = useSession();

  return (
    <View className="w-[232px] border-r border-ink-700 bg-ink-900 px-3 pb-4 pt-6">
      <View className="mb-6 px-2">
        <Wordmark size={21} onDark />
        {user ? (
          <Text className="font-stat mt-1 text-[13px] tracking-eyebrow text-slate-soft">
            {user.role === 'coach' ? 'COACH' : 'PLAYER'}
          </Text>
        ) : null}
      </View>

      {items.map((item) => (
        <Touchable
          key={item.key}
          accessibilityRole="button"
          accessibilityState={item.focused ? { selected: true } : {}}
          accessibilityLabel={item.a11yLabel}
          onPress={item.onPress}
          scaleTo={1}
          dimTo={0.75}
          className={`mb-1 h-11 flex-row items-center rounded-btn px-3 ${
            item.focused ? 'bg-ink-700' : ''
          }`}>
          <View
            className={`mr-3 h-5 w-[3px] rounded-full ${
              item.focused ? 'bg-primary' : 'bg-transparent'
            }`}
          />
          <Ionicons
            name={item.focused ? item.icon.active : item.icon.idle}
            size={19}
            color={item.focused ? COLORS.primary : COLORS.slateSoft}
          />
          <Text
            className={`ml-3 text-[14px] ${
              item.focused ? 'font-sans-bold text-surface' : 'font-sans-medium text-slate-soft'
            }`}>
            {item.label}
          </Text>
        </Touchable>
      ))}

      <View className="flex-1" />

      {/* Sign-out is kept apart from the destinations above — it ends the
          session rather than navigating anywhere. */}
      <View className="border-t border-ink-700 pt-3">
        <Touchable
          onPress={() => {
            signOut().finally(() => router.replace('/'));
          }}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          scaleTo={1}
          dimTo={0.75}
          className="h-10 flex-row items-center rounded-btn px-3">
          <Ionicons name="log-out-outline" size={18} color={COLORS.slateSoft} />
          <Text className="font-sans-medium ml-3 text-[13px] text-slate-soft">Sign out</Text>
        </Touchable>
      </View>
    </View>
  );
}
