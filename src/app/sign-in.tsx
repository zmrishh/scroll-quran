import * as AppleAuthentication from 'expo-apple-authentication';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Mark } from '@/components/mark';
import { PrimaryButton } from '@/components/primary-button';
import { PASSAGES, passageRef, surahInfo } from '@/data/content';
import { availableProviders, signInForTesting, signInWithApple, signInWithGoogle, type Providers } from '@/lib/auth';
import { haptic } from '@/lib/feedback';
import { LINKS, openLink } from '@/lib/purchases';
import type { Account } from '@/store/app-store';
import { colors, fonts } from '@/theme/tokens';

const VERSE = PASSAGES.find((p) => p.id === '2:152')!;

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromOnboarding = from === 'onboarding';
  const [providers, setProviders] = useState<Providers | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    availableProviders().then(setProviders);
  }, []);

  const run = async (signIn: () => Promise<Account | null>) => {
    if (busy) return;
    setBusy(true);
    const account = await signIn();
    setBusy(false);
    if (!account) return;
    haptic.success();
    router.replace('/');
    // A new account goes on to Plus; someone signing back in goes straight to their feed.
    if (fromOnboarding) setTimeout(() => router.push('/paywall'), 450);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
      <StatusBar style="light" />
      <View style={styles.inner}>
        <View style={styles.hero}>
          <Mark size={68} draw duration={1000} />
          <Animated.Text entering={FadeIn.delay(500).duration(600)} style={styles.wordmark}>
            Scroll Quran
          </Animated.Text>
          <Animated.View entering={FadeIn.delay(900).duration(900)} style={styles.verse}>
            <Text style={styles.arabic}>{VERSE.ayat[0].ar}</Text>
            <Text style={styles.english}>{VERSE.ayat[0].en}</Text>
            <View style={styles.source}>
              <Text style={styles.sourceArabic}>{surahInfo(VERSE.surah).arabic}</Text>
              <Text style={styles.sourceRef}>{passageRef(VERSE)}</Text>
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Text style={styles.h1}>{fromOnboarding ? 'Save your plan' : 'Welcome back'}</Text>
          <Text style={styles.sub}>
            {fromOnboarding
              ? 'Sign in so Plus follows you to any phone. What you read and write stays private, on this phone.'
              : 'Sign in to pick up where you left off.'}
          </Text>

          <View style={[styles.buttons, busy && { opacity: 0.6 }]} pointerEvents={busy ? 'none' : 'auto'}>
            {providers?.apple && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={14}
                style={styles.apple}
                onPress={() => run(signInWithApple)}
              />
            )}
            {providers?.google && <GoogleButton onPress={() => run(signInWithGoogle)} />}
            {providers?.test && <PrimaryButton tone="quiet" label="Continue as test user (development)" onPress={() => run(signInForTesting)} />}
          </View>

          <Text style={styles.legal}>
            By continuing you agree to the{' '}
            <Text style={styles.legalLink} onPress={() => openLink(LINKS.terms)}>
              Terms of Use
            </Text>{' '}
            and{' '}
            <Text style={styles.legalLink} onPress={() => openLink(LINKS.privacy)}>
              Privacy Policy
            </Text>
            .
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

/** Google's standard light sign-in button: white, with the four-colour G. */
function GoogleButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptic.medium();
        onPress();
      }}
      style={({ pressed }) => [styles.google, pressed && { opacity: 0.85 }]}>
      <Svg width={19} height={19} viewBox="0 0 48 48">
        <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </Svg>
      <Text style={styles.googleText}>Continue with Google</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  inner: { flex: 1, paddingHorizontal: 28, maxWidth: 520, width: '100%', alignSelf: 'center' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontFamily: fonts.read, fontSize: 30, color: colors.text, marginTop: 18 },
  verse: { marginTop: 36, alignItems: 'center' },
  arabic: { fontFamily: fonts.quran, fontSize: 28, lineHeight: 56, color: colors.text, textAlign: 'center', writingDirection: 'rtl' },
  english: { fontFamily: fonts.readItalic, fontSize: 17, lineHeight: 26, color: colors.read, textAlign: 'center', marginTop: 10 },
  source: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  sourceArabic: { fontFamily: fonts.arabic, fontSize: 15, lineHeight: 28, color: colors.gold },
  sourceRef: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet },
  h1: { fontFamily: fonts.read, fontSize: 28, lineHeight: 36, color: colors.text },
  sub: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: colors.quiet, marginTop: 6 },
  buttons: { gap: 12, marginTop: 22 },
  apple: { width: '100%', height: 54 },
  google: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleText: { fontFamily: fonts.uiMedium, fontSize: 17, color: '#1F1F1F' },
  legal: { fontFamily: fonts.ui, fontSize: 12.5, lineHeight: 18, color: colors.faint, textAlign: 'center', marginTop: 16 },
  legalLink: { color: colors.quiet, textDecorationLine: 'underline' },
});
