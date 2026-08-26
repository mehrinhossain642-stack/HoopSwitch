import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { AppHeader } from '../../../components/AppHeader';
import { Button } from '../../../components/Button';
import { Chip } from '../../../components/Chip';
import { PostingCard } from '../../../components/PostingCard';
import { Screen, useContentContainerStyle } from '../../../components/Screen';
import {
  EmptyState,
  InlineError,
  ScreenError,
} from '../../../components/ScreenState';
import { SearchField } from '../../../components/SearchField';
import { Sheet } from '../../../components/Sheet';
import { FeedSkeleton } from '../../../components/Skeleton';
import { Touchable, Reveal } from '../../../components/Touchable';

import * as api from '../../../lib/api';
import type { ApiPosting } from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { useThemeColors } from '../../../lib/theme';
import { errorMessage, useApiData } from '../../../lib/useApi';

type PositionFilter = 'all' | 'PG' | 'SG' | 'SF' | 'PF' | 'C';
type LevelFilter = 'all' | 'u-sports' | 'competitive' | 'elite';
type LocationFilter = 'all' | 'ontario' | 'toronto' | 'ottawa';

type Filters = {
  position: PositionFilter;
  level: LevelFilter;
  location: LocationFilter;
};

const DEFAULT_FILTERS: Filters = {
  position: 'all',
  level: 'all',
  location: 'all',
};

const POSITION_OPTIONS: {
  value: PositionFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'PG', label: 'Point Guard' },
  { value: 'SG', label: 'Shooting Guard' },
  { value: 'SF', label: 'Small Forward' },
  { value: 'PF', label: 'Power Forward' },
  { value: 'C', label: 'Center' },
];

const LEVEL_OPTIONS: {
  value: LevelFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'u-sports', label: 'U SPORTS' },
  { value: 'competitive', label: 'Competitive' },
  { value: 'elite', label: 'Elite' },
];

const LOCATION_OPTIONS: {
  value: LocationFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All Locations' },
  { value: 'ontario', label: 'Ontario' },
  { value: 'toronto', label: 'Toronto' },
  { value: 'ottawa', label: 'Ottawa' },
];

