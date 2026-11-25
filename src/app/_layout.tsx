import { Cinzel_600SemiBold, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { Palettes } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const [loaded] = useFonts({ Cinzel_600SemiBold, Cinzel_700Bold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  const p = scheme === 'dark' ? Palettes.dark : Palettes.light;
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, background: p.bg, card: p.surface, text: p.text, border: p.border, primary: p.accent },
  };

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout" />
        <Stack.Screen name="session" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="complete" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      </Stack>
    </ThemeProvider>
  );
}
