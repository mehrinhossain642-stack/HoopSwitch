import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader } from '../../../components/AppHeader';
import { Button } from '../../../components/Button';
import { InlineError } from '../../../components/ScreenState';
import { Screen } from '../../../components/Screen';

import {
  getParentAthletes,
  listConnections,
  type ApiConnection,
  type LinkedAthlete,
} from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { errorMessage } from '../../../lib/useApi';

const ACCENT = '#F45B2A';

function firstName(name?: string | null) {
  if (!name) return 'there';
  return name.trim().split(/\s+/)[0] ?? 'there';
}

function statusActivityText(application: ApiConnection) {
  const athleteName = application.athlete?.name ?? 'Your athlete';
  const teamName =
    application.posting?.team?.name ??
    application.posting?.headline ??
    'a basketball opportunity';

  switch (application.status) {
    case 'pending_parent_approval':
      return `${athleteName} applied to ${teamName}`;

    case 'under_review':
      return `${athleteName}'s application is under review`;

    case 'shared_with_coach':
      return `${athleteName}'s application was shared with ${teamName}`;

    case 'coach_interested':
      return `${teamName} is interested in ${athleteName}`;

    case 'tryout_offered':
      return `Tryout offered by ${teamName}`;

    case 'confirmed':
      return `${athleteName}'s application was approved`;

    case 'declined':
      return `${athleteName}'s application was declined`;

    case 'not_selected':
      return `${athleteName} was not selected by ${teamName}`;

    case 'closed':
      return `Application to ${teamName} was closed`;

    default:
      return `Application updated for ${athleteName}`;
  }
}

function activityIcon(status: string) {
  switch (status) {
    case 'pending_parent_approval':
      return 'document-text-outline';

    case 'under_review':
    case 'shared_with_coach':
      return 'time-outline';

    case 'coach_interested':
      return 'heart-outline';

    case 'tryout_offered':
      return 'location-outline';

    case 'confirmed':
      return 'checkmark-circle-outline';

    case 'declined':
    case 'not_selected':
      return 'close-circle-outline';

    default:
      return 'notifications-outline';
  }
}

function formatApplicationDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ParentHome() {
  const { requireToken } = useSession();

  const [athletes, setAthletes] = useState<LinkedAthlete[]>([]);
  const [applications, setApplications] = useState<ApiConnection[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
  useCallback(() => {
    loadDashboard();
  }, [])
);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError('');

      const token = requireToken();

      const [athleteResult, connectionResult] = await Promise.all([
        getParentAthletes(token),
        listConnections(token),
      ]);

      setAthletes(athleteResult);

      setApplications(
        connectionResult.connections
          .filter(
            (connection) =>
              connection.initiated_by === 'player' ||
              connection.initiated_by === 'parent'
          )
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const pendingActions = useMemo(
    () =>
      applications.filter(
        (application) =>
          application.status === 'pending_parent_approval'
      ),
    [applications]
  );

  const recentActivity = useMemo(
    () => applications.slice(0, 5),
    [applications]
  );

  const athlete = athletes[0];

  return (
    <Screen edges={[]}>
      <AppHeader brand meta="Parent" />

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
          {error ? (
            <View style={{ marginBottom: 20 }}>
              <InlineError message={error} />
            </View>
          ) : null}

          {loading ? (
            <View
              style={{
                paddingVertical: 100,
                alignItems: 'center',
              }}
            >
              <Text className="font-sans text-[14px] text-slate">
                Loading dashboard...
              </Text>
            </View>
          ) : athletes.length === 0 ? (
            <View className="items-center py-20">
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: '#FFF1EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="people-outline"
                  size={28}
                  color={ACCENT}
                />
              </View>

              <Text className="font-display mt-5 text-[24px] text-ink">
                No athlete linked yet
              </Text>

              <Text className="font-sans mt-3 max-w-sm text-center text-[14px] leading-[21px] text-slate">
                Link your athlete to view their applications,
                opportunities, and activity.
              </Text>

              <View className="mt-7 w-full max-w-sm">
                <Button
                  label="Link Athlete"
                  size="lg"
                  onPress={() =>
                    router.push('/parent/link-athlete')
                  }
                />
              </View>
            </View>
          ) : (
            <>
              {/* GREETING */}
              <Text
                className="font-display text-ink"
                style={{
                  fontSize: 29,
                  lineHeight: 35,
                }}
              >
                Good morning!
              </Text>

              <Text
                className="font-sans text-slate"
                style={{
                  marginTop: 5,
                  fontSize: 14,
                }}
              >
                Here&apos;s what&apos;s happening with your athletes.
              </Text>

              {/* PENDING ACTIONS */}
              {pendingActions.length > 0 ? (
                <View
                  style={{
                    marginTop: 28,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#E5E7EA',
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      minHeight: 52,
                      paddingHorizontal: 18,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottomWidth: 1,
                      borderBottomColor: '#ECEDEF',
                    }}
                  >
                    <Text
                      className="font-sans-semibold"
                      style={{
                        fontSize: 15,
                        color: ACCENT,
                      }}
                    >
                      Pending Actions
                    </Text>

                    <View
                      style={{
                        minWidth: 24,
                        height: 24,
                        paddingHorizontal: 7,
                        borderRadius: 12,
                        backgroundColor: ACCENT,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        className="font-sans-semibold"
                        style={{
                          fontSize: 12,
                          color: '#FFFFFF',
                        }}
                      >
                        {pendingActions.length}
                      </Text>
                    </View>
                  </View>

                  {pendingActions.map((application, index) => (
                    <Pressable
                      key={application.id}
                      onPress={() =>
  router.push(`/parent/application/${application.id}` as any)
}
                      style={{
                        minHeight: 72,
                        paddingHorizontal: 18,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderBottomWidth:
                          index === pendingActions.length - 1 ? 0 : 1,
                        borderBottomColor: '#ECEDEF',
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#FFF3ED',
                        }}
                      >
                        <Ionicons
                          name="alert-circle-outline"
                          size={18}
                          color={ACCENT}
                        />
                      </View>

                      <View
                        style={{
                          flex: 1,
                          marginLeft: 13,
                        }}
                      >
                        <Text
                          className="font-sans-semibold text-ink"
                          style={{
                            fontSize: 13.5,
                          }}
                        >
                          Application needs your approval
                        </Text>

                        <Text
                          className="font-sans text-slate"
                          style={{
                            marginTop: 3,
                            fontSize: 12.5,
                          }}
                        >
                          for {application.athlete?.name ?? 'your athlete'}
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={19}
                        color="#8F949B"
                      />
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {/* YOUR ATHLETES */}
              <View style={{ marginTop: 30 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <Text
                    className="font-sans-semibold text-ink"
                    style={{
                      fontSize: 15,
                    }}
                  >
                    Your Athletes
                  </Text>
                  </View>

        

{athletes.slice(0, 2).map((linkedAthlete) => (
  <Pressable
    key={linkedAthlete.id}
    onPress={() =>
      router.push(`/parent/athlete/${linkedAthlete.id}` as any)
    }
    style={{
      marginBottom: 12,
      padding: 18,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: '#E5E7EA',
      backgroundColor: '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
    }}
  >
                    <View
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 27,
                        backgroundColor: '#F0F1F3',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        className="font-display"
                        style={{
                          fontSize: 16,
                          color: '#2C2E31',
                        }}
                      >
                        {linkedAthlete.name
                          ?.split(/\s+/)
                          .slice(0, 2)
                          .map((word) => word[0])
                          .join('')
                          .toUpperCase() ?? 'A'}
                      </Text>
                    </View>

                    <View
                      style={{
                        flex: 1,
                        marginLeft: 14,
                      }}
                    >
                      <Text
                        className="font-sans-semibold text-ink"
                        style={{
                          fontSize: 16,
                        }}
                      >
                        {linkedAthlete.name ?? 'Athlete'}
                      </Text>

                      <Text
                        className="font-sans text-slate"
                        style={{
                          marginTop: 4,
                          fontSize: 12.5,
                        }}
                      >
                        {linkedAthlete.position ?? 'Position not set'}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={19}
                      color="#9499A0"
                    />
                  </Pressable>
                ))}
              </View>

              {/* RECENT ACTIVITY */}
              <View style={{ marginTop: 28 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <Text
                    className="font-sans-semibold text-ink"
                    style={{
                      fontSize: 15,
                    }}
                  >
                    Recent Activity
                  </Text>
                </View>

                <View
                  style={{
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#E5E7EA',
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden',
                  }}
                >
                  {recentActivity.length === 0 ? (
                    <View
                      style={{
                        padding: 22,
                      }}
                    >
                      <Text className="font-sans text-[13px] text-slate">
                        No recent activity yet.
                      </Text>
                    </View>
                  ) : (
                    recentActivity.map((application, index) => (
                      <View
                        key={application.id}
                        style={{
                          minHeight: 72,
                          paddingHorizontal: 17,
                          flexDirection: 'row',
                          alignItems: 'center',
                          borderBottomWidth:
                            index === recentActivity.length - 1 ? 0 : 1,
                          borderBottomColor: '#ECEDEF',
                        }}
                      >
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: '#F5F6F7',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons
                            name={activityIcon(application.status) as any}
                            size={18}
                            color="#5F6670"
                          />
                        </View>

                        <View
                          style={{
                            flex: 1,
                            marginLeft: 13,
                            marginRight: 10,
                          }}
                        >
                          <Text
                            className="font-sans-semibold text-ink"
                            style={{
                              fontSize: 13.5,
                            }}
                          >
                            {application.posting?.team?.name ??
                              'Basketball Application'}
                          </Text>

                          <Text
                            className="font-sans text-slate"
                            style={{
                              marginTop: 3,
                              fontSize: 12,
                            }}
                          >
                            {statusActivityText(application)}
                          </Text>
                        </View>

                        <Text
                          className="font-sans text-slate"
                          style={{
                            fontSize: 11,
                          }}
                        >
                          {formatApplicationDate(application.created_at)}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}