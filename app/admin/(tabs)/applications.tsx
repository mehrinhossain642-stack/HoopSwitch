import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { AppHeader } from '../../../components/AppHeader';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { Screen, useContentContainerStyle } from '../../../components/Screen';
import { EmptyState, InlineError, ScreenError } from '../../../components/ScreenState';
import { Sheet, SheetRow } from '../../../components/Sheet';
import * as api from '../../../lib/api';
import type { ApiConnection, ApiConnectionStatus } from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { useThemeColors } from '../../../lib/theme';
import { errorMessage, useApiData } from '../../../lib/useApi';

type ApplicationFilter = 'all' | ApiConnectionStatus;
type OpenSheet = 'status' | 'team' | 'update' | null;

const STATUS_LABELS: Record<ApiConnectionStatus, string> = {
  pending_parent_approval: 'Pending Parent Approval',
  under_review: 'Under Review',
  shared_with_coach: 'Shared with Coach',
  coach_interested: 'Coach Interested',
  tryout_offered: 'Tryout Offered',
  confirmed: 'Tryout Confirmed',
  declined: 'Declined',
  not_selected: 'Not Selected',
  closed: 'Closed',
};

const FILTER_STATUSES: { value: ApplicationFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending_parent_approval', label: 'Parent Review' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shared_with_coach', label: 'Shared with Coach' },
  { value: 'coach_interested', label: 'Coach Interested' },
  { value: 'tryout_offered', label: 'Tryout Offered' },
  { value: 'confirmed', label: 'Tryout Confirmed' },
  { value: 'not_selected', label: 'Not Selected' },
  { value: 'declined', label: 'Declined' },
  { value: 'closed', label: 'Closed' },
];

const ADMIN_STATUSES: { value: ApiConnectionStatus; label: string; description: string }[] = [
  { value: 'under_review', label: 'Under Review', description: 'HoopSwitch is reviewing the application.' },
  { value: 'shared_with_coach', label: 'Shared with Coach', description: 'The athlete profile has been shared with the coach.' },
  { value: 'coach_interested', label: 'Coach Interested', description: 'The coach has expressed interest in the athlete.' },
  { value: 'tryout_offered', label: 'Tryout Offered', description: 'The athlete has been offered a tryout.' },
  { value: 'confirmed', label: 'Tryout Confirmed', description: 'The athlete tryout has been confirmed.' },
  { value: 'not_selected', label: 'Not Selected', description: 'The athlete was not selected.' },
  { value: 'declined', label: 'Declined', description: 'The application or offer was declined.' },
  { value: 'closed', label: 'Closed', description: 'The application process has been closed.' },
];

