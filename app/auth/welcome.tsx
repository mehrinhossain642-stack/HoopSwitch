import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AuthScaffold, OrDivider } from '../../components/AuthScaffold';
import { Button } from '../../components/Button';
import { Touchable } from '../../components/Touchable';
import type { UserRole } from '../../lib/api';
import { CARD_SHADOW, COLORS } from '../../lib/theme';

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
    tile: COLORS.chrome,
    points: ['Ranked candidates', 'Slot requirements', 'Direct invites'],
  },
];

/**
 * Role selection.
 *
 * Picking is separate from committing. Tapping a card used to navigate straight
 * to sign-up, so a misclick silently decided which product you got — and the
 * Player card had its selected border hardcoded, so it always looked chosen
 * whether it was or not. Now selection is state, the highlight reflects it, and
 * Continue is what commits.
 */
export default function WelcomeScreen() {
  const [selected, setSelected] = useState<UserRole | null>(null);

  return (
    <AuthScaffold
      eyebrow="Get started"
      title="Which side of the court?"
      subtitle="This sets up your profile and what you see first. Pick the one that's you, then continue."
      footer={
        <Button
          label="Continue"
          size="lg"
          icon="arrow-forward"
          iconTrailing
          disabled={selected === null}
          onPress={() => {
            if (!selected) return;
            router.push({ pathname: '/auth/sign-up', params: { role: selected } });
          }}
        />
      }>
      {/* radiogroup, because exactly one of these can be true at a time. */}
      <View accessibilityRole="radiogroup">
        {ROLES.map((option) => (
          <RoleCard
            key={option.role}
            option={option}
            selected={selected === option.role}
            onSelect={() => setSelected(option.role)}
          />
        ))}
      </View>

      <OrDivider />

      <Touchable
        onPress={() => router.push('/auth/sign-in')}
        accessibilityRole="button"
        accessibilityLabel="Sign in to an existing account"
        scaleTo={1}
        dimTo={0.6}
        className="h-11 items-center justify-center">
        <Text className="font-sans text-[13px] text-slate">
          Already have an account? <Text className="font-sans-bold text-primary">Sign in</Text>
        </Text>
      </Touchable>
    </AuthScaffold>
  );
}

function RoleCard({
  option,
  selected,
  onSelect,
}: {
  option: RoleOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Touchable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${option.title}. ${option.body}`}
      scaleTo={0.985}
      dimTo={1}
      // Both states carry border-2, so selecting can't shift the row by a pixel.
      className={`mb-3 overflow-hidden rounded-card border-2 ${
        selected ? 'border-primary bg-primary-soft' : 'border-border bg-surface'
      }`}
      style={CARD_SHADOW}>
      <View className="flex-row items-start p-4">
        <View
          className="h-12 w-12 items-center justify-center rounded-md"
          style={{ backgroundColor: option.tile }}>
          <Ionicons name={option.icon} size={23} color="#FFFFFF" />
        </View>

        <View className="ml-3.5 flex-1">
          <View className="flex-row items-center">
            <Text className="font-display flex-1 text-[17px] text-ink">{option.title}</Text>

            {/* Radio dot rather than a chevron — a chevron promises navigation,
                and tapping no longer navigates. */}
            <View
              className={`ml-2 h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${
                selected ? 'border-primary bg-primary' : 'border-border-strong'
              }`}>
              {selected ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
            </View>
          </View>

          <Text className="font-sans mt-1.5 text-[13px] leading-[19px] text-slate">
            {option.body}
          </Text>
        </View>
      </View>

      <View
        className={`flex-row flex-wrap gap-x-4 gap-y-1.5 border-t px-4 py-3 ${
          selected ? 'border-primary/20 bg-primary-soft' : 'border-border bg-bg'
        }`}>
        {option.points.map((point) => (
          <View key={point} className="flex-row items-center">
            <Ionicons name="checkmark" size={13} color={COLORS.good} />
            <Text className="font-sans-medium ml-1.5 text-[12px] text-slate">{point}</Text>
          </View>
        ))}
      </View>
    </Touchable>
  );
}
