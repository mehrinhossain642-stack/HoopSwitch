import { Text, View } from 'react-native';
import type { PostingStatus } from '../data/types';

const STATUS_LABEL: Record<PostingStatus, string> = {
  open: 'Open',
  in_review: 'In review',
  closed: 'Closed',
};

const STATUS_STYLE: Record<PostingStatus, { text: string; bg: string }> = {
  open: { text: 'text-good', bg: 'rgba(31,169,113,0.12)' },
  in_review: { text: 'text-partial', bg: 'rgba(232,163,61,0.14)' },
  closed: { text: 'text-slate', bg: 'rgba(91,97,110,0.12)' },
};

export function StatusPill({ status }: { status: PostingStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <View className="rounded-full px-2 py-1" style={{ backgroundColor: style.bg }}>
      <Text className={`font-sans-bold text-[10px] tracking-wider ${style.text}`}>
        {STATUS_LABEL[status].toUpperCase()}
      </Text>
    </View>
  );
}

type DotPillProps = {
  label: string;
  tone?: 'primary' | 'slate';
};

/** Leading-dot pill used for "Free Agent" and "Recruiting — N open slots". */
export function DotPill({ label, tone = 'primary' }: DotPillProps) {
  const isPrimary = tone === 'primary';
  return (
    <View
      className="flex-row items-center self-center rounded-full px-3 py-1.5"
      style={{ backgroundColor: isPrimary ? 'rgba(240,78,35,0.10)' : 'rgba(91,97,110,0.10)' }}>
      <View className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isPrimary ? 'bg-primary' : 'bg-slate'}`} />
      <Text
        className={`font-sans-bold text-[11px] tracking-wider ${isPrimary ? 'text-primary' : 'text-slate'}`}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}
