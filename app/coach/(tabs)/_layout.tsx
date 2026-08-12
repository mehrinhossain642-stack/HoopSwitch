import { Tabs } from 'expo-router';
import { TabBar } from '../../../components/TabBar';
import { useLayout } from '../../../lib/layout';

export default function CoachTabsLayout() {
  const { isDesktop } = useLayout();

  return (
    <Tabs
      // Moves the navigator to a row layout so TabBar can render its left rail.
      screenOptions={{ headerShown: false, tabBarPosition: isDesktop ? 'left' : 'bottom' }}
      tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Talent' }} />
      <Tabs.Screen name="profile" options={{ title: 'Team' }} />
    </Tabs>
  );
}
