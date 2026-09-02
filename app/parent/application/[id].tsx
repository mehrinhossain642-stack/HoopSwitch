import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import { InlineError } from '../../../components/ScreenState';
import { Touchable } from '../../../components/Touchable';
import {
  listConnections,
  reviewParentApplication,
  type ApiConnection,
} from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { useThemeColors } from '../../../lib/theme';
import { errorMessage } from '../../../lib/useApi';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending_parent_approval: 'Pending Approval',
    under_review: 'Under Review',
    shared_with_coach: 'Shared With Coach',
    coach_interested: 'Coach Interested',
    tryout_offered: 'Tryout Offered',
    confirmed: 'Approved',
    declined: 'Declined',
    not_selected: 'Not Selected',
    closed: 'Closed',
  };

  return labels[status] ?? status.replaceAll('_', ' ');
}

export default function ParentApplicationDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requireToken } = useSession();
  const colors = useThemeColors();

  const [application, setApplication] =
    useState<ApiConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadApplication = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const result = await listConnections(requireToken());

      const found = result.connections.find(
        (item) => item.id === Number(id)
      );

      if (!found) {
        setError('Application not found.');
        return;
      }

      setApplication(found);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, requireToken]);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  async function approveApplication() {
    if (!application) return;

    try {
      setSubmitting(true);
      setError('');

      const updated = await reviewParentApplication(
        requireToken(),
        application.id,
        'under_review'
      );

      setApplication(updated);

      Alert.alert(
        'Application Approved',
        'The application has been approved and sent to HoopSwitch for review.',
        [
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function declineApplication() {
    if (!application) return;

    Alert.alert(
      'Decline Application?',
      'This will stop the application from moving forward.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              setError('');

              const updated = await reviewParentApplication(
                requireToken(),
                application.id,
                'declined'
              );

              setApplication(updated);
              router.back();
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <Screen edges={[]}>
        <View className="flex-1 items-center justify-center">
          <Text className="font-sans text-[14px] text-slate">
            Loading application...
          </Text>
        </View>
      </Screen>
    );
  }

  if (error && !application) {
    return (
      <Screen edges={[]}>
        <View className="px-6 pt-10">
          <InlineError message={error} />
        </View>
      </Screen>
    );
  }

  if (!application) {
    return null;
  }

  const posting = application.posting;
  const team = posting?.team;
  const athlete = application.athlete;

  const needsApproval =
    application.status === 'pending_parent_approval';

  return (
    <Screen edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 60,
        }}
      >
        <View className="w-full max-w-[620px] self-center px-6 pt-8">
          <Touchable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="mb-6 h-10 w-10 items-center justify-center rounded-full border border-border bg-surface"
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={colors.ink}
            />
          </Touchable>

          <Text className="font-display text-[29px] text-ink">
            Review Application
          </Text>

          <Text className="font-sans mt-1 text-[14px] text-slate">
            Review the opportunity before approving your athlete&apos;s
            application.
          </Text>

          {error ? (
            <View className="mt-5">
              <InlineError message={error} />
            </View>
          ) : null}

          <Card bare className="mt-7">
            <View className="flex-row items-center p-5">
              <View className="mr-4 h-16 w-16 items-center justify-center rounded-2xl bg-mist">
                <Ionicons
                  name="basketball-outline"
                  size={29}
                  color={colors.ink}
                />
              </View>

              <View className="flex-1">
                <Text className="font-sans-semibold text-[19px] text-ink">
                  {team?.name ?? 'Basketball Team'}
                </Text>

                {team?.location ? (
                  <Text className="font-sans mt-1 text-[13px] text-slate">
                    {team.location}
                  </Text>
                ) : null}

                <View
                  className="mt-2 self-start rounded-md border px-2.5 py-1"
                  style={{
                    backgroundColor: colors.partialSoft,
                    borderColor: colors.partial,
                  }}
                >
                  <Text
                    className="font-sans-semibold text-[11px]"
                    style={{
                      color: colors.partial,
                    }}
                  >
                    {statusLabel(application.status)}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          <Card className="mt-4">
            <Text className="font-display text-[19px] text-ink">
              Opportunity Overview
            </Text>

            <Detail
              label="Opportunity"
              value={
                posting?.headline ?? 'Basketball Opportunity'
              }
            />

            {posting?.position ? (
              <Detail
                label="Position"
                value={posting.position}
              />
            ) : null}

            {posting?.expected_minutes ? (
              <Detail
                label="Expected minutes"
                value={`${posting.expected_minutes} minutes`}
              />
            ) : null}

            {posting?.notes ? (
              <Detail
                label="Details"
                value={posting.notes}
                multiline
              />
            ) : null}
          </Card>

          <Card className="mt-4">
            <Text className="font-display text-[19px] text-ink">
              Athlete
            </Text>

            <Text className="font-sans-semibold mt-4 text-[15px] text-ink">
              {athlete?.name ?? 'Athlete'}
            </Text>

            {athlete?.position ? (
              <Text className="font-sans mt-1 text-[13px] text-slate">
                {athlete.position}
              </Text>
            ) : null}

            <Text className="font-sans mt-3 text-[12px] text-slate">
              Applied {formatDate(application.created_at)}
            </Text>
          </Card>

          {needsApproval ? (
            <Card className="mt-5">
              <Text className="font-sans-semibold text-[17px] text-ink">
                Your approval is required
              </Text>

              <Text className="font-sans mt-2 text-[13px] leading-5 text-slate">
                By approving, you allow this application to move
                forward to HoopSwitch for review.
              </Text>

              <View className="mt-5">
                <Button
                  label="Approve Application"
                  loading={submitting}
                  onPress={approveApplication}
                />
              </View>

              <View className="mt-2">
                <Button
                  label="Decline"
                  variant="danger"
                  disabled={submitting}
                  onPress={declineApplication}
                />
              </View>
            </Card>
          ) : (
            <Card className="mt-5">
              <Text className="font-sans-semibold text-[14px] text-ink">
                {statusLabel(application.status)}
              </Text>

              <Text className="font-sans mt-1 text-[13px] text-slate">
                No action is currently required from you.
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Detail({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View className="mt-5">
      <Text className="font-stat text-[11px] uppercase tracking-eyebrow text-slate">
        {label}
      </Text>

      <Text
        className={`font-sans mt-1 text-ink ${
          multiline
            ? 'text-[13px] leading-5'
            : 'font-sans-semibold text-[14px]'
        }`}
      >
        {value}
      </Text>
    </View>
  );
}