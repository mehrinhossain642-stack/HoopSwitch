import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { AppHeader } from '../../../components/AppHeader';
import { Button } from '../../../components/Button';
import { Screen } from '../../../components/Screen';
import { useSession } from '../../../lib/session';

export default function ParentHome() {
  const { signOut } = useSession();

  async function handleSignOut() {
    await signOut();
    router.replace('/auth/welcome');
  }

  return (
    <Screen edges={[]}>
      <AppHeader brand meta="Parent dashboard" />

      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-display text-2xl text-ink">
          Parent Dashboard
        </Text>

        <Text className="font-sans mt-2 text-center text-sm text-slate">
          Parent features coming soon.
        </Text>

        <View className="mt-6 w-full max-w-sm">
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