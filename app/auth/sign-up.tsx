import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AuthScaffold, OrDivider } from '../../components/AuthScaffold';
import { Button } from '../../components/Button';
import { InlineError } from '../../components/ScreenState';
import { Segmented } from '../../components/Segmented';
import { FieldLabel, TextField } from '../../components/TextField';
import { Touchable } from '../../components/Touchable';
import type { UserRole } from '../../lib/api';
import { useSession } from '../../lib/session';
import { errorMessage } from '../../lib/useApi';

const ROLE_SEGMENTS = [
  { value: 'player' as UserRole, label: 'Player', icon: 'basketball-outline' as const },
  { value: 'coach' as UserRole, label: 'Coach', icon: 'clipboard-outline' as const },
  { value: 'parent' as UserRole, label: 'Parent', icon: 'people-outline' as const },
];

type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function SignUpScreen() {
  const { signUp } = useSession();
  const params = useLocalSearchParams<{ role?: string }>();

  // Seeded from the role confirmed on the welcome screen, but still changeable —
  // this is the last point before the account exists.
  const initialRole: UserRole =
  params.role === 'coach'
    ? 'coach'
    : params.role === 'parent'
      ? 'parent'
      : 'player';

  const [role, setRole] = useState<UserRole>(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleCreateAccount() {
    setError('');

    // Validate everything at once and pin each message to its own field, rather
    // than surfacing one error at a time at the top of the form.
    const next: FieldErrors = {};
    if (!fullName.trim()) next.fullName = 'Enter your full name.';
    if (!email.trim()) next.email = 'Enter your email address.';
    if (password.length < 6) next.password = 'Use at least 6 characters.';
    if (password && password !== confirmPassword) {
      next.confirmPassword = "Passwords don't match.";
    }

    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      setLoading(true);

      // signUp persists the JWT, so the session survives an app restart. New
      // players land in the "Create your profile" flow; coaches skip it.
      const { route } = await signUp(
        email.trim().toLowerCase(),
        password,
        confirmPassword,
        role,
        fullName
      );

      router.replace(route);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScaffold
      eyebrow="Create account"
      title="Set up your account"
      backFallback="/auth/welcome"
      subtitle={
  role === 'player'
    ? "Next you'll build your athlete profile."
    : role === 'coach'
      ? "Next you'll set up your team and start managing opportunities."
      : "Create your parent account to manage your athlete's activity and approvals."
}
      footer={
        <Button
          label="Create account"
          size="lg"
          loading={loading}
          onPress={handleCreateAccount}
        />
      }>
      {error ? <InlineError message={error} /> : null}

      <View className="mb-5">
        <FieldLabel label="I am a" required />
        <Segmented segments={ROLE_SEGMENTS} value={role} onChange={setRole} className="mt-2" />
      </View>

      <TextField
        label="Full name"
        required
        value={fullName}
        onChangeText={setFullName}
        placeholder="Jordan Davis"
        icon="person-outline"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        error={fieldErrors.fullName ?? null}
      />

      <TextField
        label="Email"
        required
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
        required
        helper="At least 6 characters."
        value={password}
        onChangeText={setPassword}
        placeholder="Create a password"
        icon="lock-closed-outline"
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        error={fieldErrors.password ?? null}
      />

      <TextField
        label="Confirm password"
        required
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Re-enter your password"
        icon="lock-closed-outline"
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleCreateAccount}
        error={fieldErrors.confirmPassword ?? null}
      />

      <Text className="font-sans text-center text-[11px] leading-[16px] text-slate">
        By creating an account you agree to our{' '}
        <Text className="font-sans-semibold text-slate underline">Terms of Service</Text> and{' '}
        <Text className="font-sans-semibold text-slate underline">Privacy Policy</Text>.
      </Text>

      <OrDivider />

      <View className="items-center">
        <Touchable
          onPress={() => router.replace('/auth/sign-in')}
          accessibilityRole="button"
          accessibilityLabel="Sign in instead"
          scaleTo={1}
          dimTo={0.6}
          className="h-11 justify-center">
          <Text className="font-sans text-[13px] text-slate">
            Already have an account?{' '}
            <Text className="font-sans-bold text-primary">Sign in</Text>
          </Text>
        </Touchable>
      </View>
    </AuthScaffold>
  );
}
