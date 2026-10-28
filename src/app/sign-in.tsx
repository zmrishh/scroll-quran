import * as AppleAuthentication from 'expo-apple-authentication';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { ArtPanel } from '@/components/art';
import { PrimaryButton } from '@/components/primary-button';
import { availableProviders, signInForTesting, signInWithApple, signInWithGoogle, type Providers } from '@/lib/auth';
import { haptic } from '@/lib/feedback';
import type { Account } from '@/store/app-store';
import { colors, fonts } from '@/theme/tokens';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
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
    <View style={[styles.screen, { paddingBottom: insets.bottom + 20 }]}>
      <StatusBar style="light" />
      <ArtPanel art="blue" caption="bottom" style={{ height: height * 0.46 }} />
      <View style={styles.inner}>
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text style={styles.brand}>Scroll Quran</Text>
          <Text style={styles.h1}>{fromOnboarding ? 'Save your plan' : 'Welcome back'}</Text>

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
            <Text style={styles.legalLink} onPress={() => router.push('/terms')}>
              Terms of Use
            </Text>{' '}
            and{' '}
            <Text style={styles.legalLink} onPress={() => router.push('/privacy')}>
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
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, maxWidth: 520, width: '100%', alignSelf: 'center' },
  brand: { fontFamily: fonts.uiMedium, fontSize: 13, letterSpacing: 1.2, color: colors.gold, textTransform: 'uppercase' },
  h1: { fontFamily: fonts.read, fontSize: 32, lineHeight: 40, color: colors.text, marginTop: 8 },
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
