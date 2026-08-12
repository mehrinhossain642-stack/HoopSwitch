import { Text, View } from 'react-native';

type SectionTitleProps = {
  title: string;
  /** Trailing slot — a count, a link, a small action. */
  action?: React.ReactNode;
  onDark?: boolean;
  className?: string;
};

/**
 * Section header: a short orange tick, then the title in condensed uppercase.
 * The tick repeats down every screen and is the cheapest cue that these
 * sections belong to one product.
 */
export function SectionTitle({
  title,
  action,
  onDark = false,
  className = '',
}: SectionTitleProps) {
  return (
    <View className={`flex-row items-center justify-between ${className}`}>
      <View className="flex-1 flex-row items-center">
        <View className="mr-2.5 h-[15px] w-[3px] rounded-full bg-primary" />
        <Text
          className={`font-stat text-[17px] tracking-eyebrow ${
            onDark ? 'text-surface' : 'text-ink'
          }`}
          accessibilityRole="header">
          {title.toUpperCase()}
        </Text>
      </View>
      {action}
    </View>
  );
}

/** Standalone uppercase caption for list counts and inline metadata. */
export function Eyebrow({
  children,
  className = '',
  tone = 'slate',
}: {
  children: string;
  className?: string;
  tone?: 'slate' | 'primary' | 'onDark';
}) {
  const color =
    tone === 'primary' ? 'text-primary' : tone === 'onDark' ? 'text-slate-soft' : 'text-slate';

  return (
    <Text className={`font-stat text-[14px] tracking-eyebrow ${color} ${className}`}>
      {children.toUpperCase()}
    </Text>
  );
}
