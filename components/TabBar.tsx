import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useLayout } from '../lib/layout';
import { useSession } from '../lib/session';
import { COLORS, useThemeColors } from '../lib/theme';
import { Wordmark } from './AppHeader';
import { Touchable } from './Touchable';

type IconPair = {
  active: keyof typeof Ionicons.glyphMap;
  idle: keyof typeof Ionicons.glyphMap;
};

const FALLBACK_ICON: IconPair = { active: 'ellipse', idle: 'ellipse-outline' };

/** Where each role's account controls live, for the rail's footer hint. */
const ACCOUNT_TAB: Record<string, string> = {
  player: 'the Profile tab',
  coach: 'the Team tab',
  parent: 'the Profile tab',
  admin: 'Settings',
};

const ICONS: Record<string, IconPair> = {
  index: {
    active: 'home',
    idle: 'home-outline',
  },

  opportunities: {
    active: 'basketball',
    idle: 'basketball-outline',
  },

  activity: {
    active: 'options',
    idle: 'options-outline',
  },

  profile: {
    active: 'person',
    idle: 'person-outline',
  },

  applications: {
    active: 'document-text',
    idle: 'document-text-outline',
  },

  teams: {
    active: 'people',
    idle: 'people-outline',
  },

  stats: {
    active: 'stats-chart',
    idle: 'stats-chart-outline',
  },

  users: {
    active: 'person-circle',
    idle: 'person-circle-outline',
  },

  settings: {
    active: 'settings',
    idle: 'settings-outline',
  },
};


type TabItem = {
  key: string;
  label: string;
  focused: boolean;
  icon: IconPair;
  a11yLabel: string;
  onPress: () => void;
};

/** Flattens the navigator state into a plain list of tabs. */
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
 * with two tabs pinned to the bottom edge is the tell that a web build is just a
 * stretched phone app.
 *
 * The tab group sets `tabBarPosition` to match, so the navigator lays out in a row
 * when the rail is showing.
 */
export function TabBar(props: BottomTabBarProps) {
  const { isDesktop } = useLayout();
  return isDesktop ? <NavRail {...props} /> : <BottomTabs {...props} />;
}

function BottomTabs(props: BottomTabBarProps) {
  const items = useTabItems(props);
  const colors = useThemeColors();
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
            color={item.focused ? colors.primary : colors.slate}
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
  const { user } = useSession();

  return (
    <View className="w-[232px] border-r border-chrome-border bg-chrome px-3 pb-4 pt-6">
      <View className="mb-6 px-2">
        <Wordmark size={21} onDark />
        {user ? (
          <Text className="font-stat mt-1 text-[13px] tracking-eyebrow text-chrome-text-muted">
            {user.role.toUpperCase()}
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
            item.focused ? 'bg-chrome-raised' : ''
          }`}>
          <View
            className={`mr-3 h-5 w-[3px] rounded-full ${
              item.focused ? 'bg-primary' : 'bg-transparent'
            }`}
          />
          <Ionicons
            name={item.focused ? item.icon.active : item.icon.idle}
            size={19}
            color={item.focused ? COLORS.primary : COLORS.chromeTextMuted}
          />
          <Text
            className={`ml-3 text-[14px] ${
              item.focused
                ? 'font-sans-bold text-chrome-text'
                : 'font-sans-medium text-chrome-text-muted'
            }`}>
            {item.label}
          </Text>
        </Touchable>
      ))}

      <View className="flex-1" />

      {/* Sign-out deliberately lives on the profile screen, not here — it ends the
          session rather than navigating, so it shouldn't sit among destinations. */}
      <Text className="font-sans px-3 text-[11px] leading-[15px] text-chrome-text-muted">
        Manage your account from{'\n'}
        {ACCOUNT_TAB[user?.role ?? 'player']}.
      </Text>
    </View>
  );
}
