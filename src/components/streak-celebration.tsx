import { useEffect } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptic } from '@/lib/feedback';
import { useApp } from '@/store/app-store';
import { useCelebration } from '@/store/celebration';
import { makeStyles, useColors } from '@/theme/theme';
import { fonts, layout } from '@/theme/tokens';

import { BRAND, Logo } from './logo';
import { PrimaryButton } from './primary-button';

const BURST_AT = 250;
const FLIP_AT = 800;
const DOT_AT = 1200;
const NUMBER_HEIGHT = 104;
// On short screens (an iPhone SE, small Androids) the burst, the number and the gaps shrink so the week row and the
// buttons beneath still fit.
const SHORT_SCREEN = 720;
const SHORT_NUMBER_HEIGHT = 80;
const SPARKS = 20;

const MILESTONES: Record<number, string> = {
  1: 'Day one. Come back tomorrow to make it two.',
  3: 'Three days in a row. A habit is forming.',
  7: 'A full week with the Quran.',
  14: 'Two weeks without missing a day.',
  30: 'A month of daily reading. Ma sha Allah.',
  50: 'Fifty days. Ma sha Allah.',
  100: 'One hundred days with the Quran.',
  365: 'A whole year, every single day.',
};

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Shown over everything the moment a day's reading goal is reached. */
export function StreakCelebration() {
  const streak = useCelebration((s) => s.streak);
  if (!streak) return null;
  return <Celebration key={streak} streak={streak} />;
}

