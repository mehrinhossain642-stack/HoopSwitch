import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import type { PlayerGoal } from '../../lib/api';
import { COLORS } from '../../lib/theme';

export type GoalOption = {
  key: PlayerGoal;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Per-goal accent, matching the coloured glyphs in the mock. */
  tint: string;
};

export const GOAL_OPTIONS: readonly GoalOption[] = [
  {
    key: 'u_sports',
    title: 'Play U SPORTS basketball',
    subtitle: 'Compete at the U SPORTS level',
    icon: 'basketball',
    tint: '#F04E23',
  },
  {
    key: 'ncaa',
    title: 'Play college basketball (NCAA)',
    subtitle: 'Compete at the NCAA level',
    icon: 'school',
    tint: '#1D4ED8',
  },
  {
    key: 'professional',
    title: 'Go professional',
    subtitle: 'Play professionally overseas or in a league',
    icon: 'globe-outline',
    tint: '#1FA971',
  },
  {
    key: 'skills',
    title: 'Improve my skills',
    subtitle: 'Focus on skill development',
    icon: 'trending-up',
    tint: '#7C3AED',
  },
  {
    key: 'exposure',
    title: 'Get more exposure',
    subtitle: 'Gain visibility to coaches',
    icon: 'eye-outline',
    tint: '#E8A33D',
  },
];

type GoalCardProps = {
  option: GoalOption;
  selected: boolean;
  onToggle: () => void;
};

/** Multi-select goal row: tinted icon, title/subtitle, trailing checkbox. */
export function GoalCard({ option, selected, onToggle }: GoalCardProps) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      className={`mb-2.5 flex-row items-center rounded-card border px-3.5 py-3.5 ${
        selected ? 'border-primary bg-primary/5' : 'border-border bg-surface'
      }`}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <View
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: `${option.tint}1A` }}>
        <Ionicons name={option.icon} size={18} color={option.tint} />
      </View>

      <View className="ml-3 flex-1">
        <Text className="font-sans-semibold text-[14px] text-ink">{option.title}</Text>
        <Text className="font-sans mt-0.5 text-[12px] leading-[16px] text-slate">
          {option.subtitle}
        </Text>
      </View>

      <View
        className={`ml-2 h-[22px] w-[22px] items-center justify-center rounded-md border ${
          selected ? 'border-primary bg-primary' : 'border-border bg-surface'
        }`}>
        {selected ? <Ionicons name="checkmark" size={14} color={COLORS.surface} /> : null}
      </View>
    </Pressable>
  );
}
