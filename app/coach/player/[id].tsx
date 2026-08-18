import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { DetailHeader } from '../../../components/AppHeader';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { CareerStatsTable } from '../../../components/CareerStatsTable';
import { FitScore } from '../../../components/FitScore';
import { HighlightCard, NoHighlights } from '../../../components/HighlightCard';
import { PositionBadge } from '../../../components/PositionBadge';
import { Screen, useContentContainerStyle } from '../../../components/Screen';
import {
  EmptyState,
  InlineError,
  ScreenError,
  ScreenLoading,
} from '../../../components/ScreenState';
import { SectionTitle } from '../../../components/SectionTitle';
import { SpecStrip, StatStrip } from '../../../components/StatStrip';
import {
  STICKY_BAR_CLEARANCE,
  StickyActionBar,
} from '../../../components/StickyActionBar';
import * as api from '../../../lib/api';
import type { ApiMatch, ApiPosting } from '../../../lib/api';
import { roleLabel } from '../../../lib/labels';
import { useLayout } from '../../../lib/layout';
import { useSession } from '../../../lib/session';
import { errorMessage, useApiData } from '../../../lib/useApi';
import { cmToFeetInches, kgToLbsLabel } from '../../../lib/units';

/**
 * Player detail from the coach's side. Scores the player against *every* slot on
 * the roster by fetching each slot's feed — a coach comparing one player wants to
 * know which of their openings he actually fills.
 */
