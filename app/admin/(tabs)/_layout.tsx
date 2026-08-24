import { Tabs } from 'expo-router';
import { TabBar } from '../../../components/TabBar';
import { useLayout } from '../../../lib/layout';

export default function AdminTabsLayout() {
  const { isDesktop } = useLayout();

  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarPosition: isDesktop ? 'left' : 'bottom' }}
      tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Approvals' }} />
      <Tabs.Screen name="teams" options={{ title: 'Teams' }} />
    </Tabs>
  );
}
