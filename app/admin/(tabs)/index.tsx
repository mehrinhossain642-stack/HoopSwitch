import Ionicons from '@expo/vector-icons/Ionicons';
import { Touchable } from '../../../components/Touchable';
import { useRouter } from 'expo-router';
import {
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import {
  AppHeader,
  HeaderIconButton,
} from '../../../components/AppHeader';
import { Card } from '../../../components/Card';
import {
  Screen,
  useContentContainerStyle,
} from '../../../components/Screen';
import {
  ScreenError,
  ScreenLoading,
} from '../../../components/ScreenState';

import * as api from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { useThemeColors } from '../../../lib/theme';
import { useApiData } from '../../../lib/useApi';

const METRICS = [
  {
    key: 'pending_applications',
    label: 'Pending Applications',
    description: 'Need admin review',
    icon: 'document-text-outline',
  },
  {
    key: 'active_opportunities',
    label: 'Active Opportunities',
    description: 'Published roster openings',
    icon: 'basketball-outline',
  },
  {
    key: 'pending_stat_requests',
    label: 'Stat Requests',
    description: 'Awaiting approval',
    icon: 'stats-chart-outline',
  },
  {
    key: 'registered_athletes',
    label: 'Registered Athletes',
    description: 'Player accounts',
    icon: 'people-outline',
  },
] as const;

export default function AdminDashboard() {
  const router = useRouter();
  const { requireToken, token } = useSession();
  const colors = useThemeColors();

  const contentStyle = useContentContainerStyle({
    measure: 'wide',
    paddingTop: 18,
  });

  const dashboard = useApiData(
    () => api.getAdminDashboard(requireToken()),
    [token]
  );

  if (dashboard.loading && !dashboard.data) {
    return <ScreenLoading label="Loading dashboard" />;
  }

  if (dashboard.error && !dashboard.data) {
    return (
      <ScreenError
        message={dashboard.error}
        onRetry={dashboard.refetch}
      />
    );
  }

  if (!dashboard.data) {
    return null;
  }

  const data = dashboard.data;

  return (
    <Screen edges={[]}>
      <AppHeader
        title="Admin Dashboard"
        eyebrow="HoopSwitch"
        meta="Platform overview"
        right={
          <HeaderIconButton
            icon="settings-outline"
            label="Settings"
            onPress={() => router.push('/admin/settings')}
          />
        }
      />

      <ScrollView
        contentContainerStyle={contentStyle}
        refreshControl={
          <RefreshControl
            refreshing={dashboard.loading}
            onRefresh={dashboard.refetch}
            tintColor={colors.primary}
          />
        }
      >
        <View className="-mx-1.5 flex-row flex-wrap">
          {METRICS.map((metric) => {
  const openMetric = () => {
    switch (metric.key) {
      case 'pending_applications':
        router.push('/admin/applications');
        break;

      case 'active_opportunities':
        router.push('/admin/opportunities');
        break;

      case 'pending_stat_requests':
        router.push('/admin/stats');
        break;

      case 'registered_athletes':
        router.push('/admin/users');
        break;
    }
  };

  return (
    <View
      key={metric.key}
      className="w-1/2 px-1.5 pb-3 lg:w-1/4"
    >
      <Touchable
        onPress={openMetric}
        accessibilityRole="button"
        accessibilityLabel={`Open ${metric.label}`}
        scaleTo={0.98}
        dimTo={0.85}
      >
        <Card className="min-h-[145px]">
          <View className="flex-row items-start justify-between">
            <View className="h-10 w-10 items-center justify-center rounded-md bg-primary-soft">
              <Ionicons
                name={metric.icon}
                size={20}
                color={colors.primary}
              />
            </View>

            <Ionicons
              name="arrow-forward-outline"
              size={16}
              color={colors.slate}
            />
          </View>

          <Text className="font-stat mt-3 text-[30px] tracking-stat text-ink">
            {data[metric.key]}
          </Text>

          <Text className="font-sans-semibold mt-1 text-[12px] text-ink">
            {metric.label}
          </Text>

          <Text className="font-sans mt-1 text-[10px] text-slate">
            {metric.description}
          </Text>
        </Card>
      </Touchable>
    </View>
  );
})}
</View>

        <Text className="font-display mb-3 mt-4 text-[19px] text-ink">
          Admin priorities
        </Text>

        <PriorityCard
          icon="person-add-outline"
          title="Teams without linked accounts"
          description="The coach is listed, but does not have a HoopSwitch account."
          value={data.teams_without_accounts}
        />

        <PriorityCard
          icon="time-outline"
          title="Waiting for parent approval"
          description="No admin action is required until the parent responds."
          value={data.waiting_for_parent}
        />

        <PriorityCard
          icon="document-text-outline"
          title="Applications needing review"
          description="Review athletes before sharing their profiles with coaches."
          value={data.pending_applications}
        />
      </ScrollView>
    </Screen>
  );
}

function PriorityCard({
  icon,
  title,
  description,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: number;
}) {
  const colors = useThemeColors();

  return (
    <Card className="mb-3">
      <View className="flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-md bg-primary-soft">
          <Ionicons
            name={icon}
            size={19}
            color={colors.primary}
          />
        </View>

        <View className="ml-3 flex-1">
          <Text className="font-sans-semibold text-[13px] text-ink">
            {title}
          </Text>

          <Text className="font-sans mt-1 text-[11px] leading-[16px] text-slate">
            {description}
          </Text>
        </View>

        <View className="ml-3 rounded-full bg-primary-soft px-3 py-1">
          <Text className="font-stat text-[14px] text-primary">
            {value}
          </Text>
        </View>
      </View>
    </Card>
  );
}