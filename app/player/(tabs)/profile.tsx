import { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../../components/Avatar';
import { Card } from '../../../components/Card';
import { CareerStatsTable } from '../../../components/CareerStatsTable';
import { EditableField } from '../../../components/EditableField';
import { AddHighlightTile, HighlightCard } from '../../../components/HighlightCard';
import { PositionBadge } from '../../../components/PositionBadge';
import { ScreenError, ScreenLoading } from '../../../components/ScreenState';
import { SectionTitle } from '../../../components/SectionTitle';
import { StatBlock } from '../../../components/StatBlock';
import { DotPill } from '../../../components/StatusPill';
import { SwitchRoleButton } from '../../../components/SwitchRoleButton';
import type { DominantHand, Position } from '../../../data/types';
import * as api from '../../../lib/api';
import type { ApiPlayer, ProfilePatch } from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { useApiData } from '../../../lib/useApi';
import { cmToFeetInches, kgToLbsLabel, parseHeightToCm, parseLbsToKg } from '../../../lib/units';

const POSITIONS: readonly Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];
const HANDS: readonly DominantHand[] = ['Left', 'Right', 'Ambidextrous'];

/**
 * Player Profile — own view, editable, backed by the Rails API.
 * Every commit PATCHes /profile, so the job feed re-scores server-side.
 */
