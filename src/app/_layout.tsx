import { Amiri_700Bold } from '@expo-google-fonts/amiri';
import { AmiriQuran_400Regular } from '@expo-google-fonts/amiri-quran';
import { InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold } from '@expo-google-fonts/inter-tight';
import { Literata_400Regular, Literata_400Regular_Italic, Literata_500Medium } from '@expo-google-fonts/literata';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { setupPurchases } from '@/lib/purchases';
import { useApp } from '@/store/app-store';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.page, card: colors.page, primary: colors.text },
};

/**
 * Shown instead of a blank screen if anything below crashes. Uses system fonts on purpose,
 * since the crash may have happened before the app's fonts loaded.
 */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.page, justifyContent: 'center', paddingHorizontal: 28 }}>
      <Text style={{ fontSize: 22, color: colors.text, fontWeight: '500' }}>Something went wrong.</Text>
      <Text style={{ fontSize: 15, lineHeight: 22, color: colors.read, marginTop: 8 }}>
        Your saved cards and reflections are safe on this phone.
      </Text>
      <Pressable
        onPress={retry}
        style={{ marginTop: 24, height: 50, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 16, color: colors.page, fontWeight: '500' }}>Try again</Text>
      </Pressable>
    </View>
  );
}

function useHydrated() {
  const [hydrated, setHydrated] = useState(() => useApp.persist.hasHydrated());
  useEffect(() => useApp.persist.onFinishHydration(() => setHydrated(true)), []);
  return hydrated;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    AmiriQuran_400Regular,
    Amiri_700Bold,
    Literata_400Regular,
    Literata_400Regular_Italic,
    Literata_500Medium,
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
  });
  const hydrated = useHydrated();
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // After hydration, so the subscription status from the store isn't overwritten by the saved one.
  useEffect(() => {
    if (hydrated) setupPurchases();
  }, [hydrated]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.page }}>
      <ThemeProvider value={theme}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.page } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="card/[key]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="about" options={{ presentation: 'modal' }} />
          <Stack.Screen name="surah/[n]" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
