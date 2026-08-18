import { Text, View } from 'react-native';
import type { PostingStatus } from '../data/types';
import { useThemeColors } from '../lib/theme';

const STATUS_LABEL: Record<PostingStatus, string> = {
  open: 'Open',
  in_review: 'In review',
  closed: 'Closed',
};

/**
 * Resolved per render rather than at module scope — status colours are accents,
 * and accents lift in dark mode.
 */
export function useStatusColors() {
  const colors = useThemeColors();

  const map: Record<PostingStatus, { fg: string; bg: string }> = {
    open: { fg: colors.good, bg: colors.goodSoft },
    in_review: { fg: colors.partial, bg: colors.partialSoft },
    closed: { fg: colors.slate, bg: colors.mist },
  };

  return map;
}

/** Rail colour for a slot card's left edge. */
export function useStatusRail(): Record<PostingStatus, string> {
  const colors = useThemeColors();

  return {
    open: colors.good,
    in_review: colors.partial,
    closed: colors.borderStrong,
  };
}

/**
 * Posting status. Carries a dot as well as colour, so the state doesn't depend on
 * telling green from amber.
 */
export function StatusPill({
  status,
  onDark = false,
}: {
  status: PostingStatus;
  onDark?: boolean;
}) {
  const { fg, bg } = useStatusColors()[status];

  return (
    <View
      className="flex-row items-center rounded-full px-2 py-1"
      style={{ backgroundColor: onDark ? 'rgba(255,255,255,0.12)' : bg }}
      accessibilityLabel={`Status: ${STATUS_LABEL[status]}`}>
      <View
        className="mr-1.5 h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: onDark ? '#FFFFFF' : fg }}
      />
      <Text
        className="font-stat text-[12px] tracking-eyebrow"
        style={{ color: onDark ? '#FFFFFF' : fg }}>
        {STATUS_LABEL[status].toUpperCase()}
      </Text>
    </View>
  );
}

/** Leading-dot pill used for "Free agent" and "Recruiting — N open slots". */
export function DotPill({
  label,
  tone = 'primary',
}: {
  label: string;
  tone?: 'primary' | 'slate' | 'onDark';
}) {
  const colors = useThemeColors();

  const palette =
    tone === 'primary'
      ? { fg: colors.primary, bg: colors.primarySoft }
      : tone === 'onDark'
        ? // On the ink chrome, which doesn't flip — so these are literals.
          { fg: '#FFFFFF', bg: 'rgba(255,255,255,0.12)' }
        : { fg: colors.slate, bg: colors.mist };

  return (
    <View
      className="flex-row items-center self-start rounded-full px-2.5 py-1.5"
      style={{ backgroundColor: palette.bg }}>
      <View
        className="mr-2 h-[6px] w-[6px] rounded-full"
        style={{ backgroundColor: palette.fg }}
      />
      <Text className="font-stat text-[13px] tracking-eyebrow" style={{ color: palette.fg }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}
