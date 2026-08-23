import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { InlineError } from '../../components/ScreenState';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { AppHeader } from '../../components/AppHeader';

import { linkParentAthlete } from '../../lib/api';
import { useSession } from '../../lib/session';
import { errorMessage } from '../../lib/useApi';

export default function LinkAthleteScreen() {
  const { requireToken } = useSession();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLinkAthlete() {
    setError('');

    if (!email.trim()) {
      setError("Enter your athlete's email address.");
      return;
    }

    try {
      setLoading(true);

      await linkParentAthlete(
        requireToken(),
        email.trim().toLowerCase()
      );

      router.replace('/parent');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen edges={[]}>
      <AppHeader title="Link an Athlete" />

      <View className="flex-1 px-5 pt-6">
        <Text className="font-display text-[26px] text-ink">
          Link an Athlete
        </Text>

        <Text className="font-sans mt-2 text-[14px] leading-[20px] text-slate">
          Enter your athlete&apos;s email address to connect their account.
        </Text>

        {error ? (
          <View className="mt-5">
            <InlineError message={error} />
          </View>
        ) : null}

        <View className="mt-6">
          <TextField
            label="Athlete's Email"
            required
            value={email}
            onChangeText={setEmail}
            placeholder="marcus.webb@example.com"
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
        </View>

        <View className="mt-4 rounded-xl border border-line bg-surface px-4 py-4">
          <Text className="font-sans text-[13px] leading-[19px] text-slate">
            Make sure they&apos;ve already signed up as a player on HoopSwitch.
          </Text>
        </View>

        <View className="mt-6">
          <Button
            label="Find Athlete"
            size="lg"
            loading={loading}
            onPress={handleLinkAthlete}
          />
        </View>
      </View>
    </Screen>
  );
}