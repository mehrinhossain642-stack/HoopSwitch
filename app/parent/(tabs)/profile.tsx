import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AppHeader } from '../../../components/AppHeader';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import { InlineError } from '../../../components/ScreenState';
import { Touchable } from '../../../components/Touchable';
import {
  getParentAthletes,
  getParentProfile,
  type ApiUser,
  type LinkedAthlete,
} from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { useThemeColors } from '../../../lib/theme';
import { errorMessage } from '../../../lib/useApi';

export default function ParentProfile() {
  const { requireToken, signOut } = useSession();
  const colors = useThemeColors();

  const [parent, setParent] = useState<ApiUser | null>(null);
  const [athletes, setAthletes] = useState<LinkedAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
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
  }, [requireToken]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  async function handleSignOut() {
    await signOut();
    router.replace('/auth/welcome');
  }

  const athlete = athletes[0];

  return (
    <Screen edges={[]}>
      <AppHeader brand meta="Parent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View className="w-full max-w-[560px] self-center px-5 pt-7">
          <Text className="font-display text-[29px] leading-[34px] text-ink">
            Profile
          </Text>

          <Text className="font-sans mt-1 text-[14px] text-slate">
            Manage your parent account and linked athlete.
          </Text>

          {error ? (
            <View className="mt-5">
              <InlineError message={error} />
            </View>
          ) : null}

          {loading ? (
            <View className="items-center py-24">
              <Text className="font-sans text-[14px] text-slate">
                Loading profile...
              </Text>
            </View>
          ) : (
            <>
              <Text className="font-sans-semibold mb-3 mt-8 text-[15px] text-ink">
                Account
              </Text>

              <Touchable
                onPress={() => router.push('/parent/settings')}
                accessibilityRole="button"
                accessibilityLabel="Edit parent profile"
                scaleTo={0.99}
                dimTo={0.85}
              >
                <Card bare>
                  <View className="flex-row items-center p-4">
                    <Avatar
                      name={parent?.name?.trim() || parent?.email || 'Parent'}
                      size={54}
                    />

                    <View className="ml-4 flex-1">
                      <Text className="font-sans-semibold text-[16px] text-ink">
                        {parent?.name?.trim() || 'Add your name'}
                      </Text>

                      <Text className="font-sans mt-1 text-[13px] text-slate">
                        {parent?.email}
                      </Text>

                      <Text className="font-sans-semibold mt-1 text-[12px] text-primary">
                        Edit profile
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={19}
                      color={colors.slate}
                    />
                  </View>
                </Card>
              </Touchable>

              <View className="mb-3 mt-8 flex-row items-center justify-between">
                <Text className="font-sans-semibold text-[15px] text-ink">
                  Linked Athlete
                </Text>

                <Touchable
                  onPress={() => router.push('/parent/link-athlete')}
                  accessibilityRole="button"
                  accessibilityLabel="Link another athlete"
                  className="px-1 py-2"
                >
                  <Text className="font-sans-semibold text-[12px] text-primary">
                    Link another
                  </Text>
                </Touchable>
              </View>

              {athlete ? (
                <Touchable
                  onPress={() =>
                    router.push(`/parent/athlete/${athlete.id}` as any)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${athlete.name ?? 'athlete'} profile`}
                  scaleTo={0.99}
                  dimTo={0.85}
                >
                  <Card bare>
                    <View className="flex-row items-center p-4">
                      <Avatar
                        name={athlete.name ?? athlete.email ?? 'Athlete'}
                        size={54}
                      />

                      <View className="ml-4 flex-1">
                        <Text className="font-sans-semibold text-[16px] text-ink">
                          {athlete.name ?? 'Athlete'}
                        </Text>

                        <Text className="font-sans mt-1 text-[13px] text-slate">
                          {athlete.position ?? 'Position not set'}
                        </Text>

                        {athlete.email ? (
                          <Text className="font-sans mt-1 text-[12px] text-slate">
                            {athlete.email}
                          </Text>
                        ) : null}
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={19}
                        color={colors.slate}
                      />
                    </View>
                  </Card>
                </Touchable>
              ) : (
                <Touchable
                  onPress={() => router.push('/parent/link-athlete')}
                  accessibilityRole="button"
                  accessibilityLabel="Link an athlete"
                  scaleTo={0.99}
                  dimTo={0.85}
                >
                  <Card bare>
                    <View className="items-center p-6">
                      <Ionicons
                        name="person-add-outline"
                        size={25}
                        color={colors.primary}
                      />

                      <Text className="font-sans-semibold mt-3 text-[14px] text-ink">
                        Link an athlete
                      </Text>
                    </View>
                  </Card>
                </Touchable>
              )}

              <Text className="font-sans-semibold mb-3 mt-8 text-[15px] text-ink">
                Settings
              </Text>

              <Touchable
                onPress={() => router.push('/parent/settings')}
                accessibilityRole="button"
                accessibilityLabel="Open account settings"
                scaleTo={0.99}
                dimTo={0.85}
              >
                <Card bare>
                  <View className="min-h-[64px] flex-row items-center px-4">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-mist">
                      <Ionicons
                        name="settings-outline"
                        size={18}
                        color={colors.slate}
                      />
                    </View>

                    <Text className="font-sans-semibold ml-3 flex-1 text-[14px] text-ink">
                      Account Settings
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={19}
                      color={colors.slate}
                    />
                  </View>
                </Card>
              </Touchable>

              <View className="mt-8">
                <Button
                  label="Sign Out"
                  variant="danger"
                  icon="log-out-outline"
                  onPress={handleSignOut}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
