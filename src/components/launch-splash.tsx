import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
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

import { PASSAGES } from '@/data/content';
import { fonts, palettes } from '@/theme/tokens';

import { Mark } from './mark';

const BASMALA = PASSAGES.find((p) => p.surah === 1)?.ayat[0].ar ?? '';
const PAGE = palettes.light.page;
const GOLD = palettes.light.gold;

// The native launch screen shows the mark at this size on parchment, so the first frame here is the same picture.
const MARK = 120;
const ORNAMENT = 22;
// The soft leading edge of the writing.
const EDGE = 36;
const SLACK = 4;
// How far the Amiri Quran line reaches above and below the middle of its line, in ems: the tails of ra, mim and
// the kasras go deeper than the alifs and marks go high.
const ASCENT = 0.72;
const DESCENT = 1.28;

/**
 * Where everything sits, from the screen's centre: the Basmala a little above it, as a title page sets its heading;
 * the ornament and rule above the line, the name below, each spaced from the ink rather than from the line box.
 */
function layoutFor(screen: number) {
  const size = Math.min(46, Math.max(26, screen * 0.1));
  const line = -12;
  return {
    size,
    line,
    ornament: line - ASCENT * size - 40,
    name: line + DESCENT * size + 32,
    rule: Math.min(120, screen * 0.26),
  };
}

// One clock, in milliseconds. Each part reads its own stretch of it.
const SETTLE = { at: 100, for: 650 };
const RULES = { at: 480, for: 620 };
const WRITE = { at: 640, for: 1100 };
const NAME = { at: 1500, for: 500 };
const EXIT = { at: 2200, for: 420 };
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
 * Opens the app the way a reading opens: the mark from the launch screen settles into a gold rule, and the Basmala is
 * written in beneath it, right to left as a pen would. About 2.6 seconds, a tap skips to the end; with Reduce Motion it
 * appears whole and fades.
 */
export function LaunchSplash({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const { width: screen } = useWindowDimensions();
  const clock = useSharedValue(reduce ? EXIT.at : 0);
  const [width, setWidth] = useState(0);
  const inkWidth = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const run = (from: number, delay = 0) => {
    clearTimeout(timer.current);
    clock.set(from);
    clock.set(withDelay(delay, withTiming(END, { duration: END - from, easing: Easing.linear })));
    timer.current = setTimeout(onDone, delay + END - from);
  };

  useEffect(() => {
    // With Reduce Motion everything is already in place; it holds a moment, then fades.
    if (reduce) run(EXIT.at, 700);
    else run(0);
    return () => clearTimeout(timer.current);
    // Runs once, on launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    if (clock.get() < EXIT.at) run(EXIT.at);
  };

  const page = useAnimatedStyle(() => ({ opacity: 1 - out(part(clock.get(), EXIT)) }));
  const lift = useAnimatedStyle(() => ({ transform: [{ translateY: -10 * out(part(clock.get(), EXIT)) }] }));
  const at = layoutFor(screen);
  const mark = useAnimatedStyle(() => {
    const p = inOut(part(clock.get(), SETTLE));
    return { transform: [{ translateY: at.ornament * p }, { scale: 1 + (ORNAMENT / MARK - 1) * p }] };
  });
  const name = useAnimatedStyle(() => {
    const p = out(part(clock.get(), NAME));
    return { opacity: p, transform: [{ translateY: 6 * (1 - p) }] };
  });

  return (
    <Animated.View style={[styles.screen, page]} accessible accessibilityLabel="Scroll Quran">
      <Pressable style={styles.fill} onPress={skip}>
        <Animated.View style={[styles.fill, lift]}>
          <View style={[styles.row, { top: '50%', marginTop: at.ornament }]}>
            <Rule clock={clock} side="left" length={at.rule} />
            <View style={{ width: ORNAMENT + 24 }} />
            <Rule clock={clock} side="right" length={at.rule} />
          </View>

          <View style={[styles.row, styles.center, { transform: [{ translateY: at.line }] }]}>
            <View>
              {/* Lays out the line and measures it; the writing goes over it. */}
              <Text
                style={[styles.basmala, lineStyle(at.size), styles.ghost]}
                numberOfLines={1}
                onLayout={(e) => {
                  inkWidth.set(e.nativeEvent.layout.width);
                  setWidth(e.nativeEvent.layout.width);
                }}>
                {BASMALA}
              </Text>
              {width > 0 && <Writing clock={clock} width={width} inkWidth={inkWidth} size={at.size} />}
            </View>
          </View>

          <Animated.Text style={[styles.name, { top: '50%', marginTop: at.name }, name]}>Scroll Quran</Animated.Text>
        </Animated.View>

        <View style={styles.markLayer} pointerEvents="none">
          <Animated.View style={mark}>
            <Mark size={MARK} />
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * The Basmala revealed from right to left. A window slides across the line while the line itself stays put, and a
 * fade at the window's leading edge stands in for ink taking to the page.
 */
function Writing({ clock, width, inkWidth, size }: { clock: SharedValue<number>; width: number; inkWidth: SharedValue<number>; size: number }) {
  const at = (t: number) => {
    'worklet';
    // From a full edge past the right end of the line (letters can overhang it) to a full edge past its left end.
    const w = inkWidth.get();
    return w + EDGE - (w + 2 * EDGE) * inOut(part(t, WRITE));
  };
  const window = useAnimatedStyle(() => ({ transform: [{ translateX: at(clock.get()) }] }));
  const ink = useAnimatedStyle(() => ({ transform: [{ translateX: -at(clock.get()) }] }));

  return (
    <Animated.View style={[styles.window, { width: width + 2 * EDGE }, window]}>
      {/* A little wider than measured, centred on the same spot, so rounding never cuts the line short. */}
      <Animated.View style={[{ width: width + SLACK * 2, marginLeft: -SLACK }, ink]}>
        <Text style={[styles.basmala, lineStyle(size)]} numberOfLines={1}>
          {BASMALA}
        </Text>
      </Animated.View>
      <LinearGradient
        colors={[PAGE, `rgba(${palettes.light.pageRgb},0)`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.edge}
      />
    </Animated.View>
  );
}

// Padding above and below keeps the tails and marks inside the window that does the writing, which clips.
const lineStyle = (size: number) => ({ fontSize: size, lineHeight: size * 2.1, paddingVertical: size * 0.5 });

/** A gold hairline drawn out from the ornament, fading towards its far end. */
function Rule({ clock, side, length }: { clock: SharedValue<number>; side: 'left' | 'right'; length: number }) {
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: out(part(clock.get(), RULES)) }] }));
  const clear = `rgba(${palettes.light.pageRgb},0)`;
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
  center: { top: 0, bottom: 0 },
  markLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  basmala: { fontFamily: fonts.quran, color: palettes.light.text, writingDirection: 'rtl', textAlign: 'center' },
  ghost: { opacity: 0 },
  window: { position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden' },
  edge: { position: 'absolute', top: 0, bottom: 0, left: 0, width: EDGE },
  name: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.uiMedium,
    fontSize: 12.5,
    letterSpacing: 3.2,
    // Letter spacing trails the last letter too; this evens it out so the name sits on the centre line.
    paddingLeft: 3.2,
    textTransform: 'uppercase',
    color: GOLD,
  },
});
