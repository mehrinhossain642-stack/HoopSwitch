import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppHeader } from '../../../components/AppHeader';
import { Screen } from '../../../components/Screen';
import { InlineError } from '../../../components/ScreenState';
import { listConnections, type ApiConnection } from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { errorMessage } from '../../../lib/useApi';

type FilterType = 'all' | 'pending' | 'approved' | 'declined';

const ACCENT = '#F45B2A';

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

function statusColors(status: string) {
  switch (status) {
    case 'pending_parent_approval':
      return {
        background: '#FFF4E8',
        border: '#FFD7B8',
        text: '#E36D18',
      };

    case 'under_review':
    case 'shared_with_coach':
      return {
        background: '#EAF4FF',
        border: '#CDE3FF',
        text: '#3477C4',
      };

    case 'coach_interested':
    case 'tryout_offered':
    case 'confirmed':
      return {
        background: '#EBF8F0',
        border: '#CFEAD9',
        text: '#2E8556',
      };

    case 'declined':
    case 'not_selected':
      return {
        background: '#FFF0F0',
        border: '#FFD1D1',
        text: '#D84C4C',
      };

    default:
      return {
        background: '#F4F5F6',
        border: '#E3E5E8',
        text: '#667085',
      };
  }
}

function matchesFilter(
  application: ApiConnection,
  filter: FilterType
) {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'pending') {
    return [
      'pending_parent_approval',
      'under_review',
      'shared_with_coach',
      'coach_interested',
      'tryout_offered',
    ].includes(application.status);
  }

  if (filter === 'approved') {
    return application.status === 'confirmed';
  }

  if (filter === 'declined') {
    return [
      'declined',
      'not_selected',
      'closed',
    ].includes(application.status);
  }

  return true;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function teamInitials(name?: string | null) {
  if (!name) return 'HS';

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

export default function ParentApplications() {
    const router = useRouter();
  const { requireToken } = useSession();

  const [applications, setApplications] = useState<ApiConnection[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      setLoading(true);
      setError('');

      const result = await listConnections(requireToken());

      setApplications(
        result.connections.filter(
          (connection) =>
            connection.initiated_by === 'player' ||
            connection.initiated_by === 'parent'
        )
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const filteredApplications = useMemo(() => {
    return applications.filter((application) =>
      matchesFilter(application, filter)
    );
  }, [applications, filter]);

  const filters: {
    key: FilterType;
    label: string;
  }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'declined', label: 'Declined' },
  ];

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
            maxWidth: 560,
            alignSelf: 'center',
            paddingHorizontal: 20,
            paddingTop: 28,
          }}
        >
          {/* TITLE */}
          <Text
            className="font-display text-ink"
            style={{
              fontSize: 29,
              lineHeight: 34,
            }}
          >
            My Applications
          </Text>

          {/* FILTERS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{
              marginTop: 20,
            }}
            contentContainerStyle={{
              paddingRight: 12,
            }}
          >
            {filters.map((item) => {
              const active = filter === item.key;

              return (
                <Pressable
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  style={{
                    minWidth: 72,
                    height: 38,
                    paddingHorizontal: 16,
                    marginRight: 9,
                    borderRadius: 11,
                    borderWidth: 1,
                    borderColor: active ? ACCENT : '#E3E5E8',
                    backgroundColor: active ? ACCENT : '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    className="font-sans-semibold"
                    style={{
                      fontSize: 13,
                      color: active ? '#FFFFFF' : '#303238',
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ERROR */}
          {error ? (
            <View style={{ marginTop: 22 }}>
              <InlineError message={error} />
            </View>
          ) : null}

          {/* LOADING */}
          {loading ? (
            <View
              style={{
                paddingVertical: 80,
                alignItems: 'center',
              }}
            >
              <Text className="font-sans text-[14px] text-slate">
                Loading applications...
              </Text>
            </View>
          ) : null}

          {/* EMPTY STATE */}
          {!loading && filteredApplications.length === 0 ? (
            <View
              style={{
                marginTop: 28,
                paddingVertical: 52,
                paddingHorizontal: 24,
                alignItems: 'center',
                borderRadius: 15,
                borderWidth: 1,
                borderColor: '#E5E7EA',
                backgroundColor: '#FFFFFF',
              }}
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFF2EC',
                }}
              >
                <Ionicons
                  name="document-text-outline"
                  size={25}
                  color={ACCENT}
                />
              </View>

              <Text
                className="font-display text-ink"
                style={{
                  fontSize: 19,
                  marginTop: 15,
                }}
              >
                No applications
              </Text>

              <Text
                className="font-sans text-slate"
                style={{
                  fontSize: 13,
                  marginTop: 6,
                  textAlign: 'center',
                }}
              >
                There are no applications in this category.
              </Text>
            </View>
          ) : null}

          {/* APPLICATION CARDS */}
          {!loading && filteredApplications.length > 0 ? (
            <View style={{ marginTop: 24 }}>
              {filteredApplications.map((application) => {
                const posting = application.posting;
                const team = posting?.team;

                const teamName =
                  team?.name ??
                  posting?.headline ??
                  'Basketball Team';

                const colors = statusColors(application.status);

                return (
                  <Pressable
                    key={application.id}
                    onPress={() => {
                      router.push(`/parent/application/${application.id}` as any)
                    }}
                    style={({ pressed }) => ({
                      minHeight: 124,
                      marginBottom: 14,
                      paddingHorizontal: 18,
                      paddingVertical: 18,

                      borderRadius: 14,
                      borderWidth: 1,

                      borderColor: pressed
                        ? '#D9DBDE'
                        : '#E4E6E8',

                      backgroundColor: pressed
                        ? '#FAFAFA'
                        : '#FFFFFF',

                      flexDirection: 'row',
                      alignItems: 'center',

                      shadowColor: '#000',
                      shadowOpacity: 0.025,
                      shadowRadius: 6,
                      shadowOffset: {
                        width: 0,
                        height: 2,
                      },
                    })}
                  >
                    {/* TEAM LOGO */}
                    {team?.logo_url ? (
                      <Image
                        source={{
                          uri: team.logo_url,
                        }}
                        style={{
                          width: 66,
                          height: 66,
                          borderRadius: 18,
                          marginRight: 18,
                          backgroundColor: '#F4F5F6',
                        }}
                        resizeMode="contain"
                      />
                    ) : (
                      <View
                        style={{
                          width: 66,
                          height: 66,
                          borderRadius: 18,
                          marginRight: 18,

                          alignItems: 'center',
                          justifyContent: 'center',

                          backgroundColor: '#F5F6F7',
                          borderWidth: 1,
                          borderColor: '#E4E6E8',
                        }}
                      >
                        <Text
                          className="font-display"
                          style={{
                            fontSize: 17,
                            color: '#292B2F',
                          }}
                        >
                          {teamInitials(teamName)}
                        </Text>
                      </View>
                    )}

                    {/* INFO */}
                    <View
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        className="font-sans-semibold text-ink"
                        numberOfLines={1}
                        style={{
                          fontSize: 16,
                          lineHeight: 20,
                        }}
                      >
                        {teamName}
                      </Text>

                      <Text
                        className="font-sans text-slate"
                        style={{
                          marginTop: 5,
                          fontSize: 12.5,
                        }}
                      >
                        Tryouts · {formatDate(application.created_at)}
                      </Text>

                      <View
                        style={{
                          alignSelf: 'flex-start',
                          marginTop: 9,
                          paddingHorizontal: 9,
                          paddingVertical: 4,

                          borderRadius: 6,
                          borderWidth: 1,

                          borderColor: colors.border,
                          backgroundColor: colors.background,
                        }}
                      >
                        <Text
                          className="font-sans-semibold"
                          style={{
                            fontSize: 11,
                            color: colors.text,
                          }}
                        >
                          {statusLabel(application.status)}
                        </Text>
                      </View>
                    </View>

                    {/* CHEVRON */}
                    <View
                      style={{
                        width: 30,
                        height: 40,
                        marginLeft: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#8C9299"
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}