import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Card } from '../../../components/Card';
import { CareerStatsTable } from '../../../components/CareerStatsTable';
import { EditableField } from '../../../components/EditableField';
import { AddHighlightTile, HighlightCard } from '../../../components/HighlightCard';
import { PositionBadge } from '../../../components/PositionBadge';
import { ProfileHero } from '../../../components/ProfileHero';
import { Screen, useContentContainerStyle } from '../../../components/Screen';
import { ScreenError, ScreenLoading } from '../../../components/ScreenState';
import { SectionTitle } from '../../../components/SectionTitle';
import { DotPill } from '../../../components/StatusPill';
import { SwitchRoleButton } from '../../../components/SwitchRoleButton';
import { useLayout } from '../../../lib/layout';
import type { DominantHand, Position } from '../../../data/types';
import * as api from '../../../lib/api';
import type { ApiPlayer, ProfilePatch } from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { COLORS } from '../../../lib/theme';
import { useApiData } from '../../../lib/useApi';
import {
  cmToFeetInches,
  kgToLbsLabel,
  parseHeightToCm,
  parseLbsToKg,
} from '../../../lib/units';

const POSITIONS: readonly Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];
const HANDS: readonly DominantHand[] = ['Left', 'Right', 'Ambidextrous'];

/**
 * Player Profile — own view, editable, backed by the Rails API.
 * Every commit PATCHes /profile, so the job feed re-scores server-side.
 */
export default function PlayerProfile() {
  const { requireToken, token } = useSession();
  const contentStyle = useContentContainerStyle();
  const { gutter } = useLayout();

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
  const eligibility = `${player.eligibility_years} yr${player.eligibility_years === 1 ? '' : 's'} eligibility`;

  return (
    <Screen edges={[]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 0 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ProfileHero
          eyebrow="My profile"
          name={player.name}
          meta={`${player.location} · Age ${player.age} · ${eligibility}`}
          badge={<PositionBadge position={player.position} tone="primary" />}
          pill={<DotPill label="Free agent" tone="onDark" />}
          action={<SwitchRoleButton onDark />}
          stats={[
            { value: player.ppg.toFixed(1), label: 'PPG' },
            { value: player.rpg.toFixed(1), label: 'RPG' },
            { value: player.apg.toFixed(1), label: 'APG' },
            { value: `${Math.round(player.fg_pct)}%`, label: 'FG%' },
          ]}
        />

        <View style={{ ...contentStyle, paddingTop: 20 }}>
          {/* Physical & role — edits here move the feed. */}
          <SectionTitle
            title="Physical & role"
            className="mb-2.5"
            action={
              <View className="flex-row items-center">
                <Ionicons name="sync-outline" size={13} color={COLORS.primary} />
                <Text className="font-sans-medium ml-1.5 text-[11px] text-primary">
                  Re-scores your feed
                </Text>
              </View>
            }
          />
          <Card bare className="px-4">
            <EditableField
              label="Height"
              value={cmToFeetInches(player.height_cm)}
              editSeed={cmToFeetInches(player.height_cm).replace(/"/g, '')}
              keyboardType="numbers-and-punctuation"
              hint="Enter a height between 4'7&quot; and 7'10&quot;."
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
              hint="Enter a weight in pounds between 99 and 397."
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
              hint="Enter a wingspan between 4'7&quot; and 8'6&quot;."
              onCommit={(next) => {
                const cm = parseHeightToCm(next);
                if (cm === null || cm < 140 || cm > 260) return false;
                return commit({ wingspan_cm: cm });
              }}
            />
            <EditableField
              label="Primary position"
              value={player.position}
              options={POSITIONS}
              onCommit={(next) => commit({ position: next as Position })}
            />
            <EditableField
              label="Dominant hand"
              value={player.dominant_hand}
              options={HANDS}
              onCommit={(next) => commit({ dominant_hand: next as DominantHand })}
            />
            <EditableField
              label="Age"
              value={String(player.age)}
              keyboardType="number-pad"
              last
              hint="Enter an age between 15 and 40."
              onCommit={(next) => {
                const age = Number(next.trim());
                if (!Number.isFinite(age) || age < 15 || age > 40) return false;
                return commit({ age: Math.round(age) });
              }}
            />
          </Card>
        </View>

        {/* Highlights — the reel bleeds past the gutter so the next tile is
            visibly cut off, which is what tells you the row scrolls. */}
        <View style={{ ...contentStyle, paddingTop: 24, paddingBottom: 0 }}>
          <SectionTitle
            title="Highlights"
            action={
              <Text className="font-stat text-[14px] tracking-eyebrow text-slate">
                {player.highlights.length} CLIPS
              </Text>
            }
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ paddingHorizontal: gutter }}>
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

        <View style={{ ...contentStyle, paddingTop: 24 }}>
          <SectionTitle title="About me" className="mb-2.5" />
          <Card>
            <EditableField
              label="Scouting summary"
              value={player.bio ?? ''}
              multiline
              hint="Write at least a sentence so coaches have something to read."
              onCommit={(next) => {
                const trimmed = next.trim();
                if (trimmed.length === 0) return false;
                return commit({ bio: trimmed });
              }}
            />
          </Card>

          <SectionTitle title="Career stats" className="mb-2.5 mt-6" />
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

          <SectionTitle title="Applications" className="mb-2.5 mt-6" />
          <Card>
            <View className="flex-row items-center">
              <View className="h-11 w-11 items-center justify-center rounded-md bg-primary-soft">
                <Ionicons name="paper-plane-outline" size={19} color={COLORS.primary} />
              </View>
              <View className="ml-3.5 flex-1">
                <Text className="font-display text-[15px] text-ink">
                  {applicationCount} active{' '}
                  {applicationCount === 1 ? 'application' : 'applications'}
                </Text>
                <Text className="font-sans mt-0.5 text-[12px] leading-[17px] text-slate">
                  Apply from the openings feed to track roster spots here.
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}
