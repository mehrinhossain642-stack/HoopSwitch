import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text } from 'react-native';
import { COLORS } from '../lib/theme';

type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

/** Filter pill for the feed headers. Dark when active, outlined when not. */
export function Chip({ label, active = false, onPress, icon }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 flex-row items-center rounded-full px-3.5 py-2 ${
        active ? 'bg-ink' : 'border border-border bg-surface'
      }`}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {icon ? (
        <Ionicons
          name={icon}
          size={13}
          color={active ? COLORS.surface : COLORS.slate}
          style={{ marginRight: 5 }}
        />
      ) : null}
      <Text
        className={`font-sans-semibold text-[13px] ${active ? 'text-surface' : 'text-slate'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
