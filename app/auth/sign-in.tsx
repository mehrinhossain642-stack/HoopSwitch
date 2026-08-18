import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AuthScaffold, OrDivider } from '../../components/AuthScaffold';
import { Button } from '../../components/Button';
import { InlineError } from '../../components/ScreenState';
import { TextField } from '../../components/TextField';
import { Touchable } from '../../components/Touchable';
import { useSession } from '../../lib/session';
import { errorMessage } from '../../lib/useApi';

export default function SignInScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Per-field errors, so the message sits next to the input that caused it.
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  async function handleSignIn() {
    setError('');

    const next: typeof fieldErrors = {};
    if (!email.trim()) next.email = 'Enter the email you signed up with.';
    if (!password) next.password = 'Enter your password.';
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      setLoading(true);

      // signIn persists the JWT and resolves where this user belongs: their
      // role's home, or back into onboarding if they never finished it.
      const { route } = await signIn(email.trim().toLowerCase(), password);
      router.replace(route);
    } catch (err) {
      // The API layer surfaces Devise's own wording here ("Invalid email or
      // password."), so a wrong password reads as a wrong password.
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScaffold
      eyebrow="Sign in"
      title="Welcome back"
      subtitle="Pick up where you left off — your fit scores are already waiting."
      footer={<Button label="Sign in" size="lg" loading={loading} onPress={handleSignIn} />}>
      {error ? <InlineError message={error} /> : null}

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        icon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        error={fieldErrors.email ?? null}
      />

      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        icon="lock-closed-outline"
        secure
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSignIn}
        error={fieldErrors.password ?? null}
      />

      <Touchable
        accessibilityRole="button"
        accessibilityLabel="Forgot password"
        scaleTo={1}
        dimTo={0.6}
        className="self-start py-1">
        <Text className="font-sans-semibold text-[12px] text-primary">Forgot password?</Text>
      </Touchable>

      <OrDivider />

      <View className="items-center">
        <Touchable
          onPress={() => router.replace('/auth/welcome')}
          accessibilityRole="button"
          accessibilityLabel="Create an account"
          scaleTo={1}
          dimTo={0.6}
          className="h-11 justify-center">
          <Text className="font-sans text-[13px] text-slate">
            New to HoopSwitch?{' '}
            <Text className="font-sans-bold text-primary">Create an account</Text>
          </Text>
        </Touchable>
      </View>
    </AuthScaffold>
  );
}
