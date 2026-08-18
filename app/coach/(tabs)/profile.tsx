import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Card } from '../../../components/Card';
import { EditableField } from '../../../components/EditableField';
import { PositionBadge } from '../../../components/PositionBadge';
import { ProfileHero } from '../../../components/ProfileHero';
import { Screen, useContentContainerStyle } from '../../../components/Screen';
import { ScreenError, ScreenLoading } from '../../../components/ScreenState';
import { SectionTitle } from '../../../components/SectionTitle';
import { SettingsButton } from '../../../components/SettingsButton';
import { DotPill, StatusPill, useStatusRail } from '../../../components/StatusPill';
import { Touchable } from '../../../components/Touchable';
import type { Position, PostingStatus } from '../../../data/types';
import * as api from '../../../lib/api';
import type { ApiPosting, PostingPatch } from '../../../lib/api';
import { POSITION_LABEL, roleLabel } from '../../../lib/labels';
import { useSession } from '../../../lib/session';
import { useThemeColors } from '../../../lib/theme';
import { relativeTime } from '../../../lib/time';
import { useApiData } from '../../../lib/useApi';
import {
  cmToFeetInches,
  kgToLbsLabel,
  parseHeightToCm,
  parseLbsToKg,
} from '../../../lib/units';

const POSITIONS: readonly Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];
const STATUS_OPTIONS: readonly PostingStatus[] = ['open', 'in_review', 'closed'];
const STATUS_LABELS: Record<PostingStatus, string> = {
  open: 'Open',
  in_review: 'In review',
  closed: 'Closed',
};

/** Coach Profile — own view. Slot edits PATCH the API and re-score the feed. */
export default function CoachProfile() {
  const { requireToken, token } = useSession();
  const colors = useThemeColors();
  const contentStyle = useContentContainerStyle({ paddingTop: 20 });
  const team = useApiData(() => api.getTeam(requireToken()), [token]);
  const { data, refetch } = team;

  const updateSlot = useCallback(
    (id: number, patch: PostingPatch): boolean => {
      api.updatePosting(requireToken(), id, patch).then(refetch).catch(refetch);
      return true;
    },
    [requireToken, refetch]
  );

  if (team.loading && !data) return <ScreenLoading label="Loading your team" />;
  if (team.error && !data) return <ScreenError message={team.error} onRetry={refetch} />;
  if (!data) return <ScreenError message="Team unavailable" onRetry={refetch} />;

  const postings = data.postings ?? [];
  const openSlots = data.open_slots_count ?? 0;

  return (
    <Screen edges={[]}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ProfileHero
          eyebrow="Team profile"
          name={data.name}
          avatarShape="square"
          meta={[data.league, data.location].filter(Boolean).join(' · ')}
          submeta={`Head coach · ${data.coach_name}`}
          pill={
            <DotPill
              label={`Recruiting — ${openSlots} open slot${openSlots === 1 ? '' : 's'}`}
              tone="onDark"
            />
          }
          action={<SettingsButton href="/coach/settings" />}
          stats={[
            { value: data.record, label: 'Record' },
            { value: data.roster_size, label: 'Roster' },
            { value: postings.length, label: 'Slots' },
          ]}
        />

        <View style={contentStyle}>
          <SectionTitle
            title="Roster slots"
            className="mb-3"
            action={
              <Text className="font-stat text-[14px] tracking-eyebrow text-slate">
                {postings.length} TOTAL
              </Text>
            }
          />

          {postings.map((posting) => (
            <SlotCard
              key={posting.id}
              posting={posting}
              onUpdate={(patch) => updateSlot(posting.id, patch)}
            />
          ))}

          <Touchable
            onPress={() => {
              api
                .createPosting(requireToken(), {
                  position: 'SF',
                  ideal_height_cm: 198,
                  ideal_weight_kg: 90,
                  expected_minutes: 20,
                  status: 'open',
                  headline: 'New roster slot',
                  notes: 'Describe the role, system fit and what you need from this spot.',
                })
                .then(refetch)
                .catch(refetch);
            }}
            accessibilityRole="button"
            accessibilityLabel="Post a new roster slot"
            scaleTo={0.99}
            className="items-center rounded-card border border-dashed border-border-strong bg-surface px-6 py-6">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-soft">
              <Ionicons name="add" size={22} color={colors.primary} />
            </View>
            <Text className="font-display mt-2.5 text-[15px] text-ink">Post a new slot</Text>
            <Text className="font-sans mt-1 text-center text-[12px] leading-[17px] text-slate">
              Adds an editable opening, and every player gets ranked against it.
            </Text>
          </Touchable>

          <SectionTitle title="About the program" className="mb-2.5 mt-6" />
          <Card>
            <EditableField
              label="Program overview"
              value={data.about ?? ''}
              multiline
              hint="Write at least a sentence so players know what they'd be joining."
              onCommit={(next) => {
                const trimmed = next.trim();
                if (trimmed.length === 0) return false;
                api.updateTeam(requireToken(), { about: trimmed }).then(refetch).catch(refetch);
                return true;
              }}
            />
          </Card>

        </View>
      </ScrollView>
    </Screen>
  );
}

