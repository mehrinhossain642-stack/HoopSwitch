import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { MatchChip } from '../../../components/MatchChip';
import { PositionBadge } from '../../../components/PositionBadge';
import { SectionTitle } from '../../../components/SectionTitle';
import { SpecRow } from '../../../components/SpecRow';
import { StatBlock } from '../../../components/StatBlock';
import { StatusPill } from '../../../components/StatusPill';
import { scoreMatch } from '../../../lib/match';
import { useApp } from '../../../lib/store';
import { COLORS } from '../../../lib/theme';
import { cmToFeetInches, kgToLbs } from '../../../lib/units';

const COMPONENT_LABELS = {
  position: 'Position',
  height: 'Height',
  weight: 'Weight',
  production: 'Production',
} as const;

/** Posting detail — the full slot spec plus a breakdown of the fit score. */
export default function PostingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getPosting, currentPlayer, appliedPostingIds, toggleApply } = useApp();

  const posting = getPosting(id);

  if (!posting) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={['top', 'bottom']}>
        <DetailHeader onBack={() => router.back()} title="Roster spot" />
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={28} color={COLORS.slate} />
          <Text className="font-display mt-3 text-[17px] text-ink">Spot not found</Text>
          <Text className="font-sans mt-1 text-center text-[13px] text-slate">
            This posting is no longer in the feed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const match = scoreMatch(currentPlayer, posting);
  const applied = appliedPostingIds.includes(posting.id);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <DetailHeader onBack={() => router.back()} title="Roster spot" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
        <Card>
          <View className="flex-row items-center">
            <Avatar name={posting.team.name} size={48} shape="square" />
            <View className="ml-3 flex-1">
              <Text className="font-display text-[18px] text-ink">{posting.team.name}</Text>
              <Text className="font-sans mt-0.5 text-[12px] text-slate">
                {posting.team.league} · {posting.team.location}
              </Text>
            </View>
            <StatusPill status={posting.status} />
          </View>

          <View className="mt-4 flex-row items-center">
            <PositionBadge position={posting.position} variant="dark" />
            <Text className="font-display ml-2 flex-1 text-[19px] leading-[25px] text-ink">
              {posting.headline}
            </Text>
          </View>

          <View className="mt-4">
            <MatchChip score={match.score} tier={match.tier} reason={match.reason} />
          </View>

          <View className="mt-4 w-full flex-row border-t border-border pt-4">
            <StatBlock value={`${posting.team.wins}–${posting.team.losses}`} label="RECORD" />
            <StatBlock value={posting.team.roster_size} label="ROSTER" />
            <StatBlock value={posting.applicant_count} label="APPLIED" />
          </View>
        </Card>

        <View className="mt-4">
          <SectionTitle title="What they want" className="mb-3" />
          <Card>
            <SpecRow
              specs={[
                { label: 'Ideal ht', value: `${cmToFeetInches(posting.ideal_height_cm)}+` },
                { label: 'Ideal wt', value: `${kgToLbs(posting.ideal_weight_kg)}+ lbs` },
                { label: 'Minutes', value: `${posting.expected_minutes} MPG` },
              ]}
            />
            <Text className="font-sans mt-3 text-[14px] leading-[20px] text-slate">
              {posting.notes}
            </Text>
          </Card>
        </View>

        <View className="mt-5">
          <SectionTitle title="Why this score" className="mb-3" />
          <Card>
            {(['position', 'height', 'weight', 'production'] as const).map(
              (component, index) => (
                <ScoreBar
                  key={component}
                  label={COMPONENT_LABELS[component]}
                  value={match.breakdown[component]}
                  last={index === 3}
                />
              )
            )}
          </Card>
        </View>

        <View className="mt-5">
          <SectionTitle title="About the program" className="mb-3" />
          <Card>
            <Text className="font-sans text-[14px] leading-[20px] text-slate">
              {posting.team.about}
            </Text>
            <Text className="font-sans-medium mt-3 text-[13px] text-ink">
              Head Coach · {posting.team.coach_name}
            </Text>
          </Card>
        </View>

        <View className="mt-6">
          <Button
            label="Apply to this spot"
            doneLabel="Applied — coach notified"
            done={applied}
            onPress={() => toggleApply(posting.id)}
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

/** Horizontal 0–1 meter for one match component. */
function ScoreBar({ label, value, last }: { label: string; value: number; last: boolean }) {
  const pct = Math.round(value * 100);
  const tone = value >= 0.78 ? COLORS.good : value >= 0.4 ? COLORS.partial : COLORS.primary;

  return (
    <View className={last ? '' : 'mb-3.5'}>
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="font-sans-medium text-[13px] text-ink">{label}</Text>
        <Text className="font-sans-bold text-[13px]" style={{ color: tone }}>
          {pct}%
        </Text>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-bg">
        <View
          className="h-full rounded-full"
          style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: tone }}
        />
      </View>
    </View>
  );
}
