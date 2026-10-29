import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { fonts, palettes } from '@/theme/tokens';

import { Mark } from './mark';

// The native launch screen is parchment with the mark at this size, so the animation starts exactly where it left off.
const PAGE = palettes.light.page;
const MARK = 120;
const INTRO_MS = 1100;
const HOLD_MS = 250;
const OUT_MS = 450;

/**
 * Carries on from the phone's static launch screen: the ۞ turns into place as rings of light go out from it, the name
 * rises beneath, then everything lifts away to show the app. About 1.8 seconds; a quick fade with Reduce Motion on.
 */
export function LaunchSplash({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const intro = useSharedValue(reduce ? 1 : 0);
  const out = useSharedValue(0);

  useEffect(() => {
    if (!reduce) intro.set(withTiming(1, { duration: INTRO_MS, easing: Easing.out(Easing.cubic) }));
    const start = reduce ? 0 : INTRO_MS + HOLD_MS;
    const length = reduce ? 250 : OUT_MS;
    out.set(withDelay(start, withTiming(1, { duration: length, easing: Easing.in(Easing.cubic) })));
    const timer = setTimeout(onDone, start + length);
    return () => clearTimeout(timer);
    // Runs once, on launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const screen = useAnimatedStyle(() => ({ opacity: 1 - out.get() }));
  // A quarter turn lands the eight-pointed star back on itself, so it reads as the mark settling into place.
  const mark = useAnimatedStyle(() => ({
    transform: [{ rotate: `${90 * (1 - intro.get())}deg` }, { scale: 1 + 0.18 * out.get() }],
  }));
  const glow = useAnimatedStyle(() => ({ opacity: 0.9 * Math.min(1, intro.get() * 1.6) * (1 - out.get()) }));
  const name = useAnimatedStyle(() => {
    const p = Math.max(0, Math.min(1, (intro.get() - 0.35) / 0.5));
    return { opacity: p, transform: [{ translateY: 10 * (1 - p) }] };
  });

  return (
    <Animated.View style={[styles.screen, screen]} pointerEvents="none" accessibilityLabel="Scroll Quran">
      <View style={styles.center}>
        <Animated.View style={[styles.glow, glow]} />
        {!reduce && <Ring progress={intro} delay={0.1} />}
        {!reduce && <Ring progress={intro} delay={0.3} />}
        <Animated.View style={mark}>
          <Mark size={MARK} />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.name, name]}>Scroll Quran</Animated.Text>
    </Animated.View>
  );
}

/** A thin gold ring that widens from the mark and fades. */
function Ring({ progress, delay }: { progress: SharedValue<number>; delay: number }) {
  const style = useAnimatedStyle(() => {
    const p = Math.max(0, (progress.get() - delay) / (1 - delay));
    return { opacity: p === 0 ? 0 : 0.55 * (1 - p), transform: [{ scale: 0.9 + 1.4 * p }] };
  });
  return <Animated.View style={[styles.ring, style]} />;
}

const styles = StyleSheet.create({
  screen: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 1000, backgroundColor: PAGE },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: palettes.light.goldSoft },
  ring: { position: 'absolute', width: MARK, height: MARK, borderRadius: MARK / 2, borderWidth: 1.5, borderColor: palettes.light.gold },
  // Below the mark without moving it off-centre, so the mark stays exactly where the launch screen put it.
  name: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: MARK / 2 + 28,
    textAlign: 'center',
    fontFamily: fonts.read,
    fontSize: 28,
    color: palettes.light.text,
  },
});
