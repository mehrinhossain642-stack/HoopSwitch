import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { ScrollView, Text, View } from 'react-native';
import { useSession } from '../lib/session';
import { useGoBack } from '../lib/useGoBack';
import { useThemeColors } from '../lib/theme';
import { useThemePreference, type ThemePreference } from '../lib/themePreference';
import { DetailHeader } from './AppHeader';
import { Card } from './Card';
import { Screen, useContentContainerStyle } from './Screen';
import { SectionTitle } from './SectionTitle';
import { Segmented } from './Segmented';
import { SignOutButton } from './SignOutButton';

const THEME_SEGMENTS = [
  { value: 'light' as ThemePreference, label: 'Light', icon: 'sunny-outline' as const },
  { value: 'dark' as ThemePreference, label: 'Dark', icon: 'moon-outline' as const },
  { value: 'system' as ThemePreference, label: 'Auto', icon: 'contrast-outline' as const },
];

/**
 * Settings, shared by both roles — the routes differ only because each role group
 * owns its own Stack.
 *
 * Everything here is real. No placeholder toggles: a switch that doesn't do
 * anything is worse than a setting that isn't offered yet.
 */
export function SettingsScreen() {
  const { user } = useSession();
  // Settings is reachable by direct URL, so back needs a destination of its own.
  const goBack = useGoBack(user?.role === 'coach' ? '/coach/profile' : '/player/profile');
  const colors = useThemeColors();
  const contentStyle = useContentContainerStyle({ measure: 'form', paddingTop: 20 });
  const { preference, resolved, setPreference } = useThemePreference();

  const version = Constants.expoConfig?.version ?? '—';

  return (
    <Screen edges={[]}>
      <DetailHeader onBack={goBack} title="Settings" />

      <ScrollView contentContainerStyle={contentStyle} showsVerticalScrollIndicator={false}>
        <SectionTitle title="Appearance" className="mb-3" />
        <Card>
          <Text className="font-sans-semibold text-[14px] text-ink">Theme</Text>
          <Text className="font-sans mt-1 text-[12px] leading-[17px] text-slate">
            Auto follows your device setting.
          </Text>

          <Segmented
            segments={THEME_SEGMENTS}
            value={preference}
            onChange={setPreference}
            className="mt-3"
          />

          {preference === 'system' ? (
            <View className="mt-2.5 flex-row items-center">
              <Ionicons name="phone-portrait-outline" size={13} color={colors.slate} />
              <Text className="font-sans ml-1.5 text-[12px] text-slate">
                Your device is currently {resolved}.
              </Text>
            </View>
          ) : null}
        </Card>

        <SectionTitle title="Account" className="mb-3 mt-6" />
        <Card>
          <Text className="font-stat text-[14px] tracking-eyebrow text-slate">SIGNED IN AS</Text>
          <Text className="font-sans-semibold mt-1.5 text-[14px] text-ink" numberOfLines={1}>
            {user?.email ?? 'Unknown account'}
          </Text>
          <Text className="font-sans mt-0.5 text-[12px] text-slate">
            {user?.role === 'coach' ? 'Coach account' : 'Player account'}
          </Text>
        </Card>

        <View className="mt-3">
          <SignOutButton />
        </View>

        <SectionTitle title="About" className="mb-3 mt-6" />
        <Card>
          <View className="flex-row items-center justify-between">
            <Text className="font-sans text-[13px] text-slate">Version</Text>
            <Text className="font-stat text-[16px] tracking-stat text-ink">{version}</Text>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
