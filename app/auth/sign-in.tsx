import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login } from '../../lib/api';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    setError('');

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    try {
      setLoading(true);

      const token = await login(
        email.trim().toLowerCase(),
        password
      );

      console.log('Signed in successfully');
      console.log(token);

      // For now, route to player.
      // We'll make this role-aware after we update login()
      // to return the backend user object too.
      router.replace('/player');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign in.'
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

        <Text className="font-display mt-5 text-[28px] text-ink">
          Welcome back
        </Text>

        <Text className="font-sans mt-1 text-[13px] text-slate">
          Sign in to your account
        </Text>

        <Text className="font-sans-semibold mt-7 text-[12px] text-ink">
          Email
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          className="font-sans mt-2 rounded-btn border border-border bg-bg px-4 py-4 text-[14px] text-ink"
        />

        <Text className="font-sans-semibold mt-5 text-[12px] text-ink">
          Password
        </Text>

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          className="font-sans mt-2 rounded-btn border border-border bg-bg px-4 py-4 text-[14px] text-ink"
        />

        <Pressable className="mt-3">
          <Text className="font-sans-medium text-[11px] text-primary">
            Forgot password?
          </Text>
        </Pressable>

        {error ? (
          <Text className="font-sans mt-4 text-[12px] text-red-600">
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={handleSignIn}
          disabled={loading}
          className="mt-6 items-center rounded-btn bg-primary py-4"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-sans-semibold text-[14px] text-white">
              Sign In
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push('/auth/welcome')}
          className="mt-4"
        >
          <Text className="font-sans text-[11px] text-slate">
            Don't have an account?{' '}
            <Text className="font-sans-semibold text-primary">
              Sign Up
            </Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}