import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { Screen } from '../../../components/Screen';
import { InlineError } from '../../../components/ScreenState';

import {
  listConnections,
  reviewParentApplication,
  type ApiConnection,
} from '../../../lib/api';

import { useSession } from '../../../lib/session';
import { errorMessage } from '../../../lib/useApi';

const ACCENT = '#F45B2A';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusLabel(status: string) {
  switch (status) {
    case 'pending_parent_approval':
      return 'Pending Approval';

    case 'under_review':
      return 'Under Review';

    case 'shared_with_coach':
      return 'Shared With Coach';

    case 'coach_interested':
      return 'Coach Interested';

    case 'tryout_offered':
      return 'Tryout Offered';

    case 'confirmed':
      return 'Approved';

    case 'declined':
      return 'Declined';

    case 'not_selected':
      return 'Not Selected';

    case 'closed':
      return 'Closed';

    default:
      return status;
  }
}

export default function ParentApplicationDetail() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{ id: string }>();

  const { requireToken } = useSession();

  const [application, setApplication] =
    useState<ApiConnection | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadApplication();
  }, [id]);

  async function loadApplication() {
    try {
      setLoading(true);
      setError('');

      const result =
        await listConnections(requireToken());

      const found = result.connections.find(
        (connection) =>
          connection.id === Number(id)
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
  }

  async function approveApplication() {
    if (!application) return;

    try {
      setSubmitting(true);
      setError('');

      const updated =
        await reviewParentApplication(
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

              const updated =
                await reviewParentApplication(
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
    application.status ===
    'pending_parent_approval';

  return (
    <Screen edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 60,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 620,
            alignSelf: 'center',
            paddingHorizontal: 24,
            paddingTop: 30,
          }}
        >
          {/* BACK */}
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#E4E6E8',
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 22,
            }}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color="#202226"
            />
          </Pressable>

          <Text
            className="font-display text-ink"
            style={{
              fontSize: 29,
            }}
          >
            Review Application
          </Text>

          <Text
            className="font-sans text-slate"
            style={{
              marginTop: 5,
              fontSize: 14,
            }}
          >
            Review the opportunity before approving
            your athlete&apos;s application.
          </Text>

          {error ? (
            <View style={{ marginTop: 20 }}>
              <InlineError message={error} />
            </View>
          ) : null}

          {/* TEAM / OPPORTUNITY */}
          <View
            style={{
              marginTop: 28,
              padding: 22,
              borderWidth: 1,
              borderColor: '#E4E6E8',
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  backgroundColor: '#F2F3F4',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <Ionicons
                  name="basketball-outline"
                  size={29}
                  color="#333"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  className="font-sans-semibold text-ink"
                  style={{
                    fontSize: 19,
                  }}
                >
                  {team?.name ??
                    'Basketball Team'}
                </Text>

                {team?.location ? (
                  <Text
                    className="font-sans text-slate"
                    style={{
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    {team.location}
                  </Text>
                ) : null}

                <View
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: 9,
                    borderRadius: 7,
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    backgroundColor: '#FFF3E8',
                    borderWidth: 1,
                    borderColor: '#FFD7B8',
                  }}
                >
                  <Text
                    className="font-sans-semibold"
                    style={{
                      color: '#E36D18',
                      fontSize: 11,
                    }}
                  >
                    {statusLabel(
                      application.status
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* POSTING DETAILS */}
          <View
            style={{
              marginTop: 16,
              padding: 22,
              borderWidth: 1,
              borderColor: '#E4E6E8',
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
            }}
          >
            <Text
              className="font-display text-ink"
              style={{
                fontSize: 19,
              }}
            >
              Opportunity Overview
            </Text>

            <View style={{ marginTop: 18 }}>
              <Text
                className="font-sans text-slate"
                style={{
                  fontSize: 11,
                }}
              >
                OPPORTUNITY
              </Text>

              <Text
                className="font-sans-semibold text-ink"
                style={{
                  fontSize: 15,
                  marginTop: 4,
                }}
              >
                {posting?.headline ??
                  'Basketball Opportunity'}
              </Text>
            </View>

            {posting?.position ? (
              <View style={{ marginTop: 18 }}>
                <Text
                  className="font-sans text-slate"
                  style={{ fontSize: 11 }}
                >
                  POSITION
                </Text>

                <Text
                  className="font-sans-semibold text-ink"
                  style={{
                    marginTop: 4,
                    fontSize: 14,
                  }}
                >
                  {posting.position}
                </Text>
              </View>
            ) : null}

            {posting?.expected_minutes ? (
              <View style={{ marginTop: 18 }}>
                <Text
                  className="font-sans text-slate"
                  style={{ fontSize: 11 }}
                >
                  EXPECTED MINUTES
                </Text>

                <Text
                  className="font-sans-semibold text-ink"
                  style={{
                    marginTop: 4,
                    fontSize: 14,
                  }}
                >
                  {posting.expected_minutes} minutes
                </Text>
              </View>
            ) : null}

            {posting?.notes ? (
              <View style={{ marginTop: 18 }}>
                <Text
                  className="font-sans text-slate"
                  style={{ fontSize: 11 }}
                >
                  DETAILS
                </Text>

                <Text
                  className="font-sans text-ink"
                  style={{
                    marginTop: 5,
                    fontSize: 13,
                    lineHeight: 20,
                  }}
                >
                  {posting.notes}
                </Text>
              </View>
            ) : null}
          </View>

          {/* ATHLETE */}
          <View
            style={{
              marginTop: 16,
              padding: 22,
              borderWidth: 1,
              borderColor: '#E4E6E8',
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
            }}
          >
            <Text
              className="font-display text-ink"
              style={{
                fontSize: 19,
              }}
            >
              Athlete
            </Text>

            <Text
              className="font-sans-semibold text-ink"
              style={{
                fontSize: 15,
                marginTop: 14,
              }}
            >
              {athlete?.name ?? 'Athlete'}
            </Text>

            {athlete?.position ? (
              <Text
                className="font-sans text-slate"
                style={{
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                {athlete.position}
              </Text>
            ) : null}

            <Text
              className="font-sans text-slate"
              style={{
                fontSize: 12,
                marginTop: 12,
              }}
            >
              Applied {formatDate(application.created_at)}
            </Text>
          </View>

          {/* APPROVAL */}
          {needsApproval ? (
            <View
              style={{
                marginTop: 20,
                padding: 22,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#FFD9C9',
                backgroundColor: '#FFF9F6',
              }}
            >
              <Text
                className="font-sans-semibold text-ink"
                style={{
                  fontSize: 17,
                }}
              >
                Your approval is required
              </Text>

              <Text
                className="font-sans text-slate"
                style={{
                  marginTop: 7,
                  fontSize: 13,
                  lineHeight: 20,
                }}
              >
                By approving, you allow this
                application to move forward to
                HoopSwitch for review.
              </Text>

              <Pressable
                disabled={submitting}
                onPress={approveApplication}
                style={{
                  marginTop: 20,
                  height: 50,
                  borderRadius: 12,
                  backgroundColor: ACCENT,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                <Text
                  className="font-sans-semibold"
                  style={{
                    color: '#FFFFFF',
                    fontSize: 14,
                  }}
                >
                  {submitting
                    ? 'Processing...'
                    : 'Approve Application'}
                </Text>
              </Pressable>

              <Pressable
                disabled={submitting}
                onPress={declineApplication}
                style={{
                  marginTop: 10,
                  height: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E3E5E8',
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  className="font-sans-semibold"
                  style={{
                    color: '#C94C4C',
                    fontSize: 14,
                  }}
                >
                  Decline
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={{
                marginTop: 20,
                padding: 20,
                borderRadius: 15,
                backgroundColor: '#EEF7FF',
                borderWidth: 1,
                borderColor: '#D8EAFE',
              }}
            >
              <Text
                className="font-sans-semibold text-ink"
                style={{ fontSize: 14 }}
              >
                {statusLabel(application.status)}
              </Text>

              <Text
                className="font-sans text-slate"
                style={{
                  marginTop: 5,
                  fontSize: 12.5,
                }}
              >
                No action is currently required
                from you.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}