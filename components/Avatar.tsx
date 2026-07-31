import { Text, View } from 'react-native';

type AvatarProps = {
  name: string;
  size?: number;
  /** `square` is used for team logos, `round` for people. */
  shape?: 'round' | 'square';
};

const PALETTE = [
  '#2C3E7B',
  '#8A3B2E',
  '#1F6B52',
  '#5B3B7B',
  '#8A6A1F',
  '#2E5F73',
] as const;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

/** Deterministic color per name so avatars stay stable across renders. */
function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997;
  }
  return PALETTE[hash % PALETTE.length] ?? PALETTE[0];
}

/** Initials-based avatar — no image hosting anywhere in the prototype. */
export function Avatar({ name, size = 44, shape = 'round' }: AvatarProps) {
  return (
    <View
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: shape === 'round' ? size / 2 : size * 0.24,
        backgroundColor: colorFor(name),
      }}>
      <Text
        className="font-display text-surface"
        style={{ fontSize: size * 0.38, lineHeight: size * 0.46 }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}
