import { Amiri_700Bold } from '@expo-google-fonts/amiri';
import { AmiriQuran_400Regular } from '@expo-google-fonts/amiri-quran';
import { InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold } from '@expo-google-fonts/inter-tight';
import { Literata_400Regular, Literata_400Regular_Italic, Literata_500Medium } from '@expo-google-fonts/literata';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { Appearance, Platform, Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LaunchSplash } from '@/components/launch-splash';
import { StreakCelebration } from '@/components/streak-celebration';
import { startPrayerAlerts } from '@/lib/prayer-alerts';
import { setupPurchases } from '@/lib/purchases';
import { useApp } from '@/store/app-store';
import { PaletteOverride, ThemedStatusBar, useColors, useFeedColors, useThemeColors } from '@/theme/theme';
import { palettes } from '@/theme/tokens';

// The screens that open as a sheet, with the tab they were opened from still showing behind them.
const SHEET = /^\/(paywall|about|privacy|terms|prayer-times|styles)\b/;

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Shown instead of a blank screen if anything below crashes. Uses system fonts on purpose,
 * since the crash may have happened before the app's fonts loaded.
 */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.page, justifyContent: 'center', paddingHorizontal: 28 }}>
      <Text style={{ fontSize: 22, color: colors.text, fontWeight: '500' }}>Something went wrong.</Text>
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
  const colors = useColors();
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
  const appearance = useApp((s) => s.appearance);
  // The animated launch plays once, as the native splash hands over.
  const [launching, setLaunching] = useState(true);
  const base = colors.scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, background: colors.page, card: colors.page, primary: colors.text } };

  // Native pieces (alerts, the keyboard, pickers) follow the app's choice rather than the phone's.
  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme(appearance === 'system' ? 'unspecified' : appearance);
  }, [appearance]);

  // Two kinds of screen don't take the palette in use. The feed, and a single card opened on its own, have colours
  // of their own in a card style's world (useFeedColors). The intro is always in the app's own theme: it comes before
  // a style is chosen, and can be replayed afterwards. What is drawn over them (the status bar, the streak
  // celebration, a sheet opened from the intro) and the window behind them go with them. `under` remembers which
  // kind a sheet was opened over.
  const pathname = usePathname();
  const feed = useFeedColors();
  const plain = useThemeColors();
  const cards = pathname === '/' || pathname.startsWith('/card/');
  const kind = pathname.startsWith('/onboarding') ? 'intro' : cards ? 'cards' : 'other';
  const sheet = SHEET.test(pathname);
  const [under, setUnder] = useState(kind);
  if (!sheet && under !== kind) setUnder(kind);
  const below = sheet ? under : kind;
  const behind = below === 'intro' ? plain.page : below === 'cards' && feed ? feed.page : colors.page;
  // The launch is on parchment in both themes. On iOS a sheet leaves the status bar over the window behind it.
  const statusInk = launching
    ? palettes.light
    : below === 'intro'
      ? 'base'
      : cards || (below === 'cards' && Platform.OS === 'ios')
        ? feed
        : null;

  // The window itself takes the page's colour. It shows behind a sheet, where iOS shrinks the screen underneath, and
  // while one screen slides over another; left alone it stays the colour it launched with.
  useEffect(() => {
    if (Platform.OS !== 'web') SystemUI.setBackgroundColorAsync(behind).catch(() => {});
  }, [behind]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // After hydration, so the subscription status from the store isn't overwritten by the saved one, and alerts are
  // booked from the saved settings.
  useEffect(() => {
    if (!hydrated) return;
    setupPurchases();
    startPrayerAlerts();
  }, [hydrated]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: behind }}>
      <ThemeProvider value={theme}>
        <PaletteOverride.Provider value={statusInk}>
          <ThemedStatusBar />
        </PaletteOverride.Provider>
        <PaletteOverride.Provider value={below === 'intro' ? 'base' : null}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.page } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false, contentStyle: { backgroundColor: plain.page } }} />
            <Stack.Screen name="sign-in" options={{ animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen
              name="card"
              options={{ presentation: 'fullScreenModal', animation: 'fade', contentStyle: { backgroundColor: (feed ?? colors).page } }}
            />
            <Stack.Screen name="about" options={{ presentation: 'modal' }} />
            <Stack.Screen name="privacy" options={{ presentation: 'modal' }} />
            <Stack.Screen name="terms" options={{ presentation: 'modal' }} />
            <Stack.Screen name="prayer-times" options={{ presentation: 'modal' }} />
            <Stack.Screen name="styles" options={{ presentation: 'modal' }} />
            <Stack.Screen name="surah/[n]" />
          </Stack>
        </PaletteOverride.Provider>
        {/* It comes up over the feed or a card, so it is in their colours. */}
        <PaletteOverride.Provider value={cards ? feed : null}>
          <StreakCelebration />
        </PaletteOverride.Provider>
        {launching && <LaunchSplash onDone={() => setLaunching(false)} />}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
