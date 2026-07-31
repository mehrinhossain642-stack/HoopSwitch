import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import { COLORS } from '../lib/theme';

type IconPair = {
  active: keyof typeof Ionicons.glyphMap;
  idle: keyof typeof Ionicons.glyphMap;
};

const FALLBACK_ICON: IconPair = { active: 'ellipse', idle: 'ellipse-outline' };

const ICONS: Record<string, IconPair> = {
  index: { active: 'home', idle: 'home-outline' },
  profile: { active: 'person', idle: 'person-outline' },
};

/**
 * Custom bottom tab bar: orange active state, safe-area aware.
 * Shared by the player and coach tab groups.
 */
export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View
      className="flex-row border-t border-border bg-surface pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
      {state.routes.map((route, index) => {
        const options = descriptors[route.key]?.options;
        const label =
          typeof options?.tabBarLabel === 'string'
            ? options.tabBarLabel
            : (options?.title ?? route.name);
        const focused = state.index === index;
        const icon = ICONS[route.name] ?? FALLBACK_ICON;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            className="flex-1 items-center justify-center py-1">
            <Ionicons
              name={focused ? icon.active : icon.idle}
              size={22}
              color={focused ? COLORS.primary : COLORS.slate}
            />
            <Text
              className={`mt-1 text-[11px] ${
                focused ? 'font-sans-bold text-primary' : 'font-sans-medium text-slate'
              }`}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
