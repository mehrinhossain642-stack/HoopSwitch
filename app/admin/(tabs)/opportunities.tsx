import Ionicons from '@expo/vector-icons/Ionicons';
import {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
    Pressable,
    TextInput,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { AppHeader } from '../../../components/AppHeader';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import {
  Screen,
  useContentContainerStyle,
} from '../../../components/Screen';
import {
  EmptyState,
  InlineError,
  ScreenError,
} from '../../../components/ScreenState';
import { SectionTitle } from '../../../components/SectionTitle';
import { TextField } from '../../../components/TextField';
import { Touchable } from '../../../components/Touchable';

import type { Position } from '../../../data/types';
import * as api from '../../../lib/api';
import type {
  AdminTeam,
  ApiPosting,
} from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { useThemeColors } from '../../../lib/theme';
import {
  errorMessage,
  useApiData,
} from '../../../lib/useApi';

const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];
type OpportunityFilter =
  | 'all'
  | 'open'
  | 'in_review'
  | 'closed';

const OPPORTUNITY_FILTERS: {
  value: OpportunityFilter;
  label: string;
}[] = [
  {
    value: 'all',
    label: 'All',
  },
  {
    value: 'open',
    label: 'Open',
  },
  {
    value: 'in_review',
    label: 'In Review',
  },
  {
    value: 'closed',
    label: 'Closed',
  },
];

