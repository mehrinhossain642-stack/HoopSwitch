import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Linking, Pressable, Text, View } from 'react-native';
import type { Highlight } from '../data/types';
import { COLORS } from '../lib/theme';

function durationLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

/** Thumbnail card linking out to an external highlight URL. */
export function HighlightCard({ highlight }: { highlight: Highlight }) {
  return (
    <Pressable
      onPress={() => {
        void Linking.openURL(highlight.url);
      }}
      className="mr-3 w-[168px]"
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <View className="h-[96px] w-full overflow-hidden rounded-xl bg-ink">
        {/* Thumbnails are remote; the ink fill behind them keeps a failed
            load looking deliberate rather than broken. */}
        <Image
          source={{ uri: highlight.thumbnail_url }}
          className="h-full w-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 items-center justify-center">
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(20,21,24,0.55)' }}>
            <Ionicons name="play" size={14} color={COLORS.surface} />
          </View>
        </View>
        <View
          className="absolute bottom-1.5 right-1.5 rounded px-1.5 py-0.5"
          style={{ backgroundColor: 'rgba(20,21,24,0.75)' }}>
          <Text className="font-sans-semibold text-[10px] text-surface">
            {durationLabel(highlight.duration_seconds)}
          </Text>
        </View>
      </View>
      <Text className="font-sans-semibold mt-2 text-[12px] leading-4 text-ink" numberOfLines={2}>
        {highlight.title}
      </Text>
    </Pressable>
  );
}

/** Dashed "Add highlight" tile that sits at the end of the reel. */
export function AddHighlightTile({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="w-[168px]"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View className="h-[96px] w-full items-center justify-center rounded-xl border border-dashed border-border bg-surface">
        <Ionicons name="add" size={20} color={COLORS.slate} />
        <Text className="font-sans-semibold mt-1 text-[11px] text-slate">Add highlight</Text>
      </View>
    </Pressable>
  );
}
