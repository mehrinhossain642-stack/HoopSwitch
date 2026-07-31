import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../../components/Avatar';
import { Card } from '../../../components/Card';
import { EditableField } from '../../../components/EditableField';
import { PositionBadge } from '../../../components/PositionBadge';
import { SectionTitle } from '../../../components/SectionTitle';
import { StatBlock } from '../../../components/StatBlock';
import { DotPill, StatusPill } from '../../../components/StatusPill';
import { SwitchRoleButton } from '../../../components/SwitchRoleButton';
import type { Position, Posting, PostingStatus } from '../../../data/types';
import { POSITION_LABEL, roleLabel } from '../../../lib/labels';
import { useApp } from '../../../lib/store';
import { COLORS } from '../../../lib/theme';
import { cmToFeetInches, kgToLbsLabel, parseHeightToCm, parseLbsToKg } from '../../../lib/units';

const POSITIONS: readonly Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];
const STATUS_OPTIONS: readonly PostingStatus[] = ['open', 'in_review', 'closed'];
const STATUS_LABELS: Record<PostingStatus, string> = {
  open: 'Open',
  in_review: 'In review',
  closed: 'Closed',
};

/** Coach Profile — own view. Slot edits re-score the talent feed. */
export default function CoachProfile() {
  const { currentTeam, updatePosting, updateTeam, addPosting, invitedPlayerIds } = useApp();
  const team = currentTeam;
  const openSlots = team.postings.filter((posting) => posting.status === 'open').length;

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
          <Avatar name={team.name} size={84} shape="square" />
          <Text className="font-display mt-4 text-[24px] text-ink">{team.name}</Text>
          <Text className="font-sans mt-1 text-[13px] text-slate">
            {team.league} · {team.location}
          </Text>
          <Text className="font-sans-semibold mt-1 text-[13px] text-ink">
            Head Coach · {team.coach_name}
          </Text>
          <View className="mt-3">
            <DotPill
              label={`Recruiting — ${openSlots} open slot${openSlots === 1 ? '' : 's'}`}
            />
          </View>

          <View className="mt-5 w-full flex-row border-t border-border pt-4">
            <StatBlock value={`${team.wins}–${team.losses}`} label="RECORD" />
            <StatBlock value={team.roster_size} label="ROSTER" />
            <StatBlock value={invitedPlayerIds.length} label="INVITES" />
          </View>
        </Card>

        {/* Open roster slots */}
        <View className="mt-5">
          <SectionTitle
            title="Open Roster Slots"
            className="mb-3"
            action={
              <Text className="font-sans-semibold text-[12px] text-slate">
                {team.postings.length} total
              </Text>
            }
          />

          {team.postings.map((posting) => (
            <SlotCard
              key={posting.id}
              posting={posting}
              onUpdate={(patch) => updatePosting(posting.id, patch)}
            />
          ))}

          <Pressable
            onPress={() => addPosting(team.id)}
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
              value={team.about}
              multiline
              onCommit={(next) => {
                const trimmed = next.trim();
                if (trimmed.length === 0) return false;
                updateTeam(team.id, { about: trimmed });
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
  posting: Posting;
  onUpdate: (patch: Partial<Posting>) => void;
};

/** One editable posting. Every commit flows into the shared store. */
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
          onCommit={(next) => {
            onUpdate({ position: next as Position });
            return true;
          }}
        />
        <EditableField
          label="Ideal Height"
          value={cmToFeetInches(posting.ideal_height_cm)}
          editSeed={cmToFeetInches(posting.ideal_height_cm).replace(/"/g, '')}
          keyboardType="numbers-and-punctuation"
          onCommit={(next) => {
            const cm = parseHeightToCm(next);
            if (cm === null || cm < 150 || cm > 240) return false;
            onUpdate({ ideal_height_cm: cm });
            return true;
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
            onUpdate({ ideal_weight_kg: kg });
            return true;
          }}
        />
        <EditableField
          label="Expected MPG"
          value={String(posting.expected_minutes)}
          keyboardType="number-pad"
          onCommit={(next) => {
            const minutes = Number(next.trim());
            if (!Number.isFinite(minutes) || minutes < 1 || minutes > 40) return false;
            onUpdate({ expected_minutes: Math.round(minutes) });
            return true;
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
            onUpdate({ status: match });
            return true;
          }}
        />
      </View>

      <View className="flex-row items-center justify-between border-t border-border px-4 py-3">
        <Text className="font-sans text-[12px] text-slate">
          {POSITION_LABEL[posting.position]} · posted {posting.posted_ago}
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
