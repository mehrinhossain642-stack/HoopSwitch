import { Text, View } from 'react-native';

export type Spec = { label: string; value: string };

/** Evenly divided label/value row used for posting specs and physicals. */
export function SpecRow({ specs }: { specs: Spec[] }) {
  return (
    <View className="flex-row rounded-btn border border-border bg-bg px-1 py-2">
      {specs.map((spec, index) => (
        <View
          key={spec.label}
          className={`flex-1 items-center ${
            index < specs.length - 1 ? 'border-r border-border' : ''
          }`}>
          <Text className="font-sans-semibold text-[9px] uppercase tracking-widest text-slate">
            {spec.label}
          </Text>
          <Text className="font-sans-bold mt-1 text-[13px] text-ink">{spec.value}</Text>
        </View>
      ))}
    </View>
  );
}
