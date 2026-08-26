import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useThemeColors } from '../../../lib/theme';

export default function PlayerHome() {
  const colors = useThemeColors();

  // Temporary until we wire this to the API.
  const hasVerifiedStats = false;

  return (
    <Screen edges={[]}>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 22,
          paddingBottom: 36,
        }}>

        {/* Greeting */}
        <View className="mb-5">
          <Text className="font-sans-bold text-[24px] text-ink">
            Hey Marcus! 👋
          </Text>

          <Text className="font-sans mt-1 text-[13px] text-slate">
            Let&apos;s get better today.
          </Text>
        </View>

        {/* Season Stats */}
        <View className="rounded-card border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-sans-bold text-[15px] text-ink">
              Season Stats
            </Text>

            <View className="flex-row items-center">
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={colors.primary}
              />
              <Text className="font-sans-medium ml-1 text-[11px] text-primary">
                Verified
              </Text>
            </View>
          </View>

          {hasVerifiedStats ? (
            <>
              <View className="mt-4 flex-row justify-between">
                <Stat value="12" label="Games" />
                <Stat value="18.6" label="PPG" />
                <Stat value="6.2" label="RPG" />
                <Stat value="2.1" label="APG" />
              </View>

              <View className="my-4 h-px bg-border" />

              <View className="flex-row">
                <View className="flex-1 border-r border-border pr-4">
                  <Text className="font-sans-medium text-[11px] text-slate">
                    Overall Rating
                  </Text>

                  <Text className="font-stat mt-1 text-[34px] text-ink">
                    78
                  </Text>

                  <Text className="font-sans-medium text-[11px] text-slate">
                    Good
                  </Text>

                  <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist">
                    <View className="h-full w-[78%] rounded-full bg-primary" />
                  </View>
                </View>

                <View className="flex-1 pl-4">
                  <Text className="font-sans-medium text-[11px] text-slate">
                    Position
                  </Text>

                  <Text className="font-sans-semibold mt-1 text-[13px] text-ink">
                    SG / SF
                  </Text>

                  <Text className="font-sans-medium mt-4 text-[11px] text-slate">
                    Grade Year
                  </Text>

                  <Text className="font-sans-semibold mt-1 text-[13px] text-ink">
                    2026
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View className="mt-4 rounded-btn bg-mist p-4">
              <View className="flex-row items-start">
                <Ionicons
                  name="stats-chart-outline"
                  size={20}
                  color={colors.primary}
                />

                <View className="ml-3 flex-1">
                  <Text className="font-sans-semibold text-[14px] text-ink">
                    No verified stats yet
                  </Text>

                  <Text className="font-sans mt-1 text-[12px] leading-[18px] text-slate">
                    Your game stats will automatically appear here after they
                    are uploaded by your coach or a HoopSwitch admin.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Development Focus */}
        <View className="mt-4 rounded-card border border-border bg-surface p-4">
          <Text className="font-sans-bold text-[15px] text-ink">
            Development Focus
          </Text>

          <Text className="font-sans mt-1 text-[11px] text-slate">
            Based on your goals and verified performance.
          </Text>

          <DevelopmentItem
            icon="basketball-outline"
            title="Improve Ball Handling"
            description="Consistency, control, advanced moves"
          />

          <DevelopmentItem
            icon="locate-outline"
            title="Increase Shooting %"
            description="Catch & shoot, off the dribble"
          />

          <DevelopmentItem
            icon="fitness-outline"
            title="Strength & Conditioning"
            description="Explosiveness, endurance, agility"
          />
        </View>

        {/* Current Goals */}
        <View className="mt-4 rounded-card border border-border bg-surface p-4">
          <Text className="font-sans-bold text-[15px] text-ink">
            Your Goals
          </Text>

          <View className="mt-3 flex-row flex-wrap gap-2">
            <Goal label="Improve shooting" />
            <Goal label="Stronger guard play" />
            <Goal label="Make a competitive team" />
          </View>
        </View>

        {/* Next Step */}
        <View className="mt-4 rounded-card border border-border bg-surface p-4">
          <Text className="font-sans-bold text-[15px] text-ink">
            Next Step
          </Text>

          <Text className="font-sans mt-1 text-[12px] leading-[18px] text-slate">
            Once verified game data is available, your development insights
            will become more personalized.
          </Text>

          <View className="mt-4 flex-row items-center rounded-btn bg-primary-soft px-3 py-3">
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={colors.primary}
            />

            <Text className="font-sans-medium ml-2 flex-1 text-[12px] text-primary">
              Stats can only be uploaded by coaches and admins.
            </Text>
          </View>
        </View>

      </ScrollView>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="items-center">
      <Text className="font-stat text-[24px] text-ink">{value}</Text>
      <Text className="font-sans-medium mt-0.5 text-[10px] text-slate">
        {label}
      </Text>
    </View>
  );
}

function DevelopmentItem({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  const colors = useThemeColors();

  return (
    <View className="mt-4 flex-row items-center">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>

      <View className="ml-3 flex-1">
        <Text className="font-sans-semibold text-[13px] text-ink">
          {title}
        </Text>

        <Text className="font-sans mt-0.5 text-[11px] text-slate">
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.slate}
      />
    </View>
  );
}

function Goal({ label }: { label: string }) {
  return (
    <View className="rounded-full border border-border bg-mist px-3 py-2">
      <Text className="font-sans-medium text-[11px] text-ink">
        {label}
      </Text>
    </View>
  );
}