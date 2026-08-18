import { Text, View } from 'react-native';

/**
 * Jersey-adjacent palette: deep, saturated colours that hold white text at 4.5:1
 * and don't compete with brand orange.
 */
const PALETTE = [
  '#1E3A6E',
  '#8A2B23',
  '#155E45',
  '#4A2C6B',
  '#7A5410',
  '#1F4E5F',
  '#5B2350',
  '#2C4A22',
] as const;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

/** Deterministic colour per name so avatars stay stable across renders. */
function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997;
  }
  return PALETTE[hash % PALETTE.length] ?? PALETTE[0];
}

/** Initials monogram — there's no image hosting anywhere in the app yet. */
export function Avatar({
  name,
  size = 44,
  shape = 'round',
  ring = false,
}: {
  name: string;
  size?: number;
  /** `square` for team crests, `round` for people. */
  shape?: 'round' | 'square';
  /** Light ring — for avatars sitting on the ink chrome. */
  ring?: boolean;
}) {
  return (
    <View
      className="items-center justify-center"
      accessibilityLabel={name}
      style={{
        width: size,
        height: size,
        borderRadius: shape === 'round' ? size / 2 : Math.max(8, size * 0.2),
        backgroundColor: colorFor(name),
        ...(ring ? { borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)' } : {}),
      }}>
      <Text
        className="font-stat-bold text-white"
        style={{ fontSize: size * 0.44, lineHeight: size * 0.52, letterSpacing: 0.5 }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}
