import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { BoxScoreTable } from '../../../components/BoxScoreTable';
import { Card } from '../../../components/Card';
import { CareerStatsTable } from '../../../components/CareerStatsTable';
import { EditableField } from '../../../components/EditableField';
import { HighlightCard } from '../../../components/HighlightCard';
import { PositionBadge } from '../../../components/PositionBadge';
import { ProfileHero } from '../../../components/ProfileHero';
import {
  Screen,
  useContentContainerStyle,
} from '../../../components/Screen';
import {
  ScreenError,
  ScreenLoading,
} from '../../../components/ScreenState';
import { SectionTitle } from '../../../components/SectionTitle';
import { DotPill } from '../../../components/StatusPill';

import type {
  DominantHand,
  Position,
} from '../../../data/types';

import * as api from '../../../lib/api';
import type {
  ApiPlayer,
  ProfilePatch,
} from '../../../lib/api';

import { useLayout } from '../../../lib/layout';
import { useSession } from '../../../lib/session';
import { useThemeColors } from '../../../lib/theme';
import { useApiData } from '../../../lib/useApi';

import {
  cmToFeetInches,
  kgToLbsLabel,
  parseHeightToCm,
  parseLbsToKg,
} from '../../../lib/units';

const POSITIONS: readonly Position[] = [
  'PG',
  'SG',
  'SF',
  'PF',
  'C',
];

const HANDS: readonly DominantHand[] = [
  'Left',
  'Right',
  'Ambidextrous',
];