export default function AdminApplications() {
  const params = useLocalSearchParams<{ status?: string }>();
  const { requireToken, token } = useSession();
  const colors = useThemeColors();
  const style = useContentContainerStyle({ measure: 'wide', paddingTop: 18 });
  const feed = useApiData(() => api.listAdminApplications(requireToken()), [token]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationFilter>('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const [target, setTarget] = useState<ApiConnection | null>(null);
  const [nextStatus, setNextStatus] = useState<ApiConnectionStatus | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (FILTER_STATUSES.some((item) => item.value === params.status)) {
      setStatusFilter(params.status as ApplicationFilter);
    }
  }, [params.status]);

  const all = feed.data?.applications ?? [];
  const teams = useMemo(
    () => Array.from(new Set(all.map((item) => item.posting?.team?.name)
      .filter((name): name is string => Boolean(name)))).sort(),
    [all]
  );
  const shown = useMemo(() => {
    const search = query.trim().toLowerCase();
    return all.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (teamFilter !== 'all' && item.posting?.team?.name !== teamFilter) return false;
      if (!search) return true;
      return [
        item.athlete?.name, item.athlete?.position, item.posting?.headline,
        item.posting?.team?.name, item.posting?.team?.coach_name,
        item.posting?.team?.league, item.posting?.team?.location,
        STATUS_LABELS[item.status],
      ].some((value) => value?.toString().toLowerCase().includes(search));
    });
  }, [all, query, statusFilter, teamFilter]);

  const closeStatusFlow = () => {
    setSheet(null); setConfirming(false); setNextStatus(null); setTarget(null);
  };
  const confirmChange = async () => {
    if (!target || !nextStatus || busyId !== null) return;
    setBusyId(target.id); setError(null);
    try {
      await api.updateAdminApplication(requireToken(), target.id, nextStatus);
      closeStatusFlow();
      feed.refetch();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusyId(null);
    }
  };

  if (feed.error && !feed.data) return <ScreenError message={feed.error} onRetry={feed.refetch} />;
  const statusLabel = FILTER_STATUSES.find((item) => item.value === statusFilter)?.label ?? 'All statuses';

  return (
    <Screen edges={[]}>
      <AppHeader title="Applications" eyebrow="Admin" meta={`${all.length} total applications`} />
      <ScrollView contentContainerStyle={style} keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={feed.loading} onRefresh={feed.refetch} tintColor={colors.primary} />}>
        {error ? <InlineError message={error} onRetry={() => setError(null)} /> : null}
        <Card className="mb-5">
          <Text className="font-display text-[16px] text-ink">Find an application</Text>
          <Text className="font-sans mt-1 text-[11px] text-slate">
            Search by athlete, team, coach, position, or opportunity.
          </Text>
          <View className="mt-4 flex-row items-center rounded-btn border border-border bg-bg px-4">
            <Text className="mr-2 text-[18px] text-slate">⌕</Text>
            <TextInput value={query} onChangeText={setQuery} placeholder="Search applications"
              placeholderTextColor={colors.slate} autoCapitalize="none" autoCorrect={false}
              className="font-sans flex-1 py-3 text-[13px] text-ink" />
            {query ? <Pressable onPress={() => setQuery('')}><Text className="font-sans-semibold text-[12px] text-primary">Clear</Text></Pressable> : null}
          </View>
          <View className="mt-3 flex-row">
            <Button label={`Status: ${statusLabel}`} icon="chevron-down" iconTrailing variant="secondary"
              size="sm" onPress={() => setSheet('status')} fullWidth={false} className="mr-2 flex-1" />
            <Button label={teamFilter === 'all' ? 'Team: All teams' : `Team: ${teamFilter}`}
              icon="chevron-down" iconTrailing variant="secondary" size="sm"
              onPress={() => setSheet('team')} fullWidth={false} className="flex-1" />
          </View>
          {statusFilter !== 'all' || teamFilter !== 'all' ? (
            <Button label="Clear filters" variant="ghost" size="sm" className="mt-2"
              onPress={() => { setStatusFilter('all'); setTeamFilter('all'); }} />
          ) : null}
        </Card>
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-display text-[17px] text-ink">Applications</Text>
          <Text className="font-stat text-[12px] tracking-eyebrow text-slate">
            {shown.length} {shown.length === 1 ? 'RESULT' : 'RESULTS'}
          </Text>
        </View>
        {shown.length === 0 ? (
          <EmptyState icon="document-text-outline" title="No matching applications"
            body="Try another athlete, team, coach, status, or search term." />
        ) : shown.map((application) => (
          <ApplicationCard key={application.id} application={application} busy={busyId === application.id}
            onChooseStatus={() => { setTarget(application); setSheet('update'); }} />
        ))}
      </ScrollView>

      <Sheet visible={sheet === 'status'} onClose={() => setSheet(null)} title="Filter by status">
        <ScrollView>{FILTER_STATUSES.map((item, index) => (
          <SheetRow key={item.value} active={statusFilter === item.value}
            last={index === FILTER_STATUSES.length - 1}
            onPress={() => { setStatusFilter(item.value); setSheet(null); }}>
            <Text className="font-sans-semibold text-[13px] text-ink">{item.label}</Text>
          </SheetRow>
        ))}</ScrollView>
      </Sheet>

      <Sheet visible={sheet === 'team'} onClose={() => setSheet(null)} title="Filter by team">
        <ScrollView>{['all', ...teams].map((team, index, list) => (
          <SheetRow key={team} active={teamFilter === team} last={index === list.length - 1}
            onPress={() => { setTeamFilter(team); setSheet(null); }}>
            <Text className="font-sans-semibold text-[13px] text-ink">{team === 'all' ? 'All teams' : team}</Text>
          </SheetRow>
        ))}</ScrollView>
      </Sheet>

      <Sheet visible={sheet === 'update' && target !== null} onClose={closeStatusFlow}
        title="Change application status"
        subtitle={target ? `${target.athlete?.name ?? 'Athlete'} · ${target.posting?.team?.name ?? 'Unknown team'}` : undefined}>
        <ScrollView>{ADMIN_STATUSES.map((option, index) => (
          <SheetRow key={option.value} active={target?.status === option.value}
            last={index === ADMIN_STATUSES.length - 1}
            onPress={() => {
              if (target?.status !== option.value) {
                setNextStatus(option.value); setSheet(null); setConfirming(true);
              }
            }}>
            <Text className="font-sans-semibold text-[13px] text-ink">{option.label}</Text>
            <Text className="font-sans mt-1 text-[11px] leading-[16px] text-slate">{option.description}</Text>
          </SheetRow>
        ))}</ScrollView>
      </Sheet>

      <ConfirmDialog visible={confirming} icon="notifications-outline" busy={busyId !== null}
        title="Confirm status change"
        body={target && nextStatus
          ? `Change ${target.athlete?.name ?? 'this athlete'}’s application from ${STATUS_LABELS[target.status]} to ${STATUS_LABELS[nextStatus]}? The athlete and their parent will be notified of this status change.`
          : ''}
        confirmLabel="Update status" cancelLabel="Go back" onConfirm={confirmChange}
        onCancel={() => { setConfirming(false); setNextStatus(null); setSheet('update'); }} />
    </Screen>
  );
}

