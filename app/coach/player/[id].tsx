import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { CareerStatsTable } from '../../../components/CareerStatsTable';
import { HighlightCard } from '../../../components/HighlightCard';
import { MatchChip } from '../../../components/MatchChip';
import { PositionBadge } from '../../../components/PositionBadge';
import { InlineError, ScreenError, ScreenLoading } from '../../../components/ScreenState';
import { SectionTitle } from '../../../components/SectionTitle';
import { SpecRow } from '../../../components/SpecRow';
import { StatBlock } from '../../../components/StatBlock';
import * as api from '../../../lib/api';
import type { ApiMatch, ApiPosting } from '../../../lib/api';
import { roleLabel } from '../../../lib/labels';
import { useSession } from '../../../lib/session';
import { COLORS } from '../../../lib/theme';
import { errorMessage, useApiData } from '../../../lib/useApi';
import { cmToFeetInches, kgToLbsLabel } from '../../../lib/units';

/**
 * Player detail from the coach's side. Scores the player against *every* slot
 * on the roster by fetching each slot's feed — a coach comparing one player
 * wants to know which of their openings he actually fills.
 */
export default function PlayerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { requireToken, token } = useSession();
  const [inviteError, setInviteError] = useState<string | null>(null);

  const data = useApiData(async () => {
    const authToken = requireToken();
    const team = await api.getTeam(authToken);
    const slots = team.postings ?? [];

    // One request per slot. Fine at MVP scale (a handful of slots); if rosters
    // grow this wants a dedicated endpoint rather than a fan-out.
    const feeds = await Promise.all(
      slots.map((slot) => api.getPlayerFeed(authToken, slot.id))
    );

    const fits = feeds
      .map((feed) => {
        const player = feed.players.find((p) => String(p.id) === String(id));
        return player?.match ? { posting: feed.posting, match: player.match } : null;
      })
      .filter((entry): entry is { posting: ApiPosting; match: ApiMatch } => entry !== null)
      .sort((a, b) => b.match.score - a.match.score);

    const player = feeds
      .flatMap((feed) => feed.players)
      .find((p) => String(p.id) === String(id));

    return { player, fits };
  }, [token, id]);

  const invite = useCallback(async () => {
    const best = data.data?.fits[0];
    if (!best || !data.data?.player) return;
    setInviteError(null);
    try {
      await api.createConnection(requireToken(), best.posting.id, data.data.player.id);
      data.refetch();
    } catch (caught) {
      setInviteError(errorMessage(caught));
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
      <SafeAreaView className="flex-1 bg-bg" edges={['top', 'bottom']}>
        <DetailHeader onBack={() => router.back()} title="Player" />
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={28} color={COLORS.slate} />
          <Text className="font-display mt-3 text-[17px] text-ink">Player not found</Text>
          <Text className="font-sans mt-1 text-center text-[13px] text-slate">
            This player is no longer in your feed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const bestFit = fits[0];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <DetailHeader onBack={() => router.back()} title="Player" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
        {inviteError ? <InlineError message={inviteError} /> : null}

        <Card className="items-center pb-5 pt-6">
          <Avatar name={player.name} size={84} />
          <View className="mt-4 flex-row items-center">
            <Text className="font-display text-[23px] text-ink">{player.name}</Text>
            <View className="ml-2">
              <PositionBadge position={player.position} variant="dark" />
            </View>
          </View>
          <Text className="font-sans mt-1 text-[13px] text-slate">
            {player.location} · Age {player.age} · {player.eligibility_years} yr
            {player.eligibility_years === 1 ? '' : 's'} eligibility · {player.dominant_hand}{' '}
            handed
          </Text>

          {bestFit ? (
            <View className="mt-3">
              <MatchChip
                score={bestFit.match.score}
                tier={bestFit.match.tier}
                reason={bestFit.match.reason}
              />
            </View>
          ) : null}

          <View className="mt-5 w-full flex-row border-t border-border pt-4">
            <StatBlock value={player.ppg.toFixed(1)} label="PPG" />
            <StatBlock value={player.rpg.toFixed(1)} label="RPG" />
            <StatBlock value={player.apg.toFixed(1)} label="APG" />
            <StatBlock value={`${Math.round(player.fg_pct)}%`} label="FG%" />
          </View>
        </Card>

        <View className="mt-4">
          <SpecRow
            specs={[
              { label: 'Height', value: cmToFeetInches(player.height_cm) },
              { label: 'Weight', value: kgToLbsLabel(player.weight_kg) },
              { label: 'Wingspan', value: cmToFeetInches(player.wingspan_cm) },
            ]}
          />
        </View>

        <View className="mt-5">
          <SectionTitle title="Fit across your slots" className="mb-3" />
          <Card bare>
            {fits.map((fit, index) => (
              <View
                key={fit.posting.id}
                className={`px-4 py-3 ${index < fits.length - 1 ? 'border-b border-border' : ''}`}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <PositionBadge position={fit.posting.position} />
                    <Text className="font-sans-semibold ml-2.5 text-[14px] text-ink">
                      {roleLabel(fit.posting.position, fit.posting.expected_minutes)}
                    </Text>
                  </View>
                  <MatchChip
                    score={fit.match.score}
                    tier={fit.match.tier}
                    reason={fit.match.reason}
                  />
                </View>
              </View>
            ))}
          </Card>
        </View>

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
          </ScrollView>
        </View>

        <View className="mt-5">
          <SectionTitle title="Scouting notes" className="mb-3" />
          <Card>
            <Text className="font-sans text-[14px] leading-[20px] text-slate">{player.bio}</Text>
          </Card>
        </View>

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

        <View className="mt-6">
          <Button
            label={bestFit ? `Invite to ${roleLabel(bestFit.posting.position, bestFit.posting.expected_minutes)}` : 'Invite'}
            doneLabel="Invited"
            done={player.connected === true}
            onPress={invite}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View className="flex-row items-center px-5 py-3">
      <Pressable
        onPress={onBack}
        hitSlop={10}
        className="h-9 w-9 items-center justify-center rounded-full border border-border bg-surface"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <Ionicons name="chevron-back" size={18} color={COLORS.ink} />
      </Pressable>
      <Text className="font-sans-semibold ml-3 text-[12px] uppercase tracking-widest text-slate">
        {title}
      </Text>
    </View>
  );
}
