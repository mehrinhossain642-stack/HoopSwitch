import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../../components/Card';
import { Chip } from '../../../components/Chip';
import { PlayerCard } from '../../../components/PlayerCard';
import { PositionBadge } from '../../../components/PositionBadge';
import type { Posting } from '../../../data/types';
import { POSITION_LABEL, roleLabel } from '../../../lib/labels';
import { scoreMatch, sortByMatch } from '../../../lib/match';
import { useApp } from '../../../lib/store';
import { COLORS } from '../../../lib/theme';
import { cmToFeetInches, kgToLbs } from '../../../lib/units';

/** Coach Home — talent scored against the selected roster slot, best fit first. */
export default function CoachHome() {
  const router = useRouter();
  const {
    currentTeam,
    players,
    invitedPlayerIds,
    messagedPlayerIds,
    toggleInvite,
    toggleMessage,
  } = useApp();

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);
  const [highMatchesOnly, setHighMatchesOnly] = useState(false);

  // Fall back to the team's first posting so the feed is never unscoped.
  const selectedSlot: Posting | undefined =
    currentTeam.postings.find((posting) => posting.id === selectedSlotId) ??
    currentTeam.postings[0];

  const feed = useMemo(() => {
    if (!selectedSlot) return [];
    const scored = players.map((player) => ({
      player,
      match: scoreMatch(player, selectedSlot),
    }));
    const filtered = highMatchesOnly
      ? scored.filter((item) => item.match.tier === 'good')
      : scored;
    return sortByMatch(
      filtered,
      (item) => item.match.score,
      (item) => item.player.name
    );
  }, [players, selectedSlot, highMatchesOnly]);

  if (!selectedSlot) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="clipboard-outline" size={28} color={COLORS.slate} />
          <Text className="font-display mt-3 text-[17px] text-ink">No open slots</Text>
          <Text className="font-sans mt-1 text-center text-[13px] leading-[18px] text-slate">
            Post a roster slot from your profile to start seeing ranked talent.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <FlatList
        data={feed}
        keyExtractor={(item) => item.player.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListHeaderComponent={
          <View className="pb-1 pt-2">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-display text-[24px] text-ink">
                Hoop<Text className="text-primary">Switch</Text>
              </Text>
              <Text className="font-sans-semibold text-[12px] text-slate">
                {currentTeam.name}
              </Text>
            </View>

            <SlotSelector
              slot={selectedSlot}
              slots={currentTeam.postings}
              open={slotPickerOpen}
              onToggle={() => setSlotPickerOpen((prev) => !prev)}
              onSelect={(id) => {
                setSelectedSlotId(id);
                setSlotPickerOpen(false);
              }}
            />

            <View className="mb-4 mt-3 flex-row">
              <Chip
                label="All candidates"
                active={!highMatchesOnly}
                onPress={() => setHighMatchesOnly(false)}
              />
              <Chip
                label="High matches"
                icon="flame-outline"
                active={highMatchesOnly}
                onPress={() => setHighMatchesOnly(true)}
              />
            </View>

            <Text className="font-sans-semibold mb-3 text-[12px] uppercase tracking-widest text-slate">
              {feed.length} {feed.length === 1 ? 'candidate' : 'candidates'} · best fit first
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PlayerCard
            player={item.player}
            match={item.match}
            invited={invitedPlayerIds.includes(item.player.id)}
            messaged={messagedPlayerIds.includes(item.player.id)}
            onInvite={() => toggleInvite(item.player.id)}
            onMessage={() => toggleMessage(item.player.id)}
            onPress={() => router.push(`/coach/player/${item.player.id}`)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center rounded-card border border-dashed border-border bg-surface px-6 py-10">
            <Ionicons name="flame-outline" size={24} color={COLORS.slate} />
            <Text className="font-display mt-3 text-[16px] text-ink">No high matches yet</Text>
            <Text className="font-sans mt-1 text-center text-[13px] leading-[18px] text-slate">
              Switch back to all candidates, or loosen this slot&apos;s ideal height and
              weight on your profile.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

type SlotSelectorProps = {
  slot: Posting;
  slots: Posting[];
  open: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
};

/** "Showing fits for ▾" dropdown that scopes the feed to a single posting. */
function SlotSelector({ slot, slots, open, onToggle, onSelect }: SlotSelectorProps) {
  return (
    <View>
      <Pressable
        onPress={onToggle}
        className="rounded-btn bg-ink px-4 py-3"
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="font-sans-semibold text-[10px] uppercase tracking-widest text-white/60">
              Showing fits for
            </Text>
            <Text className="font-display mt-0.5 text-[17px] text-surface">
              {roleLabel(slot.position, slot.expected_minutes)} slot
            </Text>
          </View>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.surface} />
        </View>
      </Pressable>

      {open ? (
        <Card className="mt-2" bare>
          {slots.map((option, index) => {
            const active = option.id === slot.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => onSelect(option.id)}
                className={`flex-row items-center px-4 py-3 ${
                  index < slots.length - 1 ? 'border-b border-border' : ''
                }`}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <PositionBadge position={option.position} variant={active ? 'dark' : 'default'} />
                <View className="ml-3 flex-1">
                  <Text className="font-sans-semibold text-[14px] text-ink">
                    {roleLabel(option.position, option.expected_minutes)} ·{' '}
                    {POSITION_LABEL[option.position]}
                  </Text>
                  <Text className="font-sans mt-0.5 text-[11px] text-slate">
                    {cmToFeetInches(option.ideal_height_cm)}+ ·{' '}
                    {kgToLbs(option.ideal_weight_kg)}+ lbs · {option.expected_minutes} MPG
                  </Text>
                </View>
                {active ? (
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </Card>
      ) : null}
    </View>
  );
}
