import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { AppHeader } from '../../../components/AppHeader';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { Screen, useContentContainerStyle } from '../../../components/Screen';
import { EmptyState, InlineError, ScreenError } from '../../../components/ScreenState';
import { SectionTitle } from '../../../components/SectionTitle';
import { Sheet, SheetRow } from '../../../components/Sheet';
import { FeedSkeleton } from '../../../components/Skeleton';
import { TextField } from '../../../components/TextField';
import { Touchable } from '../../../components/Touchable';
import * as api from '../../../lib/api';
import type { AdminTeam } from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { useThemeColors } from '../../../lib/theme';
import { errorMessage, useApiData } from '../../../lib/useApi';

/**
 * Team administration: create a team, then attach a coach.
 *
 * A team can exist with no coach — that's the whole point of admin-created teams,
 * and why `teams.user_id` is nullable. The API refuses to move a coach who already
 * runs another team rather than silently reassigning them.
 */
export default function AdminTeams() {
  const { requireToken, token } = useSession();
  const colors = useThemeColors();
  const contentStyle = useContentContainerStyle({ measure: 'wide', paddingTop: 18 });

  const data = useApiData(() => api.listAdminTeams(requireToken()), [token]);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [league, setLeague] = useState('');
  const [location, setLocation] = useState('');
  const [assigning, setAssigning] = useState<AdminTeam | null>(null);
  const [unassigning, setUnassigning] = useState<AdminTeam | null>(null);
  const [manualEmail, setManualEmail] = useState('');

  const createTeam = useCallback(async () => {
    if (!name.trim()) {
      setError('A team needs a name.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await api.createAdminTeam(requireToken(), {
        name: name.trim(),
        league: league.trim() || undefined,
        location: location.trim() || undefined,
      });
      setName('');
      setLeague('');
      setLocation('');
      setCreating(false);
      data.refetch();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }, [name, league, location, requireToken, data]);

  const assign = useCallback(
    async (team: AdminTeam, email: string) => {
      setError(null);
      setBusy(true);
      try {
        await api.assignCoach(requireToken(), team.id, email);
        setAssigning(null);
        setManualEmail('');
        data.refetch();
      } catch (caught) {
        setError(errorMessage(caught));
        setAssigning(null);
      } finally {
        setBusy(false);
      }
    },
    [requireToken, data]
  );

  const unassign = useCallback(
    async (team: AdminTeam) => {
      setError(null);
      setBusy(true);
      try {
        await api.unassignCoach(requireToken(), team.id);
        setUnassigning(null);
        data.refetch();
      } catch (caught) {
        setError(errorMessage(caught));
        setUnassigning(null);
      } finally {
        setBusy(false);
      }
    },
    [requireToken, data]
  );

  if (data.error && !data.data) {
    return <ScreenError message={data.error} onRetry={data.refetch} />;
  }

  const teams = data.data?.teams ?? [];
  const available = data.data?.unassigned_coaches ?? [];
  const loadingFirst = data.loading && !data.data;
  const unassignedTeams = teams.filter((t) => !t.coach_assigned).length;

  return (
    <Screen edges={[]}>
      <AppHeader
        title="Teams"
        eyebrow="Admin"
        meta={
          loadingFirst
            ? 'Loading'
            : `${teams.length} teams · ${unassignedTeams} without a coach`
        }
      />

      <ScrollView
        contentContainerStyle={contentStyle}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={data.loading}
            onRefresh={data.refetch}
            tintColor={colors.primary}
          />
        }>
        {error ? <InlineError message={error} /> : null}

        {/* ---- Create ---- */}
        {creating ? (
          <Card className="mb-5">
            <SectionTitle title="New team" className="mb-3" />
            <TextField
              label="Name"
              required
              value={name}
              onChangeText={setName}
              placeholder="Brock Badgers"
              icon="shield-outline"
              autoCapitalize="words"
            />
            <TextField
              label="League"
              optional
              value={league}
              onChangeText={setLeague}
              placeholder="U SPORTS · OUA"
              icon="trophy-outline"
            />
            <TextField
              label="Location"
              optional
              value={location}
              onChangeText={setLocation}
              placeholder="St. Catharines, ON"
              icon="location-outline"
              helper="Filling these in matters — players filter the feed by league and province."
            />
            <View className="flex-row">
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setCreating(false)}
                fullWidth={false}
                className="mr-2 flex-1"
              />
              <Button
                label="Create team"
                loading={busy}
                onPress={createTeam}
                fullWidth={false}
                className="flex-1"
              />
            </View>
          </Card>
        ) : (
          <Button
            label="Create a team"
            icon="add"
            onPress={() => setCreating(true)}
            className="mb-5"
          />
        )}

        {/* ---- Teams ---- */}
        {loadingFirst ? (
          <FeedSkeleton count={2} />
        ) : teams.length === 0 ? (
          <EmptyState
            icon="shield-outline"
            title="No teams yet"
            body="Create a team, then assign a coach to it."
          />
        ) : (
          teams.map((team) => (
            <Card bare key={team.id} className="mb-3">
              <View className="p-4">
                <View className="flex-row items-start">
                  <View className="flex-1 pr-2">
                    <Text className="font-display text-[16px] text-ink">{team.name}</Text>
                    <Text className="font-sans mt-0.5 text-[11px] text-slate">
                      {[team.league, team.location].filter(Boolean).join(' · ') ||
                        'No league or location set'}
                    </Text>
                  </View>
                  {/* Admins need the ID to upload a game on a team's behalf. */}
                  <View className="rounded-full bg-mist px-2 py-1">
                    <Text className="font-stat text-[12px] tracking-stat text-slate">
                      ID {team.id}
                    </Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center">
                  <Ionicons
                    name={team.coach_assigned ? 'person-circle' : 'person-add-outline'}
                    size={16}
                    color={team.coach_assigned ? colors.good : colors.partial}
                  />
                  <Text className="font-sans ml-2 flex-1 text-[12px] text-ink" numberOfLines={1}>
                    {team.coach_email ?? 'No coach assigned'}
                  </Text>
                  {team.pending_games > 0 ? (
                    <View className="rounded-full bg-partial-soft px-2 py-0.5">
                      <Text className="font-stat text-[11px] tracking-eyebrow text-partial">
                        {team.pending_games} PENDING
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View className="flex-row border-t border-border bg-bg px-4 py-3">
                {team.coach_assigned ? (
                  <Button
                    label="Remove coach"
                    variant="secondary"
                    size="sm"
                    onPress={() => setUnassigning(team)}
                    fullWidth={false}
                  />
                ) : (
                  <Button
                    label="Assign a coach"
                    size="sm"
                    icon="person-add-outline"
                    onPress={() => setAssigning(team)}
                    fullWidth={false}
                  />
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* ---- Assign sheet ---- */}
      <Sheet
        visible={assigning !== null}
        onClose={() => setAssigning(null)}
        title={`Assign a coach to ${assigning?.name ?? ''}`}
        subtitle="Only coach accounts without a team of their own are listed.">
        <ScrollView>
          {available.length === 0 ? (
            <View className="px-5 py-5">
              <Text className="font-sans text-[13px] leading-[19px] text-slate">
                Every coach account already runs a team. Enter an email below to try anyway — the
                request is refused rather than moving them silently.
              </Text>
            </View>
          ) : (
            available.map((coach, index) => (
              <SheetRow
                key={coach.id}
                last={index === available.length - 1}
                accessibilityLabel={`Assign ${coach.email}`}
                onPress={() => assigning && assign(assigning, coach.email)}>
                <Text className="font-sans-semibold text-[14px] text-ink">{coach.email}</Text>
              </SheetRow>
            ))
          )}

          <View className="px-5 pb-5 pt-4">
            <TextField
              label="Or enter a coach's email"
              value={manualEmail}
              onChangeText={setManualEmail}
              placeholder="coach@example.com"
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              label="Assign"
              loading={busy}
              disabled={manualEmail.trim().length === 0}
              onPress={() => assigning && assign(assigning, manualEmail.trim().toLowerCase())}
            />
          </View>
        </ScrollView>
      </Sheet>

      <ConfirmDialog
        visible={unassigning !== null}
        icon="person-remove-outline"
        destructive
        busy={busy}
        title="Remove this coach?"
        body={
          unassigning
            ? `${unassigning.coach_email} loses access to ${unassigning.name}. The team, its ` +
              `roster slots and its games all stay.`
            : ''
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={() => unassigning && unassign(unassigning)}
        onCancel={() => setUnassigning(null)}
      />
    </Screen>
  );
}
