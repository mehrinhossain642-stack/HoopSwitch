import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signup, type UserRole } from '../../lib/api';

export default function SignUpScreen() {
  const params = useLocalSearchParams<{ role?: string }>();

  const initialRole: UserRole =
    params.role === 'coach' ? 'coach' : 'player';

  const [role, setRole] = useState<UserRole>(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreateAccount() {
    setError('');

    if (!fullName.trim()) {
      setError('Enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Enter your email.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      const result = await signup(
        email.trim().toLowerCase(),
        password,
        confirmPassword,
        role
      );

      console.log('Account created:', result.user);

      if (role === 'player') {
        router.replace('/player');
      } else {
        router.replace('/coach');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create account.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-5 pt-5">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 justify-center"
        >
          <Ionicons name="arrow-back" size={22} color="#141518" />
        </Pressable>

        <Text className="font-display mt-4 text-[27px] text-ink">
          Create your account
        </Text>

        <Text className="font-sans mt-1 text-[12px] text-slate">
          Choose your role
        </Text>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            onPress={() => setRole('player')}
            className={`flex-1 rounded-btn py-4 ${
              role === 'player' ? 'bg-primary' : 'bg-bg'
            }`}
          >
            <Text
              className={`font-sans-semibold text-center text-[13px] ${
                role === 'player' ? 'text-white' : 'text-ink'
              }`}
            >
              Player
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setRole('coach')}
            className={`flex-1 rounded-btn py-4 ${
              role === 'coach' ? 'bg-primary' : 'bg-bg'
            }`}
          >
            <Text
              className={`font-sans-semibold text-center text-[13px] ${
                role === 'coach' ? 'text-white' : 'text-ink'
              }`}
            >
              Coach
            </Text>
          </Pressable>
        </View>

        <Text className="font-sans-semibold mt-5 text-[11px] text-ink">
          Full Name
        </Text>

        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          className="font-sans mt-2 rounded-btn border border-border bg-bg px-4 py-4 text-[13px] text-ink"
        />

        <Text className="font-sans-semibold mt-4 text-[11px] text-ink">
          Email
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          className="font-sans mt-2 rounded-btn border border-border bg-bg px-4 py-4 text-[13px] text-ink"
        />

        <Text className="font-sans-semibold mt-4 text-[11px] text-ink">
          Password
        </Text>

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          className="font-sans mt-2 rounded-btn border border-border bg-bg px-4 py-4 text-[13px] text-ink"
        />

        <Text className="font-sans-semibold mt-4 text-[11px] text-ink">
          Confirm Password
        </Text>

        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          secureTextEntry
          className="font-sans mt-2 rounded-btn border border-border bg-bg px-4 py-4 text-[13px] text-ink"
        />

        {error ? (
          <Text className="font-sans mt-3 text-[11px] text-red-600">
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={handleCreateAccount}
          disabled={loading}
          className="mt-5 items-center rounded-btn bg-primary py-4"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-sans-semibold text-[13px] text-white">
              Create Account
            </Text>
          )}
        </Pressable>

        <Text className="font-sans mt-3 text-[10px] text-slate">
          I agree to the Terms & Conditions
        </Text>
      </View>
    </SafeAreaView>
  );
}