export default function PlayerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { requireToken, token } = useSession();
  const contentStyle = useContentContainerStyle({
    paddingTop: 16,
    paddingBottom: STICKY_BAR_CLEARANCE,
  });
  const { gutter } = useLayout();

  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const data = useApiData(async () => {
    const authToken = requireToken();
    const team = await api.getTeam(authToken);
    const slots = team.postings ?? [];

    // One request per slot. Fine at MVP scale (a handful of slots); if rosters grow
    // this wants a dedicated endpoint rather than a fan-out.
    const feeds = await Promise.all(slots.map((slot) => api.getPlayerFeed(authToken, slot.id)));

    const fits = feeds
      .map((feed) => {
        const player = feed.players.find((p) => String(p.id) === String(id));
        return player?.match ? { posting: feed.posting, match: player.match } : null;
      })
      .filter((entry): entry is { posting: ApiPosting; match: ApiMatch } => entry !== null)
      .sort((a, b) => b.match.score - a.match.score);

    const player = feeds.flatMap((feed) => feed.players).find((p) => String(p.id) === String(id));

    return { player, fits };
  }, [token, id]);

  const invite = useCallback(async () => {
    const best = data.data?.fits[0];
    if (!best || !data.data?.player) return;
    setInviteError(null);
    setInviting(true);
    try {
      await api.createConnection(requireToken(), best.posting.id, data.data.player.id);
      data.refetch();
    } catch (caught) {
      setInviteError(errorMessage(caught));
    } finally {
      setInviting(false);
    }
  }, [data, requireToken]);

  if (data.loading && !data.data) return <ScreenLoading label="Loading player" />;
  if (data.error && !data.data) {
    return <ScreenError message={data.error} onRetry={data.refetch} />;
  }

  const player = data.data?.player;
  const fits = data.data?.fits ?? [];

  if (!player) {
    return (
      <Screen edges={[]}>
        <DetailHeader onBack={() => router.back()} title="Player" />
        <View className="flex-1 justify-center" style={contentStyle}>
          <EmptyState
            icon="alert-circle-outline"
            title="Player not found"
            body="This player is no longer in your feed."
            action={
              <Button
                label="Back to talent"
                variant="secondary"
                size="sm"
                fullWidth={false}
                onPress={() => router.back()}
              />
            }
          />
        </View>
      </Screen>
    );
  }

  const bestFit = fits[0];
  const eligibility = `${player.eligibility_years} yr${
    player.eligibility_years === 1 ? '' : 's'
  } eligibility`;

  return (
    <Screen edges={[]}>
      <DetailHeader onBack={() => router.back()} title="Player" />

      <ScrollView contentContainerStyle={contentStyle}>
        {inviteError ? <InlineError message={inviteError} onRetry={invite} /> : null}

        <Card bare>
          <View className="p-4">
            <View className="flex-row items-center">
              <Avatar name={player.name} size={56} />
              <View className="ml-3.5 flex-1">
                <View className="flex-row items-center">
                  <Text
                    className="font-display flex-shrink text-[20px] text-ink"
                    numberOfLines={2}>
                    {player.name}
                  </Text>
                  <View className="ml-2.5">
                    <PositionBadge position={player.position} tone="dark" />
                  </View>
                </View>
                <Text className="font-sans mt-1 text-[12px] leading-[17px] text-slate">
                  {player.location} · Age {player.age} · {eligibility} ·{' '}
                  {player.dominant_hand.toLowerCase()} handed
                </Text>
              </View>
            </View>
          </View>

          <StatStrip
            tone="plain"
            className="border-t border-border"
            stats={[
              { value: player.ppg.toFixed(1), label: 'PPG' },
              { value: player.rpg.toFixed(1), label: 'RPG' },
              { value: player.apg.toFixed(1), label: 'APG' },
              { value: `${Math.round(player.fg_pct)}%`, label: 'FG%' },
            ]}
          />
        </Card>

        <SpecStrip
          className="mt-3"
          specs={[
            { label: 'Height', value: cmToFeetInches(player.height_cm) },
            { label: 'Weight', value: kgToLbsLabel(player.weight_kg) },
            { label: 'Wingspan', value: cmToFeetInches(player.wingspan_cm) },
          ]}
        />

        {bestFit ? (
          <>
            <SectionTitle title="Best fit" className="mb-2.5 mt-6" />
            <Card>
              <FitScore
                variant="hero"
                score={bestFit.match.score}
                tier={bestFit.match.tier}
                reason={bestFit.match.reason}
              />
              <View className="mt-4 border-t border-border pt-3.5">
                <Text className="font-sans text-[13px] text-slate">
                  Strongest against{' '}
                  <Text className="font-sans-bold text-ink">
                    {roleLabel(bestFit.posting.position, bestFit.posting.expected_minutes)}
                  </Text>
                  .
                </Text>
              </View>
            </Card>
          </>
        ) : null}

        {fits.length > 1 ? (
          <>
            <SectionTitle title="Fit across your slots" className="mb-2.5 mt-6" />
            <Card bare>
              {fits.map((fit, index) => (
                <View
                  key={fit.posting.id}
                  className={`px-4 py-3.5 ${
                    index < fits.length - 1 ? 'border-b border-border' : ''
                  }`}>
                  <View className="flex-row items-center">
                    <PositionBadge position={fit.posting.position} />
                    <Text
                      className="font-sans-semibold ml-3 flex-1 text-[13px] text-ink"
                      numberOfLines={1}>
                      {roleLabel(fit.posting.position, fit.posting.expected_minutes)}
                    </Text>
                  </View>
                  <View className="mt-2">
                    <FitScore
                      score={fit.match.score}
                      tier={fit.match.tier}
                      reason={fit.match.reason}
                    />
                  </View>
                </View>
              ))}
            </Card>
          </>
        ) : null}

        <SectionTitle title="Highlights" className="mb-3 mt-6" />
        {player.highlights.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            // Negative inset lets the reel bleed to the screen edge while the
            // section title stays aligned with the rest of the column.
            style={{ marginHorizontal: -gutter }}
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
          </ScrollView>
        ) : (
          <NoHighlights />
        )}

        <SectionTitle title="Scouting notes" className="mb-2.5 mt-6" />
        <Card>
          <Text className="font-sans text-[14px] leading-[21px] text-slate">{player.bio}</Text>
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
      </ScrollView>

      <StickyActionBar>
        <View className="mr-3 flex-1">
          {bestFit ? <FitScore score={bestFit.match.score} tier={bestFit.match.tier} /> : null}
        </View>
        <Button
          label={bestFit ? 'Invite to best fit' : 'Invite'}
          doneLabel="Invited"
          done={player.connected === true}
          loading={inviting}
          disabled={!bestFit}
          onPress={invite}
          fullWidth={false}
          className="w-[160px]"
        />
      </StickyActionBar>
    </Screen>
  );
}