function ApplicationCard({ application, busy, onChooseStatus }: {
  application: ApiConnection; busy: boolean; onChooseStatus: () => void;
}) {
  const team = application.posting?.team;
  return (
    <Card className="mb-3">
      <View className="flex-row items-start">
        <View className="flex-1 pr-3">
          <Text className="font-display text-[17px] text-ink">{application.athlete?.name ?? 'Athlete'}</Text>
          <Text className="font-sans mt-1 text-[11px] text-slate">
            {application.athlete?.position ?? 'Position unavailable'} · Applied to {team?.name ?? 'Unknown team'}
          </Text>
        </View>
        <View className="rounded-full bg-primary-soft px-2.5 py-1">
          <Text className="font-stat text-[10px] tracking-eyebrow text-primary">
            {STATUS_LABELS[application.status].toUpperCase()}
          </Text>
        </View>
      </View>
      <View className="mt-4 rounded-md bg-bg p-3">
        <Text className="font-sans-semibold text-[12px] text-ink">{application.posting?.headline ?? 'Opportunity'}</Text>
        <Text className="font-sans mt-1 text-[11px] text-slate">
          {[team?.league, team?.location].filter(Boolean).join(' · ')}
        </Text>
        <Text className="font-sans-medium mt-2 text-[11px] text-slate">Coach: {team?.coach_name ?? 'Coach name unavailable'}</Text>
      </View>
      {application.status ===
'pending_parent_approval' ? (
  <View className="mt-4 rounded-btn border border-partial bg-partial-soft px-4 py-3.5">
    <Text className="font-sans-semibold text-[10px] tracking-eyebrow text-partial">
      APPLICATION STATUS
    </Text>

    <View className="mt-1 flex-row items-center justify-between">
      <Text className="font-sans-bold text-[14px] text-partial">
        Pending Parent Approval
      </Text>

      <Text className="font-sans text-[11px] text-partial">
        Locked
      </Text>
    </View>

    <Text className="font-sans mt-1.5 text-[10px] leading-[15px] text-partial">
      The parent must approve this application before its status can
      be changed.
    </Text>
  </View>
) : (
  <View className="mt-4">
    <Text className="font-sans-semibold mb-2 text-[10px] tracking-eyebrow text-slate">
      APPLICATION STATUS
    </Text>

    <Button
      label={`Status: ${
        STATUS_LABELS[application.status]
      }`}
      icon="chevron-down"
      iconTrailing
      variant="secondary"
      size="lg"
      disabled={busy}
      onPress={onChooseStatus}
    />
  </View>
)}
    </Card>
  );
}
