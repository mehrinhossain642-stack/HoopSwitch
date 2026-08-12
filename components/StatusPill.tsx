import { Text, View } from 'react-native';
import type { PostingStatus } from '../data/types';
import { COLORS } from '../lib/theme';

const STATUS_LABEL: Record<PostingStatus, string> = {
  open: 'Open',
  in_review: 'In review',
  closed: 'Closed',
};

const STATUS_COLOR: Record<PostingStatus, { fg: string; bg: string }> = {
  open: { fg: COLORS.good, bg: COLORS.goodSoft },
  in_review: { fg: COLORS.partial, bg: COLORS.partialSoft },
  closed: { fg: COLORS.slate, bg: COLORS.mist },
};

/**
 * Posting status. Carries a dot as well as colour so the state doesn't depend
 * on distinguishing green from amber.
 */
export function StatusPill({ status, onDark = false }: { status: PostingStatus; onDark?: boolean }) {
  const { fg, bg } = STATUS_COLOR[status];

  return (
    <View
      className="flex-row items-center rounded-full px-2 py-1"
      style={{ backgroundColor: onDark ? 'rgba(255,255,255,0.10)' : bg }}
      accessibilityLabel={`Status: ${STATUS_LABEL[status]}`}>
      <View
        className="mr-1.5 h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: onDark ? COLORS.surface : fg }}
      />
      <Text
        className="font-stat text-[12px] tracking-eyebrow"
        style={{ color: onDark ? COLORS.surface : fg }}>
        {STATUS_LABEL[status].toUpperCase()}
      </Text>
    </View>
  );
}

type DotPillProps = {
  label: string
  tone?: 'primary' | 'slate' | 'onDark';
};

/** Leading-dot pill used for "Free agent" and "Recruiting — N open slots". */
export function DotPill({ label, tone = 'primary' }: DotPillProps) {
  const palette =
    tone === 'primary'
      ? { fg: COLORS.primary, bg: COLORS.primarySoft }
      : tone === 'onDark'
        ? { fg: COLORS.surface, bg: 'rgba(255,255,255,0.12)' }
        : { fg: COLORS.slate, bg: COLORS.mist };

  return (
    <View
      className="flex-row items-center self-start rounded-full px-2.5 py-1.5"
      style={{ backgroundColor: palette.bg }}>
      <View className="mr-2 h-[6px] w-[6px] rounded-full" style={{ backgroundColor: palette.fg }} />
      <Text className="font-stat text-[13px] tracking-eyebrow" style={{ color: palette.fg }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}
