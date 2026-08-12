import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { AuthScaffold, OrDivider } from '../../components/AuthScaffold';
import { Card } from '../../components/Card';
import { Touchable } from '../../components/Touchable';
import type { UserRole } from '../../lib/api';
import { COLORS } from '../../lib/theme';

type RoleOption = {
  role: UserRole;
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Tile colour — orange for the player path, ink for the coach path. */
  tile: string;
  points: string[];
};

const ROLES: readonly RoleOption[] = [
  {
    role: 'player',
    title: "I'm a player",
    body: 'Get scored against real roster openings and put your tape in front of coaches.',
    icon: 'basketball',
    tile: COLORS.primary,
    points: ['Fit-scored openings', 'Highlight reel', 'Career stats'],
  },
  {
    role: 'coach',
    title: "I'm a coach",
    body: 'Post the slot you need and see every candidate ranked against it.',
    icon: 'clipboard',
    tile: COLORS.ink,
    points: ['Ranked candidates', 'Slot requirements', 'Direct invites'],
  },
];

export default function WelcomeScreen() {
  return (
    <AuthScaffold
      eyebrow="Get started"
      title="Which side of the court?"
      subtitle="This sets up your profile and what you see first. You can't switch later, so pick the one that's you.">
      {ROLES.map((option) => (
        <RoleCard key={option.role} option={option} />
      ))}

      <OrDivider />

      <Touchable
        onPress={() => router.push('/auth/sign-in')}
        accessibilityRole="button"
        accessibilityLabel="Sign in to an existing account"
        scaleTo={1}
        dimTo={0.6}
        className="h-11 items-center justify-center">
        <Text className="font-sans text-[13px] text-slate">
          Already have an account?{' '}
          <Text className="font-sans-bold text-primary">Sign in</Text>
        </Text>
      </Touchable>
    </AuthScaffold>
  );
}

function RoleCard({ option }: { option: RoleOption }) {
  return (
    <Touchable
      onPress={() =>
        router.push({ pathname: '/auth/sign-up', params: { role: option.role } })
      }
      accessibilityRole="button"
      accessibilityLabel={option.title}
      scaleTo={0.985}
      dimTo={1}
      className="mb-3">
      <Card bare>
        <View className="flex-row items-start p-4">
          <View
            className="h-12 w-12 items-center justify-center rounded-md"
            style={{ backgroundColor: option.tile }}>
            <Ionicons name={option.icon} size={23} color={COLORS.surface} />
          </View>

          <View className="ml-3.5 flex-1">
            <View className="flex-row items-center">
              <Text className="font-display flex-1 text-[17px] text-ink">{option.title}</Text>
              <Ionicons name="arrow-forward" size={17} color={COLORS.slate} />
            </View>
            <Text className="font-sans mt-1.5 text-[13px] leading-[19px] text-slate">
              {option.body}
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-x-4 gap-y-1.5 border-t border-border bg-bg px-4 py-3">
          {option.points.map((point) => (
            <View key={point} className="flex-row items-center">
              <Ionicons name="checkmark" size={13} color={COLORS.good} />
              <Text className="font-sans-medium ml-1.5 text-[12px] text-slate">{point}</Text>
            </View>
          ))}
        </View>
      </Card>
    </Touchable>
  );
}
