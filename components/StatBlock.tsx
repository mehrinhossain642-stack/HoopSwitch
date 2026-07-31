import { Text, View } from 'react-native';

type StatBlockProps = {
  value: string | number;
  label: string;
  /** `lg` for profile heroes, `sm` for the mini rows inside feed cards. */
  size?: 'sm' | 'lg';
};

/** Big condensed number stacked over a tiny gray label. */
export function StatBlock({ value, label, size = 'lg' }: StatBlockProps) {
  return (
    <View className="flex-1 items-center">
      <Text
        className={`font-display text-ink ${size === 'lg' ? 'text-[28px] leading-8' : 'text-[17px] leading-6'}`}>
        {value}
      </Text>
      <Text
        className={`font-sans-semibold text-slate ${size === 'lg' ? 'mt-1 text-[10px]' : 'text-[9px]'} tracking-widest`}>
        {label}
      </Text>
    </View>
  );
}
