import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../../components/Card';
import { Chip } from '../../../components/Chip';
import { PlayerCard } from '../../../components/PlayerCard';
import { PositionBadge } from '../../../components/PositionBadge';
import { InlineError, ScreenError, ScreenLoading } from '../../../components/ScreenState';
import * as api from '../../../lib/api';
import type { ApiPlayer, ApiPosting } from '../../../lib/api';
import { POSITION_LABEL, roleLabel } from '../../../lib/labels';
import { useSession } from '../../../lib/session';
import { COLORS } from '../../../lib/theme';
import { errorMessage, useApiData } from '../../../lib/useApi';
import { cmToFeetInches, kgToLbs } from '../../../lib/units';

/**
 * Coach Home — talent scored by the API against the selected roster slot.
 * Changing the slot refetches, so ranking always comes from the server.
 */
export default function CoachHome() {
  const router = useRouter();
  const { requireToken, token } = useSession();

  const [selectedSlotId, setSelectedSlotId] = useState<number | undefined>(undefined);
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);
  const [highMatchesOnly, setHighMatchesOnly] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const team = useApiData(() => api.getTeam(requireToken()), [token]);
  const feed = useApiData(
    () => api.getPlayerFeed(requireToken(), selectedSlotId),
    [token, selectedSlotId]
  );

  const slots = team.data?.postings ?? [];
  const selectedSlot = feed.data?.posting;

  const players = useMemo(() => {
    const list = feed.data?.players ?? [];
    return highMatchesOnly ? list.filter((p) => p.match?.tier === 'good') : list;
  }, [feed.data, highMatchesOnly]);

  const invite = useCallback(
    async (player: ApiPlayer) => {
      if (player.connected || !selectedSlot) return;
      setInviteError(null);

      const optimistic = (feed.data?.players ?? []).map((item) =>
        item.id === player.id ? { ...item, connected: true } : item
      );
      feed.setData({ posting: selectedSlot, players: optimistic });

      try {
        await api.createConnection(requireToken(), selectedSlot.id, player.id);
      } catch (caught) {
        setInviteError(errorMessage(caught));
        feed.refetch();
      }
    },
    [feed, selectedSlot, requireToken]
  );

  if (feed.loading && !feed.data) return <ScreenLoading label="Loading candidates" />;
  if (feed.error && !feed.data) {
    return <ScreenError message={feed.error} onRetry={feed.refetch} />;
  }

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
        data={players}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={feed.loading}
            onRefresh={feed.refetch}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <View className="pb-1 pt-2">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-display text-[24px] text-ink">
                Hoop<Text className="text-primary">Switch</Text>
              </Text>
              <Text className="font-sans-semibold text-[12px] text-slate">
                {team.data?.name ?? ''}
              </Text>
            </View>

            <SlotSelector
              slot={selectedSlot}
              slots={slots}
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

            {inviteError ? <InlineError message={inviteError} /> : null}

            <Text className="font-sans-semibold mb-3 text-[12px] uppercase tracking-widest text-slate">
              {players.length} {players.length === 1 ? 'candidate' : 'candidates'} · best fit
              first
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PlayerCard
            player={item}
            invited={item.connected === true}
            onInvite={() => invite(item)}
            onPress={() => router.push(`/coach/player/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center rounded-card border border-dashed border-border bg-surface px-6 py-10">
            <Ionicons name="flame-outline" size={24} color={COLORS.slate} />
            <Text className="font-display mt-3 text-[16px] text-ink">No high matches yet</Text>
            <Text className="font-sans mt-1 text-center text-[13px] leading-[18px] text-slate">
              Switch back to all candidates, or loosen this slot&apos;s ideal height and weight
              on your profile.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

type SlotSelectorProps = {
  slot: ApiPosting;
  slots: ApiPosting[];
  open: boolean;
  onToggle: () => void;
  onSelect: (id: number) => void;
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
