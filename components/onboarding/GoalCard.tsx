import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import type { PlayerGoal } from '../../lib/api';
import { COLORS } from '../../lib/theme';
import { Touchable } from '../Touchable';

export type GoalOption = {
  key: PlayerGoal;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Per-goal accent so the list scans as five distinct options. */
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

/** Multi-select goal row: tinted icon tile, title/subtitle, trailing checkbox. */
export function GoalCard({ option, selected, onToggle }: GoalCardProps) {
  return (
    <Touchable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${option.title}. ${option.subtitle}`}
      scaleTo={0.985}
      className={`mb-2.5 flex-row items-center rounded-card border px-3.5 py-3.5 ${
        selected ? 'border-primary bg-primary-soft' : 'border-border bg-surface'
      }`}
      // 2px selected border without shifting the row, since both states set a
      // border width.
      style={{ borderWidth: selected ? 2 : 1 }}>
      <View
        className="h-10 w-10 items-center justify-center rounded-md"
        style={{ backgroundColor: `${option.tint}1F` }}>
        <Ionicons name={option.icon} size={19} color={option.tint} />
      </View>

      <View className="ml-3.5 flex-1">
        <Text className="font-sans-semibold text-[14px] leading-[19px] text-ink">
          {option.title}
        </Text>
        <Text className="font-sans mt-0.5 text-[12px] leading-[16px] text-slate">
          {option.subtitle}
        </Text>
      </View>

      <View
        className={`ml-2.5 h-[24px] w-[24px] items-center justify-center rounded-badge border ${
          selected ? 'border-primary bg-primary' : 'border-border-strong bg-surface'
        }`}>
        {selected ? <Ionicons name="checkmark" size={15} color={COLORS.surface} /> : null}
      </View>
    </Touchable>
  );
}
