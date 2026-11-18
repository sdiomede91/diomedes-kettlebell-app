import { Stack } from 'expo-router';

import { Font, usePalette } from '@/theme';

export default function CatalogLayout() {
  const p = usePalette();
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: p.bg },
        headerStyle: { backgroundColor: p.bg },
        headerTintColor: p.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: Font.displaySemi },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: '', headerBackTitle: 'Catalog' }} />
    </Stack>
  );
}
