import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { useApp } from '../lib/store';
import { COLORS } from '../lib/theme';
import { getProfile, login } from '../lib/api';
/** Role select — the prototype's stand-in for auth. */
export default function RoleSelect() {
  const { currentPlayer, currentTeam, allPostings } = useApp();
  const openSlots = allPostings.filter((posting) => posting.status === 'open').length;
  async function testBackendLogin() {
  try {
    const token = await login(
      'marcus.webb@example.com',
      'password123'
    );

    console.log('Frontend connected to backend!');
    console.log(token);

    const profile = await getProfile(token);

    console.log('Profile loaded from backend!');
    console.log(profile);
  } catch (error) {
    console.error('Frontend/backend connection failed:', error);
  }
}
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'bottom']}>
      <View className="flex-1 justify-between px-5 py-8">
        <View>
          <Text className="font-display text-[34px] leading-[40px] text-ink">
            Hoop<Text className="text-primary">Switch</Text>
          </Text>
          <Text className="font-sans mt-3 text-[15px] leading-[22px] text-slate">
            The transfer portal for everyone. Find the roster spot that actually fits — or
            the player who fills yours.
          </Text>
        </View>

        <View>
          <Text className="font-sans-semibold mb-3 text-[12px] uppercase tracking-widest text-slate">
            Choose a view
          </Text>
          <Pressable
            onPress={testBackendLogin}
            className="mb-4 rounded-btn bg-primary px-4 py-3"
          >
            <Text className="font-sans-semibold text-center text-white">
              Test Backend Connection
            </Text>
          </Pressable>
          <RoleCard
            href="/player"
            icon="basketball-outline"
            title="Enter as Player"
            subtitle={`${allPostings.length} open roster spots · scored against your profile`}
            meta={`Signed in as ${currentPlayer.name} · ${currentPlayer.position} · ${currentPlayer.location}`}
          />

          <View className="h-3" />

          <RoleCard
            href="/coach"
            icon="clipboard-outline"
            title="Enter as Coach"
            subtitle={`${openSlots} open slots · ranked talent for each one`}
            meta={`Signed in as ${currentTeam.coach_name} · ${currentTeam.name}`}
          />
        </View>

        <Text className="font-sans text-center text-[12px] text-slate">
          Prototype · dummy data, no accounts, nothing leaves your device
        </Text>
      </View>
    </SafeAreaView>
  );
}

type RoleCardProps = {
  href: '/player' | '/coach';
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  meta: string;
};

function RoleCard({ href, icon, title, subtitle, meta }: RoleCardProps) {
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <Card>
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-btn bg-primary">
              <Ionicons name={icon} size={24} color={COLORS.surface} />
            </View>
            <View className="ml-4 flex-1">
              <Text className="font-display text-[19px] text-ink">{title}</Text>
              <Text className="font-sans mt-0.5 text-[13px] leading-[18px] text-slate">
                {subtitle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.slate} />
          </View>
          <View className="mt-3 border-t border-border pt-3">
            <Text className="font-sans-medium text-[12px] text-slate">{meta}</Text>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}
