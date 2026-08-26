import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '../../../components/Screen';
import { Touchable } from '../../../components/Touchable';
import { useThemeColors } from '../../../lib/theme';

type ActivityTab = 'all' | 'applied' | 'invited' | 'offers';

type ActivityItem = {
  id: number;
  postingId?: number;
  type: 'applied' | 'invited' | 'offer';
  team: string;
  league: string;
  dateLabel: string;
  status: string;
  location?: string;
  tryout?: string;
  respondBy?: string;
};

const SAMPLE_ACTIVITY: ActivityItem[] = [
  {
  id: 1,
  postingId: 1,
  type: 'applied',
  team: 'City Hoops 17U',
  league: '17U · Competitive',
  dateLabel: 'Applied on May 21, 2025',
  status: 'Pending Parent',
},
  {
    id: 2,
    type: 'invited',
    team: 'Elite Performance 16U',
    league: '16U · Elite',
    dateLabel: 'Invited on May 18, 2025',
    status: 'Invited',
    tryout: 'May 26, 2025 · 7:00 PM',
    location: 'Newark, NJ',
  },
  {
    id: 3,
    type: 'offer',
    team: 'NY Lightning 16U',
    league: '16U · Competitive',
    dateLabel: 'Offered on May 10, 2025',
    status: 'Offer',
    respondBy: 'May 25, 2025',
  },
];

export default function PlayerActivity() {
  const router = useRouter();
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<ActivityTab>('all');

  const visible = useMemo(() => {
    if (activeTab === 'all') return SAMPLE_ACTIVITY;

    if (activeTab === 'offers') {
      return SAMPLE_ACTIVITY.filter((item) => item.type === 'offer');
    }

    return SAMPLE_ACTIVITY.filter((item) => item.type === activeTab);
  }, [activeTab]);

  return (
    <Screen edges={[]}>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 22,
          paddingBottom: 36,
        }}>

        {/* Page heading */}
        <Text className="font-sans-bold text-[24px] text-ink">
          Activity
        </Text>

        <Text className="font-sans mt-1 text-[13px] text-slate">
          Track your application journey.
        </Text>

        {/* Segmented filter */}
        <View className="mt-5 flex-row overflow-hidden rounded-btn bg-surface">
          <ActivityTabButton
            label="All"
            active={activeTab === 'all'}
            onPress={() => setActiveTab('all')}
          />

          <ActivityTabButton
            label="Applied"
            active={activeTab === 'applied'}
            onPress={() => setActiveTab('applied')}
          />

          <ActivityTabButton
            label="Invited"
            active={activeTab === 'invited'}
            onPress={() => setActiveTab('invited')}
          />

          <ActivityTabButton
            label="Offers"
            active={activeTab === 'offers'}
            onPress={() => setActiveTab('offers')}
          />
        </View>

        {/* ALL groups */}
        {activeTab === 'all' ? (
          <>
            <ActivitySection
  title="Applied"
  items={visible.filter((item) => item.type === 'applied')}
  onItemPress={(item) => {
    if (item.type === 'applied' && item.postingId) {
      router.push({
        pathname: '/player/posting/[id]',
        params: {
          id: String(item.postingId),
          from: 'activity',
        },
      });
    }
  }}
/>

            <ActivitySection
  title="Invited"
  items={visible.filter((item) => item.type === 'invited')}
/>

<ActivitySection
  title="Offers"
  items={visible.filter((item) => item.type === 'offer')}
/>
          </>
        ) : (
          <ActivitySection
  title={
    activeTab === 'offers'
      ? 'Offers'
      : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
  }
  items={visible}
  onItemPress={
    activeTab === 'applied'
      ? (item) => {
          if (item.postingId) {
            router.push({
              pathname: '/player/posting/[id]',
              params: {
                id: String(item.postingId),
                from: 'activity',
              },
            });
          }
        }
      : undefined
  }
/>
        )}

        {visible.length === 0 ? (
          <View className="mt-10 items-center">
            <Ionicons
              name="file-tray-outline"
              size={34}
              color={colors.slate}
            />

            <Text className="font-sans-semibold mt-3 text-[15px] text-ink">
              Nothing here yet
            </Text>

            <Text className="font-sans mt-1 text-center text-[12px] text-slate">
              Your applications, invitations, and offers will appear here.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function ActivityTabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`flex-1 items-center justify-center px-2 py-3 ${
        active ? 'bg-primary' : 'bg-surface'
      }`}>

      <Text
        className={`font-sans-semibold text-[12px] ${
          active ? 'text-white' : 'text-ink'
        }`}>
        {label}
      </Text>
    </Touchable>
  );
}

function ActivitySection({
  title,
  items,
  onItemPress,
}: {
  title: string;
  items: ActivityItem[];
  onItemPress?: (item: ActivityItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <View className="mt-7">
      <Text className="font-sans-bold text-[17px] text-ink">
        {title}
      </Text>

      {items.map((item) => (
        <ActivityCard
          key={item.id}
          item={item}
          onPress={
            onItemPress
              ? () => onItemPress(item)
              : undefined
          }
        />
      ))}
    </View>
  );
}

function ActivityCard({
  item,
  onPress,
}: {
  item: ActivityItem;
  onPress?: () => void;
}) {
  const colors = useThemeColors();

  return (
    <Touchable
  onPress={onPress ?? (() => {})}
      accessibilityRole="button"
      className="mt-3 rounded-card border border-border bg-surface p-4">

      <View className="flex-row items-start">
        {/* Temporary team logo */}
        <View className="h-12 w-12 items-center justify-center rounded-full border border-border bg-mist">
          <Ionicons
            name="basketball-outline"
            size={24}
            color={colors.primary}
          />
        </View>

        <View className="ml-3 flex-1">
          <Text className="font-sans-bold text-[15px] text-ink">
            {item.team}
          </Text>

          <Text className="font-sans mt-1 text-[12px] text-slate">
            {item.league}
          </Text>

          <Text className="font-sans mt-2 text-[12px] text-slate">
            {item.dateLabel}
          </Text>
        </View>

        <StatusBadge
          type={item.type}
          label={item.status}
        />
      </View>

      {item.tryout ? (
        <View className="mt-4 border-t border-border pt-3">
          <Text className="font-sans-medium text-[12px] text-ink">
            Tryout: {item.tryout}
          </Text>

          {item.location ? (
            <View className="mt-1 flex-row items-center">
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.slate}
              />

              <Text className="font-sans ml-1 text-[12px] text-slate">
                {item.location}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {item.respondBy ? (
        <View className="mt-4 flex-row items-center justify-between border-t border-border pt-3">
          <Text className="font-sans-medium text-[12px] text-ink">
            Respond by: {item.respondBy}
          </Text>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.slate}
          />
        </View>
      ) : null}

      {item.type === 'invited' && !item.respondBy ? (
        <View className="mt-3 items-end">
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.slate}
          />
        </View>
      ) : null}
    </Touchable>
  );
}

function StatusBadge({
  type,
  label,
}: {
  type: ActivityItem['type'];
  label: string;
}) {
  const classes =
    type === 'applied'
      ? 'border-partial bg-partial-soft text-partial'
      : type === 'invited'
        ? 'border-primary bg-primary-soft text-primary'
        : 'border-good bg-good-soft text-good';

  return (
    <View className={`rounded-btn border px-2.5 py-1.5 ${classes}`}>
      <Text className={`font-sans-bold text-[10px] ${classes}`}>
        {label}
      </Text>
    </View>
  );
}