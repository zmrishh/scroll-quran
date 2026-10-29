import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { ArtPanel } from '@/components/art';
import { availableProviders, signInForTesting, signInWithApple, signInWithGoogle, type Providers } from '@/lib/auth';
import { haptic } from '@/lib/feedback';
import type { Account } from '@/store/app-store';
import { makeStyles, useColors } from '@/theme/theme';
import { eyebrow, fonts, layout } from '@/theme/tokens';

type Mode = 'up' | 'in';

/**
 * Sign up and sign in. With Apple and Google both are the same step (a new account is made the first time), so the
 * modes only change the words; people still expect to see which one they're doing.
 */
export default function SignIn() {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromOnboarding = from === 'onboarding';
  const [mode, setMode] = useState<Mode>(fromOnboarding ? 'up' : 'in');
  const [providers, setProviders] = useState<Providers | null>(null);
  const [busy, setBusy] = useState(false);
  const up = mode === 'up';

  useEffect(() => {
    availableProviders().then(setProviders);
  }, []);

  // After onboarding, on to the feed and Plus; from the You tab, back to where they were.
  const leave = () => {
    if (fromOnboarding) {
      router.replace('/');
      setTimeout(() => router.push('/paywall'), 450);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const run = async (signIn: () => Promise<Account | null>) => {
    if (busy) return;
    setBusy(true);
    const account = await signIn();
    setBusy(false);
    if (!account) return;
    haptic.success();
    leave();
  };

  // Apple works on iPhone; Google needs native setup that Expo Go and the browser don't have. Development builds still
  // show both so the page can be seen finished; release builds only show what works.
  const showApple = providers?.apple || (__DEV__ && providers !== null);
  const showGoogle = providers?.google || (__DEV__ && providers !== null);
  const unavailable = (title: string, why: string) => (Platform.OS === 'web' ? window.alert(`${title}\n\n${why}`) : Alert.alert(title, why));
  const onApple = () => (providers?.apple ? run(signInWithApple) : unavailable('Sign in with Apple isn’t available here', 'It works on iPhone.'));
  const onGoogle = () =>
    providers?.google
      ? run(signInWithGoogle)
      : unavailable('Google sign-in isn’t set up here', 'It works in a development or store build once the Google client IDs are set. See the README.');

  return (
    <View style={styles.screen}>
      <ArtPanel art="blue" caption="bottom" style={{ height: height * 0.4 }} />

      <View style={[styles.inner, { paddingBottom: insets.bottom + 16 }]}>
        <Animated.View entering={FadeInDown.delay(150).duration(450)} style={styles.main}>
          <Text style={styles.brand}>Scroll Quran</Text>
          <Animated.Text key={mode} entering={FadeIn.duration(250)} style={styles.h1}>
            {up ? (fromOnboarding ? 'Save your plan' : 'Create your account') : 'Sign in'}
          </Animated.Text>

          <View style={[styles.buttons, busy && styles.busy]} pointerEvents={busy ? 'none' : 'auto'}>
            {showApple && <AuthButton provider="apple" label={`${up ? 'Sign up' : 'Sign in'} with Apple`} onPress={onApple} />}
            {showGoogle && <AuthButton provider="google" label={`${up ? 'Sign up' : 'Sign in'} with Google`} onPress={onGoogle} />}
          </View>

          {busy && <ActivityIndicator color={colors.gold} style={styles.spinner} />}

          <Text style={styles.switch}>
            {up ? 'Already have an account? ' : 'New to Scroll Quran? '}
            <Text
              style={styles.switchLink}
              accessibilityRole="button"
              onPress={() => {
                haptic.tap();
                setMode(up ? 'in' : 'up');
              }}>
              {up ? 'Sign in' : 'Create an account'}
            </Text>
          </Text>
        </Animated.View>

        <View style={styles.foot}>
          <Pressable hitSlop={10} onPress={leave} style={styles.skip} accessibilityRole="button">
            <Text style={styles.skipText}>Not now</Text>
          </Pressable>
          {providers?.test && (
            <Pressable hitSlop={8} onPress={() => run(signInForTesting)} style={styles.skip}>
              <Text style={styles.test}>Test sign-in (development)</Text>
            </Pressable>
          )}
          <Text style={styles.legal}>
            By continuing you agree to the{' '}
            <Text style={styles.legalLink} onPress={() => router.push('/terms')}>
              Terms of Use
            </Text>{' '}
            and{' '}
            <Text style={styles.legalLink} onPress={() => router.push('/privacy')}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </View>
    </View>
  );
}

const APPLE_LOGO =
  'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701';

/**
 * One button for both providers, so they match exactly: same size, corners, type and logo spacing. Black on paper and
 * white at night, as Apple's rules for a custom Sign in with Apple button allow (Apple logo, system font, black or white);
 * Google's coloured G sits on either.
 */
function AuthButton({ provider, label, onPress }: { provider: 'apple' | 'google'; label: string; onPress: () => void }) {
  const styles = useStyles();
  const night = useColors().scheme === 'dark';
  const ink = night ? '#000000' : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptic.medium();
        onPress();
      }}
      style={({ pressed }) => [styles.auth, { backgroundColor: night ? '#FFFFFF' : '#000000' }, pressed && { opacity: 0.8 }]}>
      <View style={styles.logo}>
        {provider === 'apple' ? (
          <Svg width={19} height={19} viewBox="0 0 24 24">
            <Path fill={ink} d={APPLE_LOGO} />
          </Svg>
        ) : (
          <Svg width={18} height={18} viewBox="0 0 48 48">
            <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </Svg>
        )}
      </View>
      <Text style={[styles.authText, { color: ink }]}>{label}</Text>
    </Pressable>
  );
}

const BUTTON_HEIGHT = 54;

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.page },
  inner: { flex: 1, paddingHorizontal: layout.gutter, maxWidth: 520, width: '100%', alignSelf: 'center' },
  main: { flex: 1, justifyContent: 'center' },
  brand: { ...eyebrow, color: colors.gold },
  h1: { fontFamily: fonts.read, fontSize: 28, lineHeight: 36, color: colors.text, marginTop: 8 },
  buttons: { gap: 12, marginTop: 24 },
  busy: { opacity: 0.5 },
  auth: {
    height: BUTTON_HEIGHT,
    borderRadius: layout.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logo: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  // The system font (San Francisco on iPhone), as Apple asks of custom Sign in with Apple buttons; Google's matches it.
  authText: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2 },
  spinner: { marginTop: 16 },
  switch: { fontFamily: fonts.ui, fontSize: 14.5, color: colors.quiet, textAlign: 'center', marginTop: 20 },
  switchLink: { fontFamily: fonts.uiMedium, color: colors.gold },
  foot: { alignItems: 'center', gap: 10 },
  skip: { paddingVertical: 4 },
  skipText: { fontFamily: fonts.uiMedium, fontSize: 15, color: colors.read },
  test: { fontFamily: fonts.ui, fontSize: 13, color: colors.faint, textDecorationLine: 'underline' },
  legal: { fontFamily: fonts.ui, fontSize: 12.5, lineHeight: 18, color: colors.faint, textAlign: 'center', marginTop: 4 },
  legalLink: { color: colors.quiet, textDecorationLine: 'underline' },
}));
