import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '../../../components/Chip';
import { PostingCard } from '../../../components/PostingCard';
import { InlineError, ScreenError, ScreenLoading } from '../../../components/ScreenState';
import * as api from '../../../lib/api';
import type { ApiPosting } from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { COLORS } from '../../../lib/theme';
import { errorMessage, useApiData } from '../../../lib/useApi';

type FilterKey = 'position' | 'level' | 'location';

/**
 * Player Home — postings scored by the API against the signed-in player and
 * returned best-fit-first. Sorting and scoring both happen server-side now.
 */
export default function PlayerHome() {
  const router = useRouter();
  const { requireToken, token } = useSession();

  const feed = useApiData(() => api.getPostingFeed(requireToken()), [token]);
  const profile = useApiData(() => api.getProfile(requireToken()), [token]);

  const [query, setQuery] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
    position: false,
    level: false,
    location: false,
  });

  function toggleFilter(key: FilterKey) {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const playerPosition = profile.data?.position ?? 'PG';
  const postings = useMemo(() => feed.data?.postings ?? [], [feed.data]);

  // Search and filters stay client-side — the API returns the whole scored,
  // pre-sorted list, so narrowing it locally avoids a round trip per keystroke.
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return postings.filter((posting) => {
      if (filters.position && posting.position !== playerPosition) return false;
      if (filters.level && !(posting.team?.league ?? '').includes('U SPORTS')) return false;
      if (filters.location && !(posting.team?.location ?? '').endsWith('ON')) return false;
      if (needle.length > 0) {
        const haystack = [
          posting.team?.name,
          posting.headline,
          posting.position,
          posting.team?.location,
          posting.team?.league,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [postings, filters, query, playerPosition]);

  const apply = useCallback(
    async (posting: ApiPosting) => {
      if (posting.connected || pendingId !== null) return;
      setApplyError(null);
      setPendingId(posting.id);

      // Optimistic: flip the button immediately, roll back if the POST fails.
      const optimistic = postings.map((item) =>
        item.id === posting.id ? { ...item, connected: true } : item
      );
      feed.setData({ player_id: feed.data?.player_id ?? 0, postings: optimistic });

      try {
        await api.createConnection(requireToken(), posting.id);
      } catch (caught) {
        setApplyError(errorMessage(caught));
        feed.refetch();
      } finally {
        setPendingId(null);
      }
    },
    [postings, feed, requireToken, pendingId]
  );

  if (feed.loading && !feed.data) return <ScreenLoading label="Loading roster spots" />;
  if (feed.error && !feed.data) {
    return <ScreenError message={feed.error} onRetry={feed.refetch} />;
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
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
              <View className="flex-row items-center">
                <Ionicons name="options-outline" size={20} color={COLORS.ink} />
                {activeFilterCount > 0 ? (
                  <View className="ml-1.5 h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Text className="font-sans-bold text-[11px] text-surface">
                      {activeFilterCount}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View className="mb-3 flex-row items-center rounded-btn border border-border bg-surface px-3">
              <Ionicons name="search" size={16} color={COLORS.slate} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search open roster spots..."
                placeholderTextColor={COLORS.slate}
                returnKeyType="search"
                className="font-sans h-11 flex-1 px-2 text-[14px] text-ink"
              />
              {query.length > 0 ? (
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={COLORS.slate}
                  onPress={() => setQuery('')}
                />
              ) : null}
            </View>

            <View className="mb-4 flex-row">
              <Chip
                label={playerPosition}
                icon="basketball-outline"
                active={filters.position}
                onPress={() => toggleFilter('position')}
              />
              <Chip
                label="U SPORTS"
                icon="trophy-outline"
                active={filters.level}
                onPress={() => toggleFilter('level')}
              />
              <Chip
                label="Ontario"
                icon="location-outline"
                active={filters.location}
                onPress={() => toggleFilter('location')}
              />
            </View>

            {applyError ? <InlineError message={applyError} /> : null}

            <Text className="font-sans-semibold mb-3 text-[12px] uppercase tracking-widest text-slate">
              {visible.length} {visible.length === 1 ? 'spot' : 'spots'} · best fit first
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostingCard
            posting={item}
            applied={item.connected === true}
            onApply={() => apply(item)}
            onPress={() => router.push(`/player/posting/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center rounded-card border border-dashed border-border bg-surface px-6 py-10">
            <Ionicons name="search-outline" size={24} color={COLORS.slate} />
            <Text className="font-display mt-3 text-[16px] text-ink">No roster spots match</Text>
            <Text className="font-sans mt-1 text-center text-[13px] leading-[18px] text-slate">
              Clear a filter or try a different search to see more openings.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
