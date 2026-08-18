import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';
import { AppHeader } from '../../../components/AppHeader';
import { Button } from '../../../components/Button';
import { Chip } from '../../../components/Chip';
import { PostingCard } from '../../../components/PostingCard';
import { Screen, useContentContainerStyle } from '../../../components/Screen';
import { EmptyState, InlineError, ScreenError } from '../../../components/ScreenState';
import { SearchField } from '../../../components/SearchField';
import { FeedSkeleton } from '../../../components/Skeleton';
import { Reveal } from '../../../components/Touchable';
import * as api from '../../../lib/api';
import type { ApiPosting } from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { useThemeColors } from '../../../lib/theme';
import { errorMessage, useApiData } from '../../../lib/useApi';

type FilterKey = 'position' | 'level' | 'location';

const NO_FILTERS: Record<FilterKey, boolean> = {
  position: false,
  level: false,
  location: false,
};

/**
 * Player Home — postings scored by the API against the signed-in player and
 * returned best-fit-first. Sorting and scoring both happen server-side.
 */
export default function PlayerHome() {
  const router = useRouter();
  const { requireToken, token } = useSession();
  const colors = useThemeColors();
  const contentStyle = useContentContainerStyle({ paddingTop: 16 });

  const feed = useApiData(() => api.getPostingFeed(requireToken()), [token]);
  const profile = useApiData(() => api.getProfile(requireToken()), [token]);

  const [query, setQuery] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>(NO_FILTERS);

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

  if (feed.error && !feed.data) {
    return <ScreenError message={feed.error} onRetry={feed.refetch} />;
  }

  const activeFilters = Object.values(filters).filter(Boolean).length;
  const loadingFirst = feed.loading && !feed.data;

  const header = (
    <AppHeader
      brand
      meta={
        loadingFirst
          ? 'Loading openings'
          : `${visible.length} ${visible.length === 1 ? 'spot' : 'spots'} · best fit first`
      }>
      <SearchField
        onDark
        value={query}
        onChangeText={setQuery}
        placeholder="Search teams, roles, cities"
      />

      {/* The chips are the filter UI. There used to be a filter icon with a count
          badge and no handler attached — a control that does nothing is its own
          kind of tell. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="mt-3"
        contentContainerStyle={{ paddingRight: 4 }}>
        <Chip
          onDark
          label={`My position · ${playerPosition}`}
          icon="basketball-outline"
          active={filters.position}
          onPress={() => toggleFilter('position')}
        />
        <Chip
          onDark
          label="U SPORTS"
          icon="trophy-outline"
          active={filters.level}
          onPress={() => toggleFilter('level')}
        />
        <Chip
          onDark
          label="Ontario"
          icon="location-outline"
          active={filters.location}
          onPress={() => toggleFilter('location')}
        />
        {activeFilters > 0 ? (
          <Chip onDark label="Reset" icon="close" onPress={() => setFilters(NO_FILTERS)} />
        ) : null}
      </ScrollView>
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
        data={visible}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={contentStyle}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={feed.loading}
            onRefresh={feed.refetch}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          applyError ? (
            <InlineError message={applyError} onRetry={() => setApplyError(null)} />
          ) : null
        }
        renderItem={({ item, index }) => (
          <Reveal index={index}>
            <PostingCard
              posting={item}
              applied={item.connected === true}
              pending={pendingId === item.id}
              onApply={() => apply(item)}
              onPress={() => router.push(`/player/posting/${item.id}`)}
            />
          </Reveal>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No roster spots match"
            body={
              activeFilters > 0
                ? 'Your filters are narrowing this to nothing. Clear one to see more openings.'
                : 'Nothing matches that search yet. Try a team name, a city, or a position.'
            }
            action={
              activeFilters > 0 ? (
                <Button
                  label="Clear filters"
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  onPress={() => setFilters(NO_FILTERS)}
                />
              ) : null
            }
          />
        }
      />
    </Screen>
  );
}
