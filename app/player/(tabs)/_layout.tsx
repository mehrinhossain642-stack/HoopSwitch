import { Tabs } from 'expo-router';
import { TabBar } from '../../../components/TabBar';
import { useLayout } from '../../../lib/layout';

export default function PlayerTabsLayout() {
  const { isDesktop } = useLayout();

  return (
    <Tabs
      // Moves the navigator into a row layout so TabBar can render its left rail.
      screenOptions={{ headerShown: false, tabBarPosition: isDesktop ? 'left' : 'bottom' }}
      tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Openings' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
