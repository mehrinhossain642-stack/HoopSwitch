import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '../../../components/Chip';
import { PostingCard } from '../../../components/PostingCard';
import { scoreMatch, sortByMatch } from '../../../lib/match';
import { useApp } from '../../../lib/store';
import { COLORS } from '../../../lib/theme';

type FilterKey = 'position' | 'level' | 'location';

/** Player Home — postings scored against the current player, best fit first. */
export default function PlayerHome() {
  const router = useRouter();
  const { currentPlayer, allPostings, appliedPostingIds, toggleApply } = useApp();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
    position: false,
    level: false,
    location: false,
  });

  function toggleFilter(key: FilterKey) {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Scored, filtered and sorted in one pass so an edit on the profile screen
  // re-orders this list on the very next render.
  const feed = useMemo(() => {
    const scored = allPostings.map((posting) => ({
      posting,
      match: scoreMatch(currentPlayer, posting),
    }));

    const needle = query.trim().toLowerCase();
    const filtered = scored.filter(({ posting }) => {
      if (filters.position && posting.position !== currentPlayer.position) return false;
      if (filters.level && !posting.team.league.includes('U SPORTS')) return false;
      if (filters.location && !posting.team.location.endsWith('ON')) return false;
      if (needle.length > 0) {
        const haystack = [
          posting.team.name,
          posting.headline,
          posting.position,
          posting.team.location,
          posting.team.league,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });

    return sortByMatch(
      filtered,
      (item) => item.match.score,
      (item) => item.posting.team.name
    );
  }, [allPostings, currentPlayer, filters, query]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <FlatList
        data={feed}
        keyExtractor={(item) => item.posting.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <FeedHeader
            query={query}
            onQueryChange={setQuery}
            filters={filters}
            onToggleFilter={toggleFilter}
            playerPosition={currentPlayer.position}
            resultCount={feed.length}
            activeFilterCount={activeFilterCount}
          />
        }
        renderItem={({ item }) => (
          <PostingCard
            posting={item.posting}
            match={item.match}
            applied={appliedPostingIds.includes(item.posting.id)}
            onApply={() => toggleApply(item.posting.id)}
            onPress={() => router.push(`/player/posting/${item.posting.id}`)}
          />
        )}
        ListEmptyComponent={<EmptyFeed />}
      />
    </SafeAreaView>
  );
}

type FeedHeaderProps = {
  query: string;
  onQueryChange: (next: string) => void;
  filters: Record<FilterKey, boolean>;
  onToggleFilter: (key: FilterKey) => void;
  playerPosition: string;
  resultCount: number;
  activeFilterCount: number;
};

function FeedHeader({
  query,
  onQueryChange,
  filters,
  onToggleFilter,
  playerPosition,
  resultCount,
  activeFilterCount,
}: FeedHeaderProps) {
  return (
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
          onChangeText={onQueryChange}
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
            onPress={() => onQueryChange('')}
          />
        ) : null}
      </View>

      <View className="mb-4 flex-row">
        <Chip
          label={playerPosition}
          icon="basketball-outline"
          active={filters.position}
          onPress={() => onToggleFilter('position')}
        />
        <Chip
          label="U SPORTS"
          icon="trophy-outline"
          active={filters.level}
          onPress={() => onToggleFilter('level')}
        />
        <Chip
          label="Ontario"
          icon="location-outline"
          active={filters.location}
          onPress={() => onToggleFilter('location')}
        />
      </View>

      <Text className="font-sans-semibold mb-3 text-[12px] uppercase tracking-widest text-slate">
        {resultCount} {resultCount === 1 ? 'spot' : 'spots'} · best fit first
      </Text>
    </View>
  );
}

function EmptyFeed() {
  return (
    <View className="items-center rounded-card border border-dashed border-border bg-surface px-6 py-10">
      <Ionicons name="search-outline" size={24} color={COLORS.slate} />
      <Text className="font-display mt-3 text-[16px] text-ink">No roster spots match</Text>
      <Text className="font-sans mt-1 text-center text-[13px] leading-[18px] text-slate">
        Clear a filter or try a different search to see more openings.
      </Text>
    </View>
  );
}
