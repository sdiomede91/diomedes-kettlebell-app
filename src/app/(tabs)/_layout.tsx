import { Tabs } from 'expo-router/tabs';

import { GearIcon, GridIcon, KettlebellIcon, LogIcon } from '@/components/icons';
import { Font, usePalette } from '@/theme';

export default function TabLayout() {
  const p = usePalette();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.text,
        tabBarInactiveTintColor: p.textMuted,
        tabBarStyle: { backgroundColor: p.surface, borderTopColor: p.border },
        tabBarLabelStyle: { fontFamily: Font.semibold, fontSize: 11, letterSpacing: 0.5 },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ color }) => <KettlebellIcon color={color} /> }} />
      <Tabs.Screen name="catalog" options={{ title: 'Catalog', tabBarIcon: ({ color }) => <GridIcon color={color} /> }} />
      <Tabs.Screen name="log" options={{ title: 'Log', tabBarIcon: ({ color }) => <LogIcon color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <GearIcon color={color} /> }} />
    </Tabs>
  );
}
