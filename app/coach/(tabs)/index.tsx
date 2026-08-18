import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { AppHeader } from '../../../components/AppHeader';
import { Avatar } from '../../../components/Avatar';
import { Chip } from '../../../components/Chip';
import { PlayerCard } from '../../../components/PlayerCard';
import { PositionBadge } from '../../../components/PositionBadge';
import { Screen, useContentContainerStyle } from '../../../components/Screen';
import { EmptyState, InlineError, ScreenError } from '../../../components/ScreenState';
import { Sheet, SheetRow } from '../../../components/Sheet';
import { FeedSkeleton } from '../../../components/Skeleton';
import { Reveal, Touchable } from '../../../components/Touchable';
import * as api from '../../../lib/api';
import type { ApiPlayer, ApiPosting } from '../../../lib/api';
import { POSITION_LABEL, roleLabel } from '../../../lib/labels';
import { useSession } from '../../../lib/session';
import { COLORS, useThemeColors } from '../../../lib/theme';
import { errorMessage, useApiData } from '../../../lib/useApi';
import { cmToFeetInches, kgToLbs } from '../../../lib/units';

/**
 * Coach Home — talent scored by the API against the selected roster slot.
 * Changing the slot refetches, so ranking always comes from the server.
 */
export default function CoachHome() {
  const router = useRouter();
  const { requireToken, token } = useSession();
  const colors = useThemeColors();
  const contentStyle = useContentContainerStyle({ paddingTop: 16 });

  const [selectedSlotId, setSelectedSlotId] = useState<number | undefined>(undefined);
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);
  const [highMatchesOnly, setHighMatchesOnly] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

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

  const strongCount = useMemo(
    () => (feed.data?.players ?? []).filter((p) => p.match?.tier === 'good').length,
    [feed.data]
  );

  const invite = useCallback(
    async (player: ApiPlayer) => {
      if (player.connected || !selectedSlot || pendingId !== null) return;
      setInviteError(null);
      setPendingId(player.id);

      const optimistic = (feed.data?.players ?? []).map((item) =>
        item.id === player.id ? { ...item, connected: true } : item
      );
      feed.setData({ posting: selectedSlot, players: optimistic });

      try {
        await api.createConnection(requireToken(), selectedSlot.id, player.id);
      } catch (caught) {
        setInviteError(errorMessage(caught));
        feed.refetch();
      } finally {
        setPendingId(null);
      }
    },
    [feed, selectedSlot, requireToken, pendingId]
  );

  if (feed.error && !feed.data) {
    return <ScreenError message={feed.error} onRetry={feed.refetch} />;
  }

  const loadingFirst = feed.loading && !feed.data;

  if (!loadingFirst && !selectedSlot) {
    return (
      <Screen edges={[]}>
        <AppHeader brand meta="No open slots" />
        <View className="flex-1 justify-center" style={contentStyle}>
          <EmptyState
            icon="clipboard-outline"
            title="No open roster slots"
            body="Post a slot from your team profile and every candidate gets ranked against it automatically."
          />
        </View>
      </Screen>
    );
  }

  const header = (
    <AppHeader
      brand
      meta={
        loadingFirst
          ? 'Loading candidates'
          : `${players.length} ${
              players.length === 1 ? 'candidate' : 'candidates'
            } · best fit first`
      }
      right={team.data ? <Avatar name={team.data.name} size={38} shape="square" ring /> : undefined}>
      {selectedSlot ? (
        <>
          <SlotButton
            slot={selectedSlot}
            slotCount={slots.length}
            onPress={() => setSlotPickerOpen(true)}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{ paddingRight: 4 }}>
            <Chip
              onDark
              label="All candidates"
              active={!highMatchesOnly}
              count={feed.data?.players.length ?? 0}
              onPress={() => setHighMatchesOnly(false)}
            />
            <Chip
              onDark
              label="Strong fits"
              icon="flame-outline"
              active={highMatchesOnly}
              count={strongCount}
              onPress={() => setHighMatchesOnly(true)}
            />
          </ScrollView>
        </>
      ) : null}
    </AppHeader>
  );

  if (loadingFirst) {
    return (
      <Screen edges={[]}>
        {header}
        <ScrollView contentContainerStyle={contentStyle}>
          <FeedSkeleton />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen edges={[]}>
      {header}

      <FlatList
        data={players}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={contentStyle}
        refreshControl={
          <RefreshControl
            refreshing={feed.loading}
            onRefresh={feed.refetch}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          inviteError ? (
            <InlineError message={inviteError} onRetry={() => setInviteError(null)} />
          ) : null
        }
        renderItem={({ item, index }) => (
          <Reveal index={index}>
            <PlayerCard
              player={item}
              invited={item.connected === true}
              pending={pendingId === item.id}
              onInvite={() => invite(item)}
              onPress={() => router.push(`/coach/player/${item.id}`)}
            />
          </Reveal>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="flame-outline"
            title={highMatchesOnly ? 'No strong fits yet' : 'No candidates yet'}
            body={
              highMatchesOnly
                ? "Switch back to all candidates, or loosen this slot's ideal height and weight on your team profile."
                : 'Nobody has been scored against this slot yet. Check back as players complete their profiles.'
            }
          />
        }
      />

      {selectedSlot ? (
        <Sheet
          visible={slotPickerOpen}
          onClose={() => setSlotPickerOpen(false)}
          title="Score against which slot?"
          subtitle="Candidates are ranked against one opening at a time.">
          <ScrollView>
            {slots.map((option, index) => (
              <SheetRow
                key={option.id}
                active={option.id === selectedSlot.id}
                last={index === slots.length - 1}
                accessibilityLabel={`${roleLabel(option.position, option.expected_minutes)}, ${
                  POSITION_LABEL[option.position]
                }`}
                onPress={() => {
                  setSelectedSlotId(option.id);
                  setSlotPickerOpen(false);
                }}>
                <View className="flex-row items-center">
                  <PositionBadge
                    position={option.position}
                    tone={option.id === selectedSlot.id ? 'primary' : 'default'}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="font-sans-semibold text-[14px] text-ink">
                      {roleLabel(option.position, option.expected_minutes)}
                    </Text>
                    <Text className="font-sans mt-0.5 text-[11px] text-slate">
                      {cmToFeetInches(option.ideal_height_cm)}+ ·{' '}
                      {kgToLbs(option.ideal_weight_kg)}+ lbs · {option.expected_minutes} MPG ·{' '}
                      {option.applicant_count} applied
                    </Text>
                  </View>
                </View>
              </SheetRow>
            ))}
          </ScrollView>
        </Sheet>
      ) : null}
    </Screen>
  );
}

/**
 * The slot the feed is scored against. Reads as a control rather than a label —
 * everything below it changes when this changes, so it has to look pressable.
 */
function SlotButton({
  slot,
  slotCount,
  onPress,
}: {
  slot: ApiPosting;
  slotCount: number;
  onPress: () => void;
}) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Scoring against ${roleLabel(
        slot.position,
        slot.expected_minutes
      )}. Change slot`}
      scaleTo={0.99}
      className="flex-row items-center rounded-btn border border-chrome-border bg-chrome-raised px-3.5 py-2.5">
      <PositionBadge position={slot.position} tone="primary" />

      <View className="ml-3 flex-1">
        <Text className="font-stat text-[12px] tracking-eyebrow text-chrome-text-muted">
          SCORING AGAINST
        </Text>
        <Text className="font-display mt-0.5 text-[15px] text-chrome-text" numberOfLines={1}>
          {roleLabel(slot.position, slot.expected_minutes)}
        </Text>
      </View>

      {slotCount > 1 ? (
        <View className="mr-2 rounded-full bg-chrome px-2">
          <Text className="font-stat text-[13px] tracking-stat text-chrome-text-muted">
            {slotCount} SLOTS
          </Text>
        </View>
      ) : null}

      <Ionicons name="chevron-down" size={17} color={COLORS.chromeTextMuted} />
    </Touchable>
  );
}
