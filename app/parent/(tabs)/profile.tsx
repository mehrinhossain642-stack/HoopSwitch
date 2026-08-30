import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader } from '../../../components/AppHeader';
import { Screen } from '../../../components/Screen';
import { InlineError } from '../../../components/ScreenState';

import {
  getParentAthletes,
  getParentProfile,
  type ApiUser,
  type LinkedAthlete,
} from '../../../lib/api';

import { useSession } from '../../../lib/session';
import { errorMessage } from '../../../lib/useApi';

const ACCENT = '#F45B2A';

export default function ParentProfile() {
  const { requireToken, signOut } = useSession();
  const [parent, setParent] = useState<ApiUser | null>(null);

  const [athletes, setAthletes] = useState<LinkedAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
  useCallback(() => {
    loadProfile();
  }, [])
);

  async function loadProfile() {
  try {
    setLoading(true);
    setError('');

    const [parentResult, athleteResult] = await Promise.all([
      getParentProfile(requireToken()),
      getParentAthletes(requireToken()),
    ]);

    setParent(parentResult);
    setAthletes(athleteResult);
  } catch (err) {
    setError(errorMessage(err));
  } finally {
    setLoading(false);
  }
}

  async function handleSignOut() {
    await signOut();
    router.replace('/auth/welcome');
  }

  const athlete = athletes[0];
  const parentInitials =
  parent?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() ?? 'P';

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
          <Text
            className="font-display text-ink"
            style={{
              fontSize: 29,
              lineHeight: 34,
            }}
          >
            Profile
          </Text>

          <Text
            className="font-sans text-slate"
            style={{
              marginTop: 5,
              fontSize: 14,
            }}
          >
            Manage your parent account and linked athlete.
          </Text>

          {error ? (
            <View style={{ marginTop: 20 }}>
              <InlineError message={error} />
            </View>
          ) : null}

          {loading ? (
            <View
              style={{
                paddingVertical: 90,
                alignItems: 'center',
              }}
            >
              <Text className="font-sans text-[14px] text-slate">
                Loading profile...
              </Text>
            </View>
     ) : (
       <>
    {/* ACCOUNT */}
<Text
  className="font-sans-semibold text-ink"
  style={{
    marginTop: 30,
    marginBottom: 11,
    fontSize: 15,
  }}
>
  Account
</Text>

<Pressable
  onPress={() => router.push('/parent/settings')}
  style={{
    borderWidth: 1,
    borderColor: '#E5E7EA',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  }}
>
  <View
    style={{
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
    }}
  >
    <View
      style={{
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#FFF1EB',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        className="font-display"
        style={{
          fontSize: 16,
          color: ACCENT,
        }}
      >
        {parentInitials}
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
        {parent?.name?.trim() || 'Add your name'}
      </Text>

      <Text
        className="font-sans text-slate"
        style={{
          marginTop: 4,
          fontSize: 12.5,
        }}
      >
        {parent?.email}
      </Text>

      <Text
        className="font-sans-semibold"
        style={{
          marginTop: 5,
          fontSize: 12,
          color: ACCENT,
        }}
      >
        Edit profile
      </Text>
    </View>

    <Ionicons
      name="chevron-forward"
      size={19}
      color="#92979E"
    />
  </View>
</Pressable>

{/* LINKED ATHLETE */}
<View
  style={{
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 11,
  }}
>
  <Text
    className="font-sans-semibold text-ink"
    style={{
      fontSize: 15,
    }}
  >
    Linked Athlete
  </Text>

  <Pressable
    onPress={() => router.push('/parent/link-athlete')}
  >
    <Text
      className="font-sans-semibold"
      style={{
        fontSize: 12,
        color: ACCENT,
      }}
    >
      Link another
    </Text>
  </Pressable>
</View>

{athlete ? (
  <Pressable
    onPress={() =>
      router.push(`/parent/athlete/${athlete.id}` as any)
    }
    style={({ pressed }) => ({
      padding: 18,
      borderWidth: 1,
      borderColor: '#E5E7EA',
      borderRadius: 16,
      backgroundColor: pressed ? '#FAFAFA' : '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
    })}
  >
    <View
      style={{
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#F2F3F4',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        className="font-display"
        style={{
          fontSize: 16,
          color: '#2D3034',
        }}
      >
        {athlete.name
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
        {athlete.name ?? 'Athlete'}
      </Text>

      <Text
        className="font-sans text-slate"
        style={{
          marginTop: 4,
          fontSize: 12.5,
        }}
      >
        {athlete.position ?? 'Position not set'}
      </Text>

      {athlete.email ? (
        <Text
          className="font-sans text-slate"
          style={{
            marginTop: 3,
            fontSize: 12,
          }}
        >
          {athlete.email}
        </Text>
      ) : null}
    </View>

    <Ionicons
      name="chevron-forward"
      size={19}
      color="#92979E"
    />
  </Pressable>
) : (
  <Pressable
    onPress={() => router.push('/parent/link-athlete')}
    style={{
      padding: 20,
      borderWidth: 1,
      borderColor: '#E5E7EA',
      borderRadius: 16,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
    }}
  >
    <Ionicons
      name="person-add-outline"
      size={24}
      color={ACCENT}
    />

    <Text
      className="font-sans-semibold text-ink"
      style={{
        marginTop: 10,
        fontSize: 14,
      }}
    >
      Link an athlete
    </Text>
  </Pressable>
)}
{/* SETTINGS */}
<Text
  className="font-sans-semibold text-ink"
  style={{
    marginTop: 30,
    marginBottom: 11,
    fontSize: 15,
  }}
>
  Settings
</Text>

<View
  style={{
    borderWidth: 1,
    borderColor: '#E5E7EA',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  }}
>
  <Pressable
    onPress={() => router.push('/parent/settings')}
    style={{
      minHeight: 64,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
    }}
  >
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F4F5F6',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons
        name="settings-outline"
        size={18}
        color="#555B63"
      />
    </View>

    <Text
      className="font-sans-semibold text-ink"
      style={{
        flex: 1,
        marginLeft: 13,
        fontSize: 14,
      }}
    >
      Account Settings
    </Text>

    <Ionicons
      name="chevron-forward"
      size={19}
      color="#92979E"
    />
  </Pressable>
</View>

{/* SIGN OUT */}
<Pressable
  onPress={handleSignOut}
  style={{
    height: 50,
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#F0CBCB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  }}
>
  <Ionicons
    name="log-out-outline"
    size={18}
    color="#C94D4D"
  />

  <Text
    className="font-sans-semibold"
    style={{
      marginLeft: 8,
      fontSize: 14,
      color: '#C94D4D',
    }}
  >
    Sign Out
  </Text>
</Pressable>

</>
)}
</View>
</ScrollView>
</Screen>
);
}