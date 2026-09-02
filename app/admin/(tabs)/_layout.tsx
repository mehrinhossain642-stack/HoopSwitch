import { Tabs } from 'expo-router';
import { TabBar } from '../../../components/TabBar';
import { useLayout } from '../../../lib/layout';

export default function AdminTabsLayout() {
  const { isDesktop } = useLayout();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: isDesktop ? 'left' : 'bottom',
      }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard' }}
      />

      <Tabs.Screen
        name="applications"
        options={{ title: 'Applications' }}
      />

      <Tabs.Screen
        name="opportunities"
        options={{ title: 'Opportunities' }}
      />

      <Tabs.Screen
        name="teams"
        options={{ title: 'Teams & Coaches' }}
      />

      <Tabs.Screen
        name="stats"
        options={{ title: 'Stat Requests' }}
      />

      <Tabs.Screen
        name="users"
        options={{ title: 'Users' }}
      />

      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings' }}
      />
    </Tabs>
  );
}