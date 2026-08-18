import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { DetailHeader } from '../../../components/AppHeader';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { FitScore } from '../../../components/FitScore';
import { Meter } from '../../../components/Meter';
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
import { StatusPill } from '../../../components/StatusPill';
import {
  STICKY_BAR_CLEARANCE,
  StickyActionBar,
} from '../../../components/StickyActionBar';
import * as api from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { useGoBack } from '../../../lib/useGoBack';
import { useTierColors, useThemeColors } from '../../../lib/theme';
import { relativeTime } from '../../../lib/time';
import { errorMessage, useApiData } from '../../../lib/useApi';
import { cmToFeetInches, kgToLbs } from '../../../lib/units';

const COMPONENT_LABELS = {
  position: 'Position',
  height: 'Height',
  weight: 'Weight',
  production: 'Production',
} as const;

/**
 * Posting detail — the full slot spec plus the server's score breakdown.
 * There is no GET /postings/:id in the MVP surface, so this reads the scored feed
 * and picks the row, which keeps the score authoritative.
 */
export default function PostingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Deep links and direct URLs arrive with no history behind them.
  const goBack = useGoBack('/player');
  const { requireToken, token } = useSession();
  const colors = useThemeColors();
  const contentStyle = useContentContainerStyle({
    paddingTop: 16,
    paddingBottom: STICKY_BAR_CLEARANCE,
  });

  const feed = useApiData(() => api.getPostingFeed(requireToken()), [token]);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const posting = feed.data?.postings.find((item) => String(item.id) === String(id));

  const apply = useCallback(async () => {
    if (!posting || posting.connected) return;
    setApplyError(null);
    setApplying(true);
    try {
      await api.createConnection(requireToken(), posting.id);
      feed.refetch();
    } catch (caught) {
      setApplyError(errorMessage(caught));
    } finally {
      setApplying(false);
    }
  }, [posting, requireToken, feed]);

  if (feed.loading && !feed.data) return <ScreenLoading label="Loading roster spot" />;
  if (feed.error && !feed.data) {
    return <ScreenError message={feed.error} onRetry={feed.refetch} />;
  }

  if (!posting) {
    return (
      <Screen edges={[]}>
        <DetailHeader onBack={goBack} title="Roster spot" />
        <View className="flex-1 justify-center" style={contentStyle}>
          <EmptyState
            icon="alert-circle-outline"
            title="Spot not found"
            body="This posting is no longer in your feed — it may have been filled or closed."
            action={
              <Button
                label="Back to openings"
                variant="secondary"
                size="sm"
                fullWidth={false}
                onPress={goBack}
              />
            }
          />
        </View>
      </Screen>
    );
  }

  const match = posting.match;
  const team = posting.team;

  return (
    <Screen edges={[]}>
      <DetailHeader
        onBack={goBack}
        title="Roster spot"
        right={<StatusPill status={posting.status} onDark />}
      />

      <ScrollView contentContainerStyle={contentStyle}>
        {applyError ? <InlineError message={applyError} onRetry={apply} /> : null}

        <Card bare>
          <View className="p-4">
            <View className="flex-row items-center">
              <Avatar name={team?.name ?? 'Team'} size={48} shape="square" />
              <View className="ml-3.5 flex-1">
                <Text className="font-display text-[18px] text-ink" numberOfLines={2}>
                  {team?.name}
                </Text>
                <Text className="font-sans mt-0.5 text-[12px] text-slate">
                  {[team?.league, team?.location].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>

            <View className="mt-4 flex-row items-start">
              <PositionBadge position={posting.position} tone="dark" size="lg" />
              <Text
                className="font-display ml-3 flex-1 text-[20px] leading-[26px] text-ink"
                style={{ letterSpacing: -0.3 }}>
                {posting.headline}
              </Text>
            </View>

            <Text className="font-sans mt-2 text-[12px] text-slate">
              Posted {relativeTime(posting.created_at)} · {posting.applicant_count} applied
            </Text>
          </View>

          <StatStrip
            tone="plain"
            className="border-t border-border"
            stats={[
              { value: team?.record ?? '—', label: 'Record' },
              { value: team?.roster_size ?? 0, label: 'Roster' },
              { value: posting.applicant_count, label: 'Applied' },
            ]}
          />
        </Card>

        {/* Fit is the reason this screen exists, so it gets its own panel above the
            requirements rather than a chip somewhere in the middle. */}
        {match ? (
          <>
            <SectionTitle title="Your fit" className="mb-2.5 mt-6" />
            <Card>
              <FitScore
                variant="hero"
                score={match.score}
                tier={match.tier}
                reason={match.reason}
              />

              <View className="mt-5 border-t border-border pt-4">
                <Text className="font-stat mb-3 text-[14px] tracking-eyebrow text-slate">
                  SCORE BREAKDOWN
                </Text>
                {(['position', 'height', 'weight', 'production'] as const).map(
                  (component, index) => (
                    <ScoreRow
                      key={component}
                      label={COMPONENT_LABELS[component]}
                      value={match.breakdown[component]}
                      last={index === 3}
                    />
                  )
                )}
              </View>
            </Card>
          </>
        ) : null}

        <SectionTitle title="What they want" className="mb-2.5 mt-6" />
        <Card>
          <SpecStrip
            specs={[
              { label: 'Ideal ht', value: `${cmToFeetInches(posting.ideal_height_cm)}+` },
              { label: 'Ideal wt', value: `${kgToLbs(posting.ideal_weight_kg)}+ lbs` },
              { label: 'Minutes', value: `${posting.expected_minutes} MPG` },
            ]}
          />
          <Text className="font-sans mt-3.5 text-[14px] leading-[21px] text-slate">
            {posting.notes}
          </Text>
        </Card>

        <SectionTitle title="About the program" className="mb-2.5 mt-6" />
        <Card>
          <Text className="font-sans text-[14px] leading-[21px] text-slate">{team?.about}</Text>
          <View className="mt-3.5 flex-row items-center border-t border-border pt-3.5">
            <Ionicons name="person-outline" size={15} color={colors.slate} />
            <Text className="font-sans-medium ml-2 text-[13px] text-ink">
              Head coach · {team?.coach_name}
            </Text>
          </View>
        </Card>
      </ScrollView>

      <StickyActionBar>
        <View className="mr-3 flex-1">
          {match ? <FitScore score={match.score} tier={match.tier} /> : null}
        </View>
        <Button
          label="Apply to this spot"
          doneLabel="Applied"
          done={posting.connected === true}
          loading={applying}
          onPress={apply}
          fullWidth={false}
          className="w-[170px]"
        />
      </StickyActionBar>
    </Screen>
  );
}

/** One component of the server's score, as a labelled bar. */
function ScoreRow({ label, value, last }: { label: string; value: number; last: boolean }) {
  const colors = useThemeColors();
  const tiers = useTierColors();
  const pct = Math.round(value * 100);
  // Thresholds mirror the server's own tiering, so a row's colour agrees with the
  // headline score.
  const tone =
    value >= 0.78 ? tiers.color('good') : value >= 0.4 ? tiers.color('partial') : colors.danger;

  return (
    <View className={last ? '' : 'mb-3.5'}>
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="font-sans-medium text-[13px] text-ink">{label}</Text>
        <Text className="font-stat-bold text-[18px] tracking-stat" style={{ color: tone }}>
          {pct}%
        </Text>
      </View>
      <Meter value={value} color={tone} />
    </View>
  );
}
