import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-5 pt-8">
        <Text className="font-sans-medium text-[12px] text-slate">
          Welcome
        </Text>

        <Text className="font-display mt-4 text-[24px] leading-[31px] text-ink">
          Welcome to
        </Text>

        <Text className="font-display text-[27px] text-ink">
          Hoop<Text className="text-primary">Switch</Text>
        </Text>

        <Text className="font-sans mt-1 text-[13px] text-slate">
          How would you like to get started?
        </Text>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/auth/sign-up',
              params: { role: 'player' },
            })
          }
          className="mt-6 flex-row items-center rounded-card border border-primary bg-white p-4"
        >
          <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Ionicons name="basketball-outline" size={25} color="white" />
          </View>

          <View className="ml-4 flex-1">
            <Text className="font-sans-semibold text-[16px] text-ink">
              Player
            </Text>

            <Text className="font-sans mt-1 text-[12px] leading-[17px] text-slate">
              Find opportunities and get recruited
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/auth/sign-up',
              params: { role: 'coach' },
            })
          }
          className="mt-3 flex-row items-center rounded-card border border-border bg-white p-4"
        >
          <View className="h-12 w-12 items-center justify-center rounded-full bg-ink">
            <Ionicons name="clipboard-outline" size={24} color="white" />
          </View>

          <View className="ml-4 flex-1">
            <Text className="font-sans-semibold text-[16px] text-ink">
              Coach
            </Text>

            <Text className="font-sans mt-1 text-[12px] leading-[17px] text-slate">
              Find talent and build your team
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/auth/sign-in')}
          className="mt-5"
        >
          <Text className="font-sans text-[12px] text-slate">
            Already have an account?{' '}
            <Text className="font-sans-semibold text-primary">
              Sign in
            </Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}