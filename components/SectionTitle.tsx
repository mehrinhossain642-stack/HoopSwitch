import { Text, View } from 'react-native';

type SectionTitleProps = {
  title: string;
  action?: React.ReactNode;
  className?: string;
};

export function SectionTitle({ title, action, className = '' }: SectionTitleProps) {
  return (
    <View className={`flex-row items-center justify-between ${className}`}>
      <Text className="font-display text-[18px] text-ink">{title}</Text>
      {action}
    </View>
  );
}