/** One editable posting. Every commit PATCHes /postings/:id. */
function SlotCard({
  posting,
  onUpdate,
}: {
  posting: ApiPosting;
  onUpdate: (patch: PostingPatch) => boolean;
}) {
  const colors = useThemeColors();
  // Rail colour encodes the slot's status down the left edge of its card.
  const rail = useStatusRail();

  return (
    <Card bare rail={rail[posting.status]} className="mb-3">
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <View className="flex-1 flex-row items-center">
          <PositionBadge position={posting.position} tone="dark" />
          <View className="ml-3 flex-1">
            <Text className="font-display text-[15px] text-ink" numberOfLines={1}>
              {roleLabel(posting.position, posting.expected_minutes)}
            </Text>
            <Text className="font-sans mt-0.5 text-[11px] text-slate">
              {POSITION_LABEL[posting.position]} · posted {relativeTime(posting.created_at)}
            </Text>
          </View>
        </View>
        <StatusPill status={posting.status} />
      </View>

      <View className="px-4">
        <EditableField
          label="Position"
          value={posting.position}
          options={POSITIONS}
          onCommit={(next) => onUpdate({ position: next as Position })}
        />
        <EditableField
          label="Ideal height"
          value={cmToFeetInches(posting.ideal_height_cm)}
          editSeed={cmToFeetInches(posting.ideal_height_cm).replace(/"/g, '')}
          keyboardType="numbers-and-punctuation"
          hint="Enter a height between 4'11&quot; and 7'10&quot;."
          onCommit={(next) => {
            const cm = parseHeightToCm(next);
            if (cm === null || cm < 150 || cm > 240) return false;
            return onUpdate({ ideal_height_cm: cm });
          }}
        />
        <EditableField
          label="Ideal weight"
          value={kgToLbsLabel(posting.ideal_weight_kg)}
          editSeed={String(Math.round(posting.ideal_weight_kg * 2.20462))}
          keyboardType="number-pad"
          hint="Enter a weight in pounds between 110 and 397."
          onCommit={(next) => {
            const kg = parseLbsToKg(next);
            if (kg === null || kg < 50 || kg > 180) return false;
            return onUpdate({ ideal_weight_kg: kg });
          }}
        />
        <EditableField
          label="Expected minutes"
          value={`${posting.expected_minutes} MPG`}
          editSeed={String(posting.expected_minutes)}
          keyboardType="number-pad"
          hint="Enter minutes per game between 1 and 40."
          onCommit={(next) => {
            const minutes = Number(next.trim());
            if (!Number.isFinite(minutes) || minutes < 1 || minutes > 40) return false;
            return onUpdate({ expected_minutes: Math.round(minutes) });
          }}
        />
        <EditableField
          label="Status"
          value={STATUS_LABELS[posting.status]}
          options={STATUS_OPTIONS.map((status) => STATUS_LABELS[status])}
          last
          onCommit={(next) => {
            const match = STATUS_OPTIONS.find((status) => STATUS_LABELS[status] === next);
            if (!match) return false;
            return onUpdate({ status: match });
          }}
        />
      </View>

      <View className="flex-row items-center justify-between border-t border-border bg-bg px-4 py-3">
        <View className="flex-row items-center">
          <Ionicons name="people-outline" size={15} color={colors.slate} />
          <Text className="font-sans ml-2 text-[12px] text-slate">Applicants</Text>
        </View>
        <Text className="font-stat-bold text-[21px] tracking-stat text-ink">
          {posting.applicant_count}
        </Text>
      </View>
    </Card>
  );
}