export default function PlayerOpportunities() {
  const router = useRouter();
  const { requireToken, token } = useSession();
  const colors = useThemeColors();
  const contentStyle = useContentContainerStyle({ paddingTop: 16 });

  const feed = useApiData(
    () => api.getPostingFeed(requireToken()),
    [token]
  );

  const [query, setQuery] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const [filters, setFilters] =
    useState<Filters>(DEFAULT_FILTERS);

  const [draftFilters, setDraftFilters] =
    useState<Filters>(DEFAULT_FILTERS);

  const [filterSheetOpen, setFilterSheetOpen] =
    useState(false);

  const postings = useMemo(
    () => feed.data?.postings ?? [],
    [feed.data]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.position !== 'all') count += 1;
    if (filters.level !== 'all') count += 1;
    if (filters.location !== 'all') count += 1;

    return count;
  }, [filters]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return postings.filter((posting) => {
      const teamLocation =
        posting.team?.location?.toLowerCase() ?? '';

      const league =
        posting.team?.league?.toLowerCase() ?? '';

      if (
        filters.position !== 'all' &&
        posting.position !== filters.position
      ) {
        return false;
      }

      if (filters.level === 'u-sports') {
        if (!league.includes('u sports')) return false;
      }

      if (filters.level === 'competitive') {
        if (!league.includes('competitive')) return false;
      }

      if (filters.level === 'elite') {
        if (!league.includes('elite')) return false;
      }

      if (filters.location === 'ontario') {
        if (
          !teamLocation.includes('on') &&
          !teamLocation.includes('ontario')
        ) {
          return false;
        }
      }

      if (filters.location === 'toronto') {
        if (!teamLocation.includes('toronto')) return false;
      }

      if (filters.location === 'ottawa') {
        if (!teamLocation.includes('ottawa')) return false;
      }

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

        if (!haystack.includes(needle)) {
          return false;
        }
      }

      return true;
    });
  }, [postings, filters, query]);

  const apply = useCallback(
    async (posting: ApiPosting) => {
      if (posting.connected || pendingId !== null) return;

      setApplyError(null);
      setPendingId(posting.id);

      const optimistic = postings.map((item) =>
        item.id === posting.id
          ? { ...item, connected: true }
          : item
      );

      feed.setData({
        player_id: feed.data?.player_id ?? 0,
        postings: optimistic,
      });

      try {
        await api.createConnection(
          requireToken(),
          posting.id
        );
      } catch (caught) {
        setApplyError(errorMessage(caught));
        feed.refetch();
      } finally {
        setPendingId(null);
      }
    },
    [postings, feed, requireToken, pendingId]
  );

  function openFilters() {
    setDraftFilters(filters);
    setFilterSheetOpen(true);
  }

  function applyFilters() {
    setFilters(draftFilters);
    setFilterSheetOpen(false);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setDraftFilters(DEFAULT_FILTERS);
  }

  if (feed.error && !feed.data) {
    return (
      <ScreenError
        message={feed.error}
        onRetry={feed.refetch}
      />
    );
  }

  const loadingFirst =
    feed.loading && !feed.data;

  const header = (
    <AppHeader
      brand
      meta={
        loadingFirst
          ? 'Loading openings'
          : `${visible.length} ${
              visible.length === 1 ? 'spot' : 'spots'
            } · best fit first`
      }>

      {/* Search stays exactly as requested */}
      <View className="flex-row items-center">
        <View className="flex-1">
          <SearchField
            onDark
            value={query}
            onChangeText={setQuery}
            placeholder="Search teams, roles, cities"
          />
        </View>

        <Touchable
          onPress={openFilters}
          accessibilityRole="button"
          accessibilityLabel="Open opportunity filters"
          className="relative ml-2 h-11 w-11 items-center justify-center rounded-btn bg-chrome-raised">

          <Ionicons
            name="filter"
            size={20}
            color={colors.chromeText}
          />

          {activeFilterCount > 0 ? (
            <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1">
              <Text className="font-sans-bold text-[10px] text-white">
                {activeFilterCount}
              </Text>
            </View>
          ) : null}
        </Touchable>
      </View>

      {/* Quick filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="mt-3"
        contentContainerStyle={{
          paddingRight: 4,
        }}>

        <Chip
          onDark
          label={
            filters.location === 'all'
              ? 'Location'
              : locationLabel(filters.location)
          }
          icon="location-outline"
          active={filters.location !== 'all'}
          onPress={openFilters}
        />

        <Chip
          onDark
          label={
            filters.position === 'all'
              ? 'Role'
              : positionLabel(filters.position)
          }
          icon="basketball-outline"
          active={filters.position !== 'all'}
          onPress={openFilters}
        />

        <Chip
          onDark
          label={
            filters.level === 'all'
              ? 'Level'
              : levelLabel(filters.level)
          }
          icon="trophy-outline"
          active={filters.level !== 'all'}
          onPress={openFilters}
        />

        {activeFilterCount > 0 ? (
          <Chip
            onDark
            label="Reset"
            icon="close"
            onPress={resetFilters}
          />
        ) : null}
      </ScrollView>
    </AppHeader>
  );

  if (loadingFirst) {
    return (
      <Screen edges={[]}>
        {header}

        <ScrollView
          contentContainerStyle={contentStyle}>
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
        keyExtractor={(item) =>
          String(item.id)
        }
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
            <InlineError
              message={applyError}
              onRetry={() =>
                setApplyError(null)
              }
            />
          ) : null
        }
        renderItem={({ item, index }) => (
          <Reveal index={index}>
            <PostingCard
              posting={item}
              applied={
                item.connected === true
              }
              pending={
                pendingId === item.id
              }
              onApply={() =>
              router.push(`/player/posting/${item.id}`)
              }
              onPress={() =>
                router.push(
                  `/player/posting/${item.id}`
                )
              }
            />
          </Reveal>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No roster spots match"
            body={
              activeFilterCount > 0
                ? 'Your filters are narrowing this to nothing. Try adjusting or clearing them.'
                : 'Nothing matches that search yet. Try a team name, city, or position.'
            }
            action={
              activeFilterCount > 0 ? (
                <Button
                  label="Clear filters"
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  onPress={resetFilters}
                />
              ) : null
            }
          />
        }
      />

      <Sheet
        visible={filterSheetOpen}
        onClose={() =>
          setFilterSheetOpen(false)
        }
        title="Filter Opportunities"
        subtitle="Narrow openings to teams and roles that fit what you're looking for.">

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 24,
          }}>

          <FilterSection title="Location">
            <FilterOptions
              options={LOCATION_OPTIONS}
              selected={draftFilters.location}
              onSelect={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  location:
                    value as LocationFilter,
                }))
              }
            />
          </FilterSection>

          <FilterSection title="Role">
            <FilterOptions
              options={POSITION_OPTIONS}
              selected={draftFilters.position}
              onSelect={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  position:
                    value as PositionFilter,
                }))
              }
            />
          </FilterSection>

          <FilterSection title="Competition Level">
            <FilterOptions
              options={LEVEL_OPTIONS}
              selected={draftFilters.level}
              onSelect={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  level:
                    value as LevelFilter,
                }))
              }
            />
          </FilterSection>

          <View className="mt-2">
            <Button
              label="Apply Filters"
              onPress={applyFilters}
            />
          </View>

          <View className="mt-2">
            <Button
              label="Reset"
              variant="secondary"
              onPress={() =>
                setDraftFilters(
                  DEFAULT_FILTERS
                )
              }
            />
          </View>
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-6">
      <Text className="font-sans-bold mb-3 text-[14px] text-ink">
        {title}
      </Text>

      {children}
    </View>
  );
}

function FilterOptions({
  options,
  selected,
  onSelect,
}: {
  options: {
    value: string;
    label: string;
  }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const active =
          selected === option.value;

        return (
          <Touchable
            key={option.value}
            onPress={() =>
              onSelect(option.value)
            }
            accessibilityRole="button"
            accessibilityState={{
              selected: active,
            }}
            className={`rounded-btn border px-3 py-2 ${
              active
                ? 'border-primary bg-primary-soft'
                : 'border-border bg-surface'
            }`}>

            <Text
              className={`font-sans-medium text-[12px] ${
                active
                  ? 'text-primary'
                  : 'text-ink'
              }`}>
              {option.label}
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
}

function positionLabel(
  value: PositionFilter
) {
  return (
    POSITION_OPTIONS.find(
      (option) =>
        option.value === value
    )?.label ?? 'Role'
  );
}

function levelLabel(
  value: LevelFilter
) {
  return (
    LEVEL_OPTIONS.find(
      (option) =>
        option.value === value
    )?.label ?? 'Level'
  );
}

function locationLabel(
  value: LocationFilter
) {
  return (
    LOCATION_OPTIONS.find(
      (option) =>
        option.value === value
    )?.label ?? 'Location'
  );
}