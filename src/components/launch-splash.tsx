import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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

import { InkText } from './ink-text';
import { BRAND, Logo } from './logo';

// The app's own parchment, so the launch hands over to the first page without a change of light. The mark's ivory
// page would vanish on it, so here that page is emerald, the icon's other colour.
const PAGE = palettes.light.page;
const GROUND = { color: PAGE, rgb: palettes.light.pageRgb };
const GOLD = palettes.light.gold;

// The native launch screen (app.json) shows the mark this wide, so the first frame here is the same picture.
const MARK = 128;
const ORNAMENT = 46;
// Where things sit, from the middle of the screen: the mark above the name, the line below it.
const ORNAMENT_Y = -84;
const WORD_SIZE = 44;
const WORD_Y = -4;
const LINE_Y = 44;

// One clock, in milliseconds. Each part reads its own stretch of it; the name writes itself on its own timing.
const SETTLE = { at: 150, for: 750 };
const RULES = { at: 600, for: 700 };
const WRITE_AT = 820;
const LINE = { at: 1550, for: 700 };
const EXIT = { at: 2400, for: 500 };
const END = EXIT.at + EXIT.for;

const part = (t: number, p: { at: number; for: number }) => {
  'worklet';
  return Math.min(1, Math.max(0, (t - p.at) / p.for));
};
const inOut = (x: number) => {
  'worklet';
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const out = (x: number) => {
  'worklet';
  return 1 - Math.pow(1 - x, 3);
};

/**
 * Opens the app like a title page: the mark from the launch screen settles into a small monogram between two gold
 * hairlines, the name writes itself in beneath it, and one quiet line follows. About three seconds; a tap skips to the
 * end, and with Reduce Motion it appears whole and fades.
 */
export function LaunchSplash({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const { width: screen } = useWindowDimensions();
  const clock = useSharedValue(reduce ? EXIT.at : 0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const run = (from: number, delay = 0) => {
    clearTimeout(timer.current);
    clock.set(from);
    clock.set(withDelay(delay, withTiming(END, { duration: END - from, easing: Easing.linear })));
    timer.current = setTimeout(onDone, delay + END - from);
  };

  useEffect(() => {
    // With Reduce Motion everything is already in place; it holds a moment, then fades.
    if (reduce) run(EXIT.at, 900);
    else run(0);
    return () => clearTimeout(timer.current);
    // Runs once, on launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    if (clock.get() < EXIT.at) run(EXIT.at);
  };

  const page = useAnimatedStyle(() => ({ opacity: 1 - out(part(clock.get(), EXIT)) }));
  const lift = useAnimatedStyle(() => ({ transform: [{ translateY: -12 * out(part(clock.get(), EXIT)) }] }));
  const mark = useAnimatedStyle(() => {
    const p = inOut(part(clock.get(), SETTLE));
    return { transform: [{ translateY: ORNAMENT_Y * p }, { scale: 1 + (ORNAMENT / MARK - 1) * p }] };
  });
  const line = useAnimatedStyle(() => {
    const p = out(part(clock.get(), LINE));
    return { opacity: p, transform: [{ translateY: 6 * (1 - p) }] };
  });

  const ruleLength = Math.min(104, screen * 0.22);

  return (
    <Animated.View style={[styles.screen, page]} accessible accessibilityLabel="Scroll Quran">
      <Pressable style={styles.fill} onPress={skip}>
        <Animated.View style={[styles.fill, lift]}>
          <View style={[styles.row, { top: '50%', marginTop: ORNAMENT_Y }]}>
            <Rule clock={clock} side="left" length={ruleLength} />
            <View style={{ width: ORNAMENT * 0.6 + 28 }} />
            <Rule clock={clock} side="right" length={ruleLength} />
          </View>

          <View style={[styles.row, { top: '50%', marginTop: WORD_Y - (WORD_SIZE * 1.25) / 2 }]}>
            <InkText delay={reduce ? 0 : WRITE_AT} speed={2.6} ground={GROUND} style={styles.word}>
              Scroll <Text style={styles.wordEm}>Quran</Text>
            </InkText>
          </View>

          <Animated.Text style={[styles.line, { top: '50%', marginTop: LINE_Y }, line]}>One verse at a time.</Animated.Text>
        </Animated.View>

        <View style={styles.markLayer} pointerEvents="none">
          <Animated.View style={mark}>
            <Logo size={MARK} ivory={BRAND.emerald} />
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** A gold hairline drawn out from the mark, fading towards its far end. */
function Rule({ clock, side, length }: { clock: SharedValue<number>; side: 'left' | 'right'; length: number }) {
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: out(part(clock.get(), RULES)) }] }));
  const clear = `rgba(${GROUND.rgb},0)`;
  return (
    <Animated.View style={[{ width: length, height: 1, transformOrigin: side === 'left' ? 'right' : 'left' }, style]}>
      <LinearGradient
        colors={side === 'left' ? [clear, GOLD] : [GOLD, clear]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 1000, backgroundColor: PAGE },
  fill: { flex: 1 },
  row: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  markLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  word: { fontFamily: fonts.read, fontSize: WORD_SIZE, lineHeight: WORD_SIZE * 1.25, color: palettes.light.text, letterSpacing: -0.4 },
  wordEm: { fontFamily: fonts.readItalic, color: GOLD },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.readItalic,
    fontSize: 17,
    color: palettes.light.quiet,
  },
});
