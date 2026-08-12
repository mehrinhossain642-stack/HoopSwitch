import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Linking, Text, View } from 'react-native';
import type { Highlight } from '../data/types';
import { COLORS } from '../lib/theme';
import { Touchable } from './Touchable';

function durationLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

const TILE_WIDTH = 208;
/** 16:9 — the aspect every source clip actually is. */
const TILE_HEIGHT = 117;

/** Thumbnail card linking out to an external highlight URL. */
export function HighlightCard({ highlight }: { highlight: Highlight }) {
  return (
    <Touchable
      onPress={() => {
        void Linking.openURL(highlight.url);
      }}
      accessibilityRole="link"
      accessibilityLabel={`Play highlight: ${highlight.title}`}
      scaleTo={0.98}
      className="mr-3"
      style={{ width: TILE_WIDTH }}>
      <View
        className="w-full overflow-hidden rounded-md border border-border bg-ink-900"
        style={{ height: TILE_HEIGHT }}>
        {/* Thumbnails are remote; the ink fill behind them keeps a failed load
            looking deliberate rather than broken. */}
        <Image
          source={{ uri: highlight.thumbnail_url }}
          className="h-full w-full"
          resizeMode="cover"
        />

        {/* Scrim only along the bottom, so the play button stays on the image
            and the duration chip stays legible on a bright frame. */}
        <View
          className="absolute bottom-0 left-0 right-0 h-10"
          style={{ backgroundColor: 'rgba(13,14,17,0.55)' }}
        />

        <View className="absolute inset-0 items-center justify-center">
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(240,78,35,0.92)' }}>
            <Ionicons name="play" size={15} color={COLORS.surface} style={{ marginLeft: 2 }} />
          </View>
        </View>

        <View className="absolute bottom-2 right-2 rounded px-1.5 py-0.5" style={{ backgroundColor: 'rgba(13,14,17,0.8)' }}>
          <Text className="font-stat text-[13px] tracking-stat text-surface">
            {durationLabel(highlight.duration_seconds)}
          </Text>
        </View>
      </View>

      <Text
        className="font-sans-semibold mt-2 text-[13px] leading-[18px] text-ink"
        numberOfLines={2}>
        {highlight.title}
      </Text>
    </Touchable>
  );
}

/** Dashed "Add highlight" tile that sits at the end of the reel. */
export function AddHighlightTile({ onPress }: { onPress: () => void }) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add highlight"
      style={{ width: TILE_WIDTH }}>
      <View
        className="w-full items-center justify-center rounded-md border border-dashed border-border-strong bg-surface"
        style={{ height: TILE_HEIGHT }}>
        <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-soft">
          <Ionicons name="add" size={20} color={COLORS.primary} />
        </View>
        <Text className="font-sans-semibold mt-2 text-[12px] text-primary">Add highlight</Text>
      </View>
    </Touchable>
  );
}

/** Placeholder for a player with no clips yet. */
export function NoHighlights() {
  return (
    <View className="items-center rounded-md border border-dashed border-border-strong bg-surface px-5 py-7">
      <Ionicons name="videocam-outline" size={20} color={COLORS.slate} />
      <Text className="font-sans mt-2 text-center text-[12px] text-slate">
        No highlights uploaded yet.
      </Text>
    </View>
  );
}
