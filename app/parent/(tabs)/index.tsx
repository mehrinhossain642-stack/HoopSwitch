import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { AppHeader } from '../../../components/AppHeader';
import { Button } from '../../../components/Button';
import { InlineError } from '../../../components/ScreenState';
import { Screen } from '../../../components/Screen';

import {
  getParentAthletes,
  type LinkedAthlete,
} from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { errorMessage } from '../../../lib/useApi';

export default function ParentHome() {
  const { requireToken, signOut } = useSession();

  const [athletes, setAthletes] = useState<LinkedAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAthletes();
  }, []);

  async function loadAthletes() {
    try {
      setLoading(true);
      setError('');

      const result = await getParentAthletes(requireToken());
      setAthletes(result);
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

  return (
    <Screen edges={[]}>
      <AppHeader brand meta="Parent dashboard" />

      <View className="flex-1 px-6 pt-8">
        <Text className="font-display text-[28px] text-ink">
          Welcome back!
        </Text>

        <Text className="font-sans mt-1 text-[14px] text-slate">
          Manage your athlete&apos;s journey.
        </Text>

        {error ? (
          <View className="mt-5">
            <InlineError message={error} />
          </View>
        ) : null}

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="font-sans text-[14px] text-slate">
              Loading athlete...
            </Text>
          </View>
        ) : athlete ? (
          <View className="mt-8">
            <Text className="font-stat text-[12px] tracking-eyebrow text-slate">
              YOUR ATHLETE
            </Text>

            <View className="mt-3 rounded-2xl border border-line bg-surface p-5">
              <Text className="font-display text-[22px] text-ink">
                {athlete.name ?? 'Athlete'}
              </Text>

              <Text className="font-sans mt-1 text-[14px] text-slate">
                {athlete.position ?? 'Position not set'}
              </Text>

              <Text className="font-sans mt-1 text-[13px] text-slate">
                {athlete.email}
              </Text>

              <View className="mt-5">
                <Button
                  label="View Athlete Profile"
                  variant="secondary"
                  onPress={() => {
                    // Athlete parent-view screen comes next.
                  }}
                />
              </View>
            </View>

            <View className="mt-8">
              <Text className="font-stat text-[12px] tracking-eyebrow text-slate">
                RECENT ACTIVITY
              </Text>

              <View className="mt-3 rounded-2xl border border-line bg-surface p-5">
                <Text className="font-sans text-[14px] text-slate">
                  Applications and tryout activity will appear here.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <View className="w-full max-w-sm items-center">
              <Text className="font-display text-[22px] text-ink">
                No athlete linked yet
              </Text>

              <Text className="font-sans mt-3 text-center text-[14px] leading-[20px] text-slate">
                Connect your athlete to start viewing their activity,
                applications, and tryout invites.
              </Text>

              <View className="mt-6 w-full">
                <Button
                  label="Link Athlete"
                  size="lg"
                  onPress={() => router.push('/parent/link-athlete')}
                />
              </View>

              <View className="mt-3 w-full">
                <Button
                  label="Learn How It Works"
                  variant="secondary"
                  onPress={() => {}}
                />
              </View>
            </View>
          </View>
        )}

        <View className="mt-auto pb-8 pt-6">
          <Button
            label="Sign out"
            variant="secondary"
            onPress={handleSignOut}
          />
        </View>
      </View>
    </Screen>
  );
}