export default function PlayerProfile() {
  const { requireToken, token } = useSession();

  const profile = useApiData<ApiPlayer>(() => api.getProfile(requireToken()), [token]);
  const connections = useApiData(() => api.listConnections(requireToken()), [token]);

  const { data: player, setData: setPlayer, refetch } = profile;

  /**
   * Optimistically apply the edit, then PATCH. On failure we revert by
   * refetching, and EditableField shows its rejected state.
   */
  const commit = useCallback(
    (patch: ProfilePatch): boolean => {
      if (!player) return false;
      setPlayer({ ...player, ...patch } as ApiPlayer);

      api.updateProfile(requireToken(), patch).then(setPlayer).catch(refetch);
      return true;
    },
    [player, setPlayer, requireToken, refetch]
  );

  if (profile.loading && !player) return <ScreenLoading label="Loading your profile" />;
  if (profile.error && !player) return <ScreenError message={profile.error} onRetry={refetch} />;
  if (!player) return <ScreenError message="Profile unavailable" onRetry={refetch} />;

  const applicationCount = connections.data?.connections.length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center justify-between py-3">
          <Text className="font-sans-semibold text-[12px] uppercase tracking-widest text-slate">
            My profile
          </Text>
          <SwitchRoleButton />
        </View>

        {/* Hero */}
        <Card className="items-center pb-5 pt-6">
          <Avatar name={player.name} size={92} />
          <View className="mt-4 flex-row items-center">
            <Text className="font-display text-[24px] text-ink">{player.name}</Text>
            <View className="ml-2">
              <PositionBadge position={player.position} variant="dark" />
            </View>
          </View>
          <Text className="font-sans mt-1 text-[13px] text-slate">
            {player.location} · Age {player.age} · {player.eligibility_years} yr
            {player.eligibility_years === 1 ? '' : 's'} eligibility
          </Text>
          <View className="mt-3">
            <DotPill label="Free Agent" />
          </View>

          <View className="mt-5 w-full flex-row border-t border-border pt-4">
            <StatBlock value={player.ppg.toFixed(1)} label="PPG" />
            <StatBlock value={player.rpg.toFixed(1)} label="RPG" />
            <StatBlock value={player.apg.toFixed(1)} label="APG" />
            <StatBlock value={`${Math.round(player.fg_pct)}%`} label="FG%" />
          </View>
        </Card>

        {/* Physical & role — edits here move the feed */}
        <View className="mt-4">
          <SectionTitle title="Physical & Role" className="mb-2" />
          <Card bare className="px-4 pb-1 pt-1">
            <EditableField
              label="Height"
              value={cmToFeetInches(player.height_cm)}
              editSeed={cmToFeetInches(player.height_cm).replace(/"/g, '')}
              keyboardType="numbers-and-punctuation"
              onCommit={(next) => {
                const cm = parseHeightToCm(next);
                if (cm === null || cm < 140 || cm > 240) return false;
                return commit({ height_cm: cm });
              }}
            />
            <EditableField
              label="Weight"
              value={kgToLbsLabel(player.weight_kg)}
              editSeed={String(Math.round(player.weight_kg * 2.20462))}
              keyboardType="number-pad"
              onCommit={(next) => {
                const kg = parseLbsToKg(next);
                if (kg === null || kg < 45 || kg > 180) return false;
                return commit({ weight_kg: kg });
              }}
            />
            <EditableField
              label="Wingspan"
              value={cmToFeetInches(player.wingspan_cm)}
              editSeed={cmToFeetInches(player.wingspan_cm).replace(/"/g, '')}
              keyboardType="numbers-and-punctuation"
              onCommit={(next) => {
                const cm = parseHeightToCm(next);
                if (cm === null || cm < 140 || cm > 260) return false;
                return commit({ wingspan_cm: cm });
              }}
            />
            <EditableField
              label="Primary Pos."
              value={player.position}
              options={POSITIONS}
              onCommit={(next) => commit({ position: next as Position })}
            />
            <EditableField
              label="Dominant Hand"
              value={player.dominant_hand}
              options={HANDS}
              onCommit={(next) => commit({ dominant_hand: next as DominantHand })}
            />
            <EditableField
              label="Age"
              value={String(player.age)}
              keyboardType="number-pad"
              last
              onCommit={(next) => {
                const age = Number(next.trim());
                if (!Number.isFinite(age) || age < 15 || age > 40) return false;
                return commit({ age: Math.round(age) });
              }}
            />
          </Card>
          <Text className="font-sans mt-2 px-1 text-[12px] leading-[17px] text-slate">
            Editing height, weight or position re-scores every roster spot in your feed.
          </Text>
        </View>

        {/* Highlights */}
        <View className="mt-5">
          <SectionTitle title="Highlights" className="mb-3" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 4 }}>
            {player.highlights.map((highlight) => (
              <HighlightCard
                key={highlight.id}
                highlight={{
                  id: String(highlight.id),
                  title: highlight.title,
                  source_type: 'external',
                  url: highlight.url,
                  duration_seconds: highlight.duration_seconds ?? 0,
                  thumbnail_url: highlight.thumbnail_url ?? '',
                }}
              />
            ))}
            <AddHighlightTile
              onPress={() => {
                api
                  .addHighlight(requireToken(), {
                    title: 'Untitled clip — tap to edit later',
                    url: 'https://www.youtube.com/',
                    duration_seconds: 120,
                  })
                  .then(refetch)
                  .catch(refetch);
              }}
            />
          </ScrollView>
        </View>

        {/* Bio */}
        <View className="mt-5">
          <Card>
            <EditableField
              label="About me"
              value={player.bio ?? ''}
              multiline
              onCommit={(next) => {
                const trimmed = next.trim();
                if (trimmed.length === 0) return false;
                return commit({ bio: trimmed });
              }}
            />
          </Card>
        </View>

        {/* Career stats */}
        <View className="mt-5">
          <SectionTitle title="Career Stats" className="mb-3" />
          <Card>
            <CareerStatsTable
              stats={player.career_stats.map((stat) => ({
                season: stat.season,
                team_name: stat.team_name,
                gp: stat.gp,
                ppg: stat.ppg,
                rpg: stat.rpg,
                apg: stat.apg,
              }))}
            />
          </Card>
        </View>

        {/* Applications */}
        <View className="mt-5">
          <Card>
            <View className="flex-row items-center justify-between">
              <Text className="font-sans-semibold text-[13px] text-ink">
                Active applications
              </Text>
              <Text className="font-display text-[18px] text-primary">{applicationCount}</Text>
            </View>
            <Text className="font-sans mt-1 text-[12px] leading-[17px] text-slate">
              Apply from the Home feed to track roster spots here.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
