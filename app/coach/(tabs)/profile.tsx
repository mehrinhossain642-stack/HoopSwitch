import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../../components/Avatar';
import { Card } from '../../../components/Card';
import { EditableField } from '../../../components/EditableField';
import { PositionBadge } from '../../../components/PositionBadge';
import { ScreenError, ScreenLoading } from '../../../components/ScreenState';
import { SectionTitle } from '../../../components/SectionTitle';
import { StatBlock } from '../../../components/StatBlock';
import { DotPill, StatusPill } from '../../../components/StatusPill';
import { SwitchRoleButton } from '../../../components/SwitchRoleButton';
import type { Position, PostingStatus } from '../../../data/types';
import * as api from '../../../lib/api';
import type { ApiPosting, PostingPatch } from '../../../lib/api';
import { POSITION_LABEL, roleLabel } from '../../../lib/labels';
import { useSession } from '../../../lib/session';
import { COLORS } from '../../../lib/theme';
import { relativeTime } from '../../../lib/time';
import { useApiData } from '../../../lib/useApi';
import { cmToFeetInches, kgToLbsLabel, parseHeightToCm, parseLbsToKg } from '../../../lib/units';

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
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center justify-between py-3">
          <Text className="font-sans-semibold text-[12px] uppercase tracking-widest text-slate">
            Team profile
          </Text>
          <SwitchRoleButton />
        </View>

        {/* Hero */}
        <Card className="items-center pb-5 pt-6">
          <Avatar name={data.name} size={84} shape="square" />
          <Text className="font-display mt-4 text-[24px] text-ink">{data.name}</Text>
          <Text className="font-sans mt-1 text-[13px] text-slate">
            {[data.league, data.location].filter(Boolean).join(' · ')}
          </Text>
          <Text className="font-sans-semibold mt-1 text-[13px] text-ink">
            Head Coach · {data.coach_name}
          </Text>
          <View className="mt-3">
            <DotPill label={`Recruiting — ${openSlots} open slot${openSlots === 1 ? '' : 's'}`} />
          </View>

          <View className="mt-5 w-full flex-row border-t border-border pt-4">
            <StatBlock value={data.record} label="RECORD" />
            <StatBlock value={data.roster_size} label="ROSTER" />
            <StatBlock value={postings.length} label="SLOTS" />
          </View>
        </Card>

        {/* Open roster slots */}
        <View className="mt-5">
          <SectionTitle
            title="Open Roster Slots"
            className="mb-3"
            action={
              <Text className="font-sans-semibold text-[12px] text-slate">
                {postings.length} total
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

          <Pressable
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
            className="mt-1 items-center rounded-card border border-dashed border-border bg-surface px-6 py-6"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Ionicons name="add-circle-outline" size={22} color={COLORS.primary} />
            <Text className="font-sans-bold mt-1.5 text-[14px] text-primary">
              Post a new slot
            </Text>
            <Text className="font-sans mt-0.5 text-center text-[12px] text-slate">
              Adds an editable opening to your talent feed
            </Text>
          </Pressable>
        </View>

        {/* About the program */}
        <View className="mt-5">
          <Card>
            <EditableField
              label="About the program"
              value={data.about ?? ''}
              multiline
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
    </SafeAreaView>
  );
}

type SlotCardProps = {
  posting: ApiPosting;
  onUpdate: (patch: PostingPatch) => boolean;
};

/** One editable posting. Every commit PATCHes /postings/:id. */
function SlotCard({ posting, onUpdate }: SlotCardProps) {
  return (
    <Card className="mb-3" bare>
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <View className="flex-row items-center">
          <PositionBadge position={posting.position} variant="dark" />
          <Text className="font-display ml-2.5 text-[15px] text-ink">
            {roleLabel(posting.position, posting.expected_minutes)}
          </Text>
        </View>
        <StatusPill status={posting.status} />
      </View>

      <View className="px-4 pb-1 pt-1">
        <EditableField
          label="Position"
          value={posting.position}
          options={POSITIONS}
          onCommit={(next) => onUpdate({ position: next as Position })}
        />
        <EditableField
          label="Ideal Height"
          value={cmToFeetInches(posting.ideal_height_cm)}
          editSeed={cmToFeetInches(posting.ideal_height_cm).replace(/"/g, '')}
          keyboardType="numbers-and-punctuation"
          onCommit={(next) => {
            const cm = parseHeightToCm(next);
            if (cm === null || cm < 150 || cm > 240) return false;
            return onUpdate({ ideal_height_cm: cm });
          }}
        />
        <EditableField
          label="Ideal Weight"
          value={kgToLbsLabel(posting.ideal_weight_kg)}
          editSeed={String(Math.round(posting.ideal_weight_kg * 2.20462))}
          keyboardType="number-pad"
          onCommit={(next) => {
            const kg = parseLbsToKg(next);
            if (kg === null || kg < 50 || kg > 180) return false;
            return onUpdate({ ideal_weight_kg: kg });
          }}
        />
        <EditableField
          label="Expected MPG"
          value={String(posting.expected_minutes)}
          keyboardType="number-pad"
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

      <View className="flex-row items-center justify-between border-t border-border px-4 py-3">
        <Text className="font-sans text-[12px] text-slate">
          {POSITION_LABEL[posting.position]} · posted {relativeTime(posting.created_at)}
        </Text>
        <View className="flex-row items-center">
          <Ionicons name="people-outline" size={14} color={COLORS.slate} />
          <Text className="font-sans-semibold ml-1.5 text-[12px] text-ink">
            {posting.applicant_count} applicants
          </Text>
        </View>
      </View>
    </Card>
  );
}