function Celebration({ streak }: { streak: number }) {
  const colors = useColors();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const short = useWindowDimensions().height < SHORT_SCREEN;
  const numberHeight = short ? SHORT_NUMBER_HEIGHT : NUMBER_HEIGHT;
  const read = useApp((s) => s.viewedToday);
  const activeDays = useApp((s) => s.activeDays);
  const burst = useSharedValue(0);
  const flip = useSharedValue(0);
  const enter = useSharedValue(0);

  useEffect(() => {
    enter.set(withSpring(1, { damping: 14, stiffness: 120 }));
    burst.set(withDelay(BURST_AT, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) })));
    flip.set(withDelay(FLIP_AT, withSpring(1, { damping: 15, stiffness: 140 })));
    const timers = [setTimeout(haptic.medium, BURST_AT), setTimeout(haptic.success, FLIP_AT)];
    return () => timers.forEach(clearTimeout);
  }, [burst, flip, enter]);

  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.55 + 0.45 * enter.get() }, { rotate: `${-90 * (1 - enter.get())}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, burst.get() * 2) * 0.9, transform: [{ scale: 0.7 + 0.3 * burst.get() }] }));
  const oldNumber = useAnimatedStyle(() => ({ transform: [{ translateY: -numberHeight * flip.get() }], opacity: 1 - flip.get() }));
  const newNumber = useAnimatedStyle(() => ({ transform: [{ translateY: numberHeight * (1 - flip.get()) }], opacity: flip.get() }));

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: dayKey(d), label: d.toLocaleDateString('en', { weekday: 'narrow' }), today: i === 6 };
  });
  const milestone = MILESTONES[streak];

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      style={[styles.backdrop, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
      accessibilityViewIsModal
      accessibilityLabel={`${streak} day streak`}>
      <View style={styles.center}>
        <View style={[styles.burst, short && styles.burstShort]}>
          <Animated.View style={[styles.glow, glowStyle]} />
          <Ring progress={burst} delay={0} />
          <Ring progress={burst} delay={0.18} />
          {Array.from({ length: SPARKS }, (_, i) => (
            <Spark key={i} index={i} progress={burst} />
          ))}
          <Animated.View style={markStyle}>
            <View style={[styles.tile, short && styles.tileShort]}>
              <Logo size={86} />
            </View>
          </Animated.View>
        </View>

        <View style={[styles.numberBox, { height: numberHeight }]}>
          <Animated.Text style={[styles.number, short && styles.numberShort, oldNumber]}>{streak - 1}</Animated.Text>
          <Animated.Text style={[styles.number, short && styles.numberShort, styles.numberNew, newNumber]}>{streak}</Animated.Text>
        </View>
        <Animated.Text entering={FadeIn.delay(FLIP_AT).duration(400)} style={styles.label}>
          day streak
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(FLIP_AT + 150).duration(400)} style={[styles.message, short && styles.messageShort]}>
          {milestone ?? `You read your ${read} cards today. See you tomorrow for day ${streak + 1}.`}
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(FLIP_AT + 250).duration(400)} style={[styles.week, short && styles.weekShort]}>
          {week.map((d) => (
            <View key={d.key} style={styles.day}>
              {d.today ? <TodayDot /> : <View style={[styles.dot, activeDays.includes(d.key) && styles.dotOn]} />}
              <Text style={[styles.dayLabel, d.today && { color: colors.text }]}>{d.label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(DOT_AT + 200).duration(400)} style={styles.footer}>
        <PrimaryButton label="Continue" onPress={() => useCelebration.setState({ streak: 0 })} />
      </Animated.View>
    </Animated.View>
  );
}

/** A ring of light that widens and fades from behind the mark. */
function Ring({ progress, delay }: { progress: SharedValue<number>; delay: number }) {
  const styles = useStyles();
  const style = useAnimatedStyle(() => {
    const p = Math.max(0, (progress.get() - delay) / (1 - delay));
    return { opacity: p === 0 ? 0 : 0.7 * (1 - p), transform: [{ scale: 0.6 + 1.9 * p }] };
  });
  return <Animated.View style={[styles.ring, style]} />;
}

/** A small gold diamond thrown outwards. Angles and distances vary by index so the burst isn't a perfect circle. */
function Spark({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const styles = useStyles();
  const angle = (index / SPARKS) * Math.PI * 2 + ((index * 7) % 5) * 0.06;
  const distance = 92 + ((index * 37) % 56);
  const size = 4 + ((index * 3) % 4);
  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: p < 0.12 ? p / 0.12 : Math.max(0, 1 - (p - 0.12) / 0.88),
      transform: [
        { translateX: Math.cos(angle) * distance * p },
        { translateY: Math.sin(angle) * distance * p },
        { rotate: '45deg' },
        { scale: 1 - 0.5 * p },
      ],
    };
  });
  return <Animated.View style={[styles.spark, { width: size, height: size }, style]} />;
}

function TodayDot() {
  const styles = useStyles();
  const pop = useSharedValue(0);
  useEffect(() => {
    pop.set(withDelay(DOT_AT, withSequence(withTiming(1.3, { duration: 180 }), withSpring(1, { damping: 8 }))));
  }, [pop]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));
  return (
    <View style={[styles.dot, styles.dotToday]}>
      <Animated.View style={[styles.dotFill, style]} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 100, backgroundColor: colors.page, paddingHorizontal: layout.gutter },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  burst: { width: 300, height: 260, alignItems: 'center', justifyContent: 'center' },
  burstShort: { height: 176 },
  glow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: colors.goldSoft },
  // The app icon itself: the mark's ivory page needs the emerald behind it to show on a light page.
  tile: { width: 112, height: 112, borderRadius: 26, backgroundColor: BRAND.emerald, alignItems: 'center', justifyContent: 'center' },
  tileShort: { transform: [{ scale: 0.78 }] },
  ring: { position: 'absolute', width: 130, height: 130, borderRadius: 65, borderWidth: 1.5, borderColor: colors.gold },
  spark: { position: 'absolute', backgroundColor: colors.gold, borderRadius: 1 },
  numberBox: { height: NUMBER_HEIGHT, overflow: 'hidden', alignSelf: 'stretch', marginTop: -8 },
  number: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontFamily: fonts.read,
    fontSize: 88,
    lineHeight: NUMBER_HEIGHT,
    color: colors.quiet,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  numberNew: { color: colors.gold },
  numberShort: { fontSize: 66, lineHeight: SHORT_NUMBER_HEIGHT },
  label: { fontFamily: fonts.uiMedium, fontSize: 17, color: colors.text, marginTop: 2 },
  message: { fontFamily: fonts.read, fontSize: 18, lineHeight: 27, color: colors.read, textAlign: 'center', marginTop: 14, maxWidth: 320 },
  messageShort: { fontSize: 16.5, lineHeight: 24, marginTop: 10 },
  week: { flexDirection: 'row', gap: 14, marginTop: 30 },
  weekShort: { marginTop: 18 },
  day: { alignItems: 'center', gap: 7 },
  dot: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  dotOn: { backgroundColor: colors.gold },
  dotToday: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.gold },
  dotFill: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.gold },
  dayLabel: { fontFamily: fonts.ui, fontSize: 12, color: colors.faint },
  footer: { width: '100%', maxWidth: 420, alignSelf: 'center' },
}));