export default function AdminOpportunities() {
  const { requireToken, token } = useSession();
  const colors = useThemeColors();

  const contentStyle = useContentContainerStyle({
    measure: 'wide',
    paddingTop: 18,
  });

  const postingsFeed = useApiData(
    () => api.listAdminPostings(requireToken()),
    [token]
  );

  const teamsFeed = useApiData(
    () => api.listAdminTeams(requireToken()),
    [token]
  );

  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');

const [opportunityFilter, setOpportunityFilter] =
  useState<OpportunityFilter>('all');
  const [selectedTeam, setSelectedTeam] =
    useState<AdminTeam | null>(null);

  const [position, setPosition] = useState<Position>('PG');
  const [headline, setHeadline] = useState('');
  const [height, setHeight] = useState('185');
  const [weight, setWeight] = useState('82');
  const [minutes, setMinutes] = useState('20');
  const [notes, setNotes] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] =
    useState<ApiPosting | null>(null);

  const resetForm = useCallback(() => {
    setSelectedTeam(null);
    setPosition('PG');
    setHeadline('');
    setHeight('185');
    setWeight('82');
    setMinutes('20');
    setNotes('');
    setCreating(false);
  }, []);

  const createOpportunity = useCallback(async () => {
    if (!selectedTeam) {
      setError('Select a team for this opportunity.');
      return;
    }

    if (!selectedTeam.coach_name?.trim()) {
      setError(
        'This team needs a coach name before an opportunity can be posted.'
      );
      return;
    }

    if (!headline.trim()) {
      setError('Enter an opportunity headline.');
      return;
    }

    const idealHeight = Number(height);
    const idealWeight = Number(weight);
    const expectedMinutes = Number(minutes);

    if (
      !Number.isFinite(idealHeight) ||
      !Number.isFinite(idealWeight) ||
      !Number.isFinite(expectedMinutes)
    ) {
      setError(
        'Height, weight, and expected minutes must be numbers.'
      );
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await api.createAdminPosting(
        requireToken(),
        {
          team_id: selectedTeam.id,
          position,
          headline: headline.trim(),
          ideal_height_cm: idealHeight,
          ideal_weight_kg: idealWeight,
          expected_minutes: expectedMinutes,
          notes: notes.trim(),
          status: 'open',
        }
      );

      resetForm();
      postingsFeed.refetch();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }, [
    selectedTeam,
    position,
    headline,
    height,
    weight,
    minutes,
    notes,
    requireToken,
    postingsFeed,
    resetForm,
  ]);

  const toggleStatus = useCallback(
    async (posting: ApiPosting) => {
      setBusy(true);
      setError(null);

      try {
        await api.updateAdminPosting(
          requireToken(),
          posting.id,
          {
            status:
              posting.status === 'closed'
                ? 'open'
                : 'closed',
          }
        );

        postingsFeed.refetch();
      } catch (caught) {
        setError(errorMessage(caught));
      } finally {
        setBusy(false);
      }
    },
    [postingsFeed, requireToken]
  );

  const deleteOpportunity = useCallback(async () => {
    if (!deleting) return;

    setBusy(true);
    setError(null);

    try {
      await api.deleteAdminPosting(
        requireToken(),
        deleting.id
      );

      setDeleting(null);
      postingsFeed.refetch();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }, [deleting, postingsFeed, requireToken]);

  if (
    postingsFeed.error &&
    !postingsFeed.data
  ) {
    return (
      <ScreenError
        message={postingsFeed.error}
        onRetry={postingsFeed.refetch}
      />
    );
  }

  if (
    teamsFeed.error &&
    !teamsFeed.data
  ) {
    return (
      <ScreenError
        message={teamsFeed.error}
        onRetry={teamsFeed.refetch}
      />
    );
  }

  const postings = postingsFeed.data?.postings ?? [];
  const teams = teamsFeed.data?.teams ?? [];
  const filteredPostings = useMemo(() => {
  const search = query.trim().toLowerCase();

  return postings.filter((posting) => {
    if (
      opportunityFilter !== 'all' &&
      posting.status !== opportunityFilter
    ) {
      return false;
    }

    if (!search) {
      return true;
    }

    const searchableValues = [
      posting.headline,
      posting.position,
      posting.status,
      posting.team?.name,
      posting.team?.coach_name,
      posting.team?.league,
      posting.team?.location,
      posting.notes,
    ];

    return searchableValues.some((value) =>
      value
        ?.toString()
        .toLowerCase()
        .includes(search)
    );
  });
}, [
  postings,
  query,
  opportunityFilter,
]);

  return (
    <Screen edges={[]}>
      <AppHeader
        title="Opportunities"
        eyebrow="Admin"
        meta={`${postings.length} total opportunities`}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={contentStyle}
        refreshControl={
          <RefreshControl
            refreshing={
              postingsFeed.loading ||
              teamsFeed.loading
            }
            onRefresh={() => {
              postingsFeed.refetch();
              teamsFeed.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {error ? (
          <InlineError
            message={error}
            onRetry={() => setError(null)}
          />
        ) : null}

        {creating ? (
          <CreateOpportunityForm
            teams={teams}
            selectedTeam={selectedTeam}
            onSelectTeam={setSelectedTeam}
            position={position}
            onSelectPosition={setPosition}
            headline={headline}
            onChangeHeadline={setHeadline}
            height={height}
            onChangeHeight={setHeight}
            weight={weight}
            onChangeWeight={setWeight}
            minutes={minutes}
            onChangeMinutes={setMinutes}
            notes={notes}
            onChangeNotes={setNotes}
            busy={busy}
            onCancel={resetForm}
            onCreate={createOpportunity}
          />
        ) : (
          <Button
            label="Post an opportunity"
            icon="add"
            onPress={() => {
              setError(null);
              setCreating(true);
            }}
            className="mb-5"
          />
        )}
<Card className="mb-5">
  <Text className="font-display text-[16px] text-ink">
    Find an opportunity
  </Text>

  <Text className="font-sans mt-1 text-[11px] text-slate">
    Search by opportunity, team, coach, position, or location.
  </Text>

  <View className="mt-4 flex-row items-center rounded-btn border border-border bg-bg px-4">
    <Ionicons
      name="search-outline"
      size={18}
      color={colors.slate}
    />

    <TextInput
      value={query}
      onChangeText={setQuery}
      placeholder="Search opportunities"
      placeholderTextColor={colors.slate}
      autoCapitalize="none"
      autoCorrect={false}
      className="font-sans ml-2 flex-1 py-3 text-[13px] text-ink"
    />

    {query.length > 0 ? (
      <Pressable
        onPress={() => setQuery('')}
        accessibilityRole="button"
        accessibilityLabel="Clear opportunity search"
      >
        <Text className="font-sans-semibold text-[12px] text-primary">
          Clear
        </Text>
      </Pressable>
    ) : null}
  </View>

  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    className="mt-4"
  >
    {OPPORTUNITY_FILTERS.map((item) => {
      const selected =
        opportunityFilter === item.value;

      return (
        <Pressable
          key={item.value}
          onPress={() =>
            setOpportunityFilter(item.value)
          }
          className={`mr-2 rounded-full border px-4 py-2 ${
            selected
              ? 'border-primary bg-primary'
              : 'border-border bg-bg'
          }`}
        >
          <Text
            className={`font-sans-semibold text-[11px] ${
              selected
                ? 'text-white'
                : 'text-slate'
            }`}
          >
            {item.label}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
</Card>
        <View className="mb-3 flex-row items-center justify-between">
  <SectionTitle
    title="Opportunities"
  />

  <Text className="font-stat text-[12px] tracking-eyebrow text-slate">
    {filteredPostings.length}{' '}
    {filteredPostings.length === 1
      ? 'RESULT'
      : 'RESULTS'}
  </Text>
</View>

        {filteredPostings.length === 0 ? (
          <EmptyState
            icon="basketball-outline"
            title="No matching opportunities"
body="Try another team, coach, position, location, or status."
          />
        ) : (
          filteredPostings.map((posting) => (
            <AdminOpportunityCard
              key={posting.id}
              posting={posting}
              busy={busy}
              onToggleStatus={() =>
                toggleStatus(posting)
              }
              onDelete={() =>
                setDeleting(posting)
              }
            />
          ))
        )}
      </ScrollView>

      <ConfirmDialog
        visible={deleting !== null}
        icon="trash-outline"
        destructive
        busy={busy}
        title="Delete this opportunity?"
        body={
          deleting
            ? `${deleting.headline} will be permanently removed.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Keep opportunity"
        onConfirm={deleteOpportunity}
        onCancel={() => setDeleting(null)}
      />
    </Screen>
  );
}

function CreateOpportunityForm({
  teams,
  selectedTeam,
  onSelectTeam,
  position,
  onSelectPosition,
  headline,
  onChangeHeadline,
  height,
  onChangeHeight,
  weight,
  onChangeWeight,
  minutes,
  onChangeMinutes,
  notes,
  onChangeNotes,
  busy,
  onCancel,
  onCreate,
}: {
  teams: AdminTeam[];
  selectedTeam: AdminTeam | null;
  onSelectTeam: (team: AdminTeam) => void;
  position: Position;
  onSelectPosition: (position: Position) => void;
  headline: string;
  onChangeHeadline: (value: string) => void;
  height: string;
  onChangeHeight: (value: string) => void;
  weight: string;
  onChangeWeight: (value: string) => void;
  minutes: string;
  onChangeMinutes: (value: string) => void;
  notes: string;
  onChangeNotes: (value: string) => void;
  busy: boolean;
  onCancel: () => void;
  onCreate: () => void;
}) {
  const colors = useThemeColors();

  return (
    <Card className="mb-5">
      <SectionTitle
        title="Post a new opportunity"
        className="mb-4"
      />

      <Text className="font-sans-semibold mb-2 text-[11px] tracking-eyebrow text-slate">
        TEAM
      </Text>

      {teams.map((team) => {
        const selected = selectedTeam?.id === team.id;
        const missingCoach = !team.coach_name?.trim();

        return (
          <Touchable
            key={team.id}
            disabled={missingCoach}
            onPress={() => onSelectTeam(team)}
            className={`mb-2 flex-row items-center rounded-btn border p-3 ${
              selected
                ? 'border-primary bg-primary-soft'
                : 'border-border bg-bg'
            } ${missingCoach ? 'opacity-50' : ''}`}
          >
            <View className="flex-1">
              <Text className="font-sans-semibold text-[12px] text-ink">
                {team.name}
              </Text>

              <Text className="font-sans mt-1 text-[10px] text-slate">
                {missingCoach
                  ? 'Coach name required before posting'
                  : `Coach: ${team.coach_name}`}
              </Text>
            </View>

            <Ionicons
              name={
                selected
                  ? 'checkmark-circle'
                  : missingCoach
                    ? 'alert-circle-outline'
                    : 'ellipse-outline'
              }
              size={20}
              color={
                selected
                  ? colors.primary
                  : colors.slate
              }
            />
          </Touchable>
        );
      })}

      <Text className="font-sans-semibold mb-2 mt-4 text-[11px] tracking-eyebrow text-slate">
        POSITION
      </Text>

      <View className="mb-4 flex-row">
        {POSITIONS.map((item) => (
          <Touchable
            key={item}
            onPress={() => onSelectPosition(item)}
            className={`mr-2 h-10 min-w-[44px] items-center justify-center rounded-btn border px-3 ${
              position === item
                ? 'border-primary bg-primary'
                : 'border-border bg-bg'
            }`}
          >
            <Text
              className={`font-stat text-[13px] ${
                position === item
                  ? 'text-white'
                  : 'text-ink'
              }`}
            >
              {item}
            </Text>
          </Touchable>
        ))}
      </View>

      <TextField
        label="Headline"
        required
        value={headline}
        onChangeText={onChangeHeadline}
        placeholder="Looking for a starting Point Guard"
        icon="megaphone-outline"
      />

      <TextField
        label="Ideal height"
        required
        value={height}
        onChangeText={onChangeHeight}
        placeholder="185"
        keyboardType="number-pad"
        helper="Enter height in centimetres."
      />

      <TextField
        label="Ideal weight"
        required
        value={weight}
        onChangeText={onChangeWeight}
        placeholder="82"
        keyboardType="decimal-pad"
        helper="Enter weight in kilograms."
      />

      <TextField
        label="Expected minutes"
        required
        value={minutes}
        onChangeText={onChangeMinutes}
        placeholder="20"
        keyboardType="number-pad"
      />

      <TextField
        label="Description"
        optional
        value={notes}
        onChangeText={onChangeNotes}
        placeholder="Describe the role, system fit, and player requirements."
        multiline
      />

      <View className="flex-row">
        <Button
          label="Cancel"
          variant="secondary"
          onPress={onCancel}
          disabled={busy}
          fullWidth={false}
          className="mr-2 flex-1"
        />

        <Button
          label="Publish"
          onPress={onCreate}
          loading={busy}
          fullWidth={false}
          className="flex-1"
        />
      </View>
    </Card>
  );
}

function AdminOpportunityCard({
  posting,
  busy,
  onToggleStatus,
  onDelete,
}: {
  posting: ApiPosting;
  busy: boolean;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="mb-3">
      <View className="flex-row items-start">
        <View className="flex-1 pr-3">
          <Text className="font-display text-[16px] text-ink">
            {posting.headline}
          </Text>

          <Text className="font-sans mt-1 text-[11px] text-slate">
            {posting.team?.name}
            {' · '}
            {posting.position}
          </Text>
        </View>

        <View
          className={`rounded-full px-2.5 py-1 ${
            posting.status === 'open'
              ? 'bg-good-soft'
              : 'bg-mist'
          }`}
        >
          <Text
            className={`font-stat text-[10px] tracking-eyebrow ${
              posting.status === 'open'
                ? 'text-good'
                : 'text-slate'
            }`}
          >
            {posting.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View className="mt-3 rounded-md bg-bg p-3">
        <Text className="font-sans-semibold text-[11px] text-ink">
          Coach: {posting.team?.coach_name}
        </Text>

        <Text className="font-sans mt-1 text-[10px] text-slate">
          {posting.applicant_count} applications
          {' · '}
          {posting.expected_minutes} expected MPG
        </Text>
      </View>

      <View className="mt-4 flex-row">
        <Button
          label={
            posting.status === 'closed'
              ? 'Reopen'
              : 'Close'
          }
          variant="secondary"
          size="sm"
          disabled={busy}
          onPress={onToggleStatus}
          fullWidth={false}
          className="mr-2 flex-1"
        />

        <Button
          label="Delete"
          variant="danger"
          size="sm"
          disabled={busy}
          onPress={onDelete}
          fullWidth={false}
          className="flex-1"
        />
      </View>
    </Card>
  );
}