export default function ParentAthleteProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const athleteId = Number(id);

  const { requireToken, token } = useSession();
  const colors = useThemeColors();

  const contentStyle = useContentContainerStyle({
    paddingTop: 20,
    paddingBottom: 0,
  });

  const { gutter } = useLayout();

  const profile = useApiData<ApiPlayer>(
    () =>
      api.getParentAthleteProfile(
        requireToken(),
        athleteId
      ),
    [token, athleteId]
  );

  const {
    data: player,
    setData: setPlayer,
    refetch,
  } = profile;

  const commit = useCallback(
    (patch: ProfilePatch): boolean => {
      if (!player) return false;

      setPlayer({
        ...player,
        ...patch,
      } as ApiPlayer);

      api
        .updateParentAthleteProfile(
          requireToken(),
          athleteId,
          patch
        )
        .then(setPlayer)
        .catch(refetch);

      return true;
    },
    [
      player,
      setPlayer,
      requireToken,
      athleteId,
      refetch,
    ]
  );

  if (!Number.isFinite(athleteId)) {
    return (
      <ScreenError
        message="Invalid athlete"
        onRetry={() => router.back()}
      />
    );
  }

  if (profile.loading && !player) {
    return (
      <ScreenLoading label="Loading athlete profile" />
    );
  }

  if (profile.error && !player) {
    return (
      <ScreenError
        message={profile.error}
        onRetry={refetch}
      />
    );
  }

  if (!player) {
    return (
      <ScreenError
        message="Athlete profile unavailable"
        onRetry={refetch}
      />
    );
  }


  const eligibility = `${player.eligibility_years} yr${
    player.eligibility_years === 1 ? '' : 's'
  } eligibility`;

  return (
    <Screen edges={[]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* BACK */}
        <View
          style={{
            position: 'absolute',
            top: 18,
            left: 18,
            zIndex: 20,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        <ProfileHero
          eyebrow="Athlete profile"
          name={player.name}
          meta={`${player.location ?? 'Location not set'} · Age ${
            player.age
          } · ${eligibility}`}
          badge={
            <PositionBadge
              position={player.position}
              tone="primary"
            />
          }
          pill={
            <DotPill
              label="Linked athlete"
              tone="onDark"
            />
          }
          stats={[
            {
              value: player.ppg.toFixed(1),
              label: 'PPG',
            },
            {
              value: player.rpg.toFixed(1),
              label: 'RPG',
            },
            {
              value: player.apg.toFixed(1),
              label: 'APG',
            },
            {
              value: `${Math.round(player.fg_pct)}%`,
              label: 'FG%',
            },
          ]}
        />

        <View style={contentStyle}>
          {/* PROFILE DETAILS */}
          <SectionTitle
            title="Physical & role"
            className="mb-2.5"
            action={
              <View className="flex-row items-center">
                <Ionicons
                  name="sync-outline"
                  size={13}
                  color={colors.primary}
                />

                <Text className="font-sans-medium ml-1.5 text-[11px] text-primary">
                  Updates athlete profile
                </Text>
              </View>
            }
          />

          <Card bare className="px-4">
            <EditableField
              label="Height"
              value={cmToFeetInches(player.height_cm)}
              editSeed={cmToFeetInches(
                player.height_cm
              ).replace(/"/g, '')}
              keyboardType="numbers-and-punctuation"
              hint="Enter a height between 4'7&quot; and 7'10&quot;."
              onCommit={(next) => {
                const cm = parseHeightToCm(next);

                if (
                  cm === null ||
                  cm < 140 ||
                  cm > 240
                ) {
                  return false;
                }

                return commit({
                  height_cm: cm,
                });
              }}
            />

            <EditableField
              label="Weight"
              value={kgToLbsLabel(player.weight_kg)}
              editSeed={String(
                Math.round(
                  player.weight_kg * 2.20462
                )
              )}
              keyboardType="number-pad"
              hint="Enter a weight in pounds between 99 and 397."
              onCommit={(next) => {
                const kg = parseLbsToKg(next);

                if (
                  kg === null ||
                  kg < 45 ||
                  kg > 180
                ) {
                  return false;
                }

                return commit({
                  weight_kg: kg,
                });
              }}
            />

            <EditableField
              label="Wingspan"
              value={cmToFeetInches(
                player.wingspan_cm
              )}
              editSeed={cmToFeetInches(
                player.wingspan_cm
              ).replace(/"/g, '')}
              keyboardType="numbers-and-punctuation"
              hint="Enter a wingspan between 4'7&quot; and 8'6&quot;."
              onCommit={(next) => {
                const cm = parseHeightToCm(next);

                if (
                  cm === null ||
                  cm < 140 ||
                  cm > 260
                ) {
                  return false;
                }

                return commit({
                  wingspan_cm: cm,
                });
              }}
            />

            <EditableField
              label="Primary position"
              value={player.position}
              options={POSITIONS}
              onCommit={(next) =>
                commit({
                  position: next as Position,
                })
              }
            />

            <EditableField
              label="Dominant hand"
              value={player.dominant_hand}
              options={HANDS}
              onCommit={(next) =>
                commit({
                  dominant_hand:
                    next as DominantHand,
                })
              }
            />

            <EditableField
              label="Age"
              value={String(player.age)}
              keyboardType="number-pad"
              last
              hint="Enter an age between 15 and 40."
              onCommit={(next) => {
                const age = Number(next.trim());

                if (
                  !Number.isFinite(age) ||
                  age < 15 ||
                  age > 40
                ) {
                  return false;
                }

                return commit({
                  age: Math.round(age),
                });
              }}
            />
          </Card>

          {/* HIGHLIGHTS */}
          <SectionTitle
            title="Highlights"
            className="mb-3 mt-6"
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
          contentContainerStyle={{
            paddingHorizontal: gutter,
          }}
        >
          {player.highlights.map((highlight) => (
            <HighlightCard
              key={highlight.id}
              highlight={{
                id: String(highlight.id),
                title: highlight.title,
                source_type: 'external',
                url: highlight.url,
                duration_seconds:
                  highlight.duration_seconds ?? 0,
                thumbnail_url:
                  highlight.thumbnail_url ?? '',
              }}
            />
          ))}

          {player.highlights.length === 0 ? (
            <Card>
              <Text className="font-sans text-[13px] text-slate">
                No highlights added yet.
              </Text>
            </Card>
          ) : null}
        </ScrollView>

        <View
          style={{
            ...contentStyle,
            paddingTop: 24,
            paddingBottom: 32,
          }}
        >
          {/* ABOUT */}
          <SectionTitle
            title="About"
            className="mb-2.5"
          />

          <Card>
            <EditableField
              label="Location"
              value={player.location ?? ''}
              hint="Enter the athlete's location."
              onCommit={(next) => {
                const trimmed = next.trim();

                if (!trimmed) return false;

                return commit({
                  location: trimmed,
                });
              }}
            />

            <EditableField
              label="Scouting summary"
              value={player.bio ?? ''}
              multiline
              hint="Write at least a sentence about the athlete."
              onCommit={(next) => {
                const trimmed = next.trim();

                if (!trimmed) return false;

                return commit({
                  bio: trimmed,
                });
              }}
            />
          </Card>

          {/* VERIFIED STATS */}
          <SectionTitle
            title="Box score"
            className="mb-3 mt-6"
            action={
              <View className="flex-row items-center">
                <Ionicons
                  name="lock-closed-outline"
                  size={12}
                  color={colors.slate}
                />

                <Text className="font-sans-medium ml-1.5 text-[11px] text-slate">
                  {player.stats_from_games
                    ? `Verified from ${player.games_played} games`
                    : 'Coach/admin managed'}
                </Text>
              </View>
            }
          />

          <BoxScoreTable
            games={player.box_score ?? []}
            averages={{
              ppg: player.ppg,
              rpg: player.rpg,
              apg: player.apg,
              fgPct: player.fg_pct,
              gamesPlayed: player.games_played,
            }}
          />

          <SectionTitle
            title="Career stats"
            className="mb-2.5 mt-6"
            action={
              <View className="flex-row items-center">
                <Ionicons
                  name="lock-closed-outline"
                  size={12}
                  color={colors.slate}
                />

                <Text className="font-sans-medium ml-1.5 text-[11px] text-slate">
                  Read only
                </Text>
              </View>
            }
          />

          <Card>
            <CareerStatsTable
              stats={player.career_stats.map(
                (stat) => ({
                  season: stat.season,
                  team_name: stat.team_name,
                  gp: stat.gp,
                  ppg: stat.ppg,
                  rpg: stat.rpg,
                  apg: stat.apg,
                })
              )}
            />
          </Card>

          

          
        </View>
      </ScrollView>
    </Screen>
  );
}