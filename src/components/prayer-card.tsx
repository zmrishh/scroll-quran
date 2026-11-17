import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { GLOW } from '@/data/art';
import { SCENES } from '@/data/scenes';
import { clock, locate, regionalMethod, schedule, shortClock, until, type LocateResult, type Salah } from '@/lib/prayer';
import { useApp } from '@/store/app-store';
import { makeStyles, PaletteOverride, useColors, useFeedColors, useWorld } from '@/theme/theme';
import { eyebrow, fonts, layout, palettes } from '@/theme/tokens';

import { Icon } from './icon';

/**
 * The colours of the prayer cards. They are windows of light, dark in both themes: in the feed's colours if the
 * card style has a world, so they belong to the rest of the app, and otherwise in the night palette.
 */
export function usePrayerInk() {
  return useFeedColors() ?? palettes.dark;
}

/** The manuscript light behind each prayer, matched to the sky: dawn lapis, midday gold, amber, sunset red, night indigo. */
export const LIGHT: Record<Salah['key'], number> = { fajr: 1, dhuhr: 5, asr: 8, maghrib: 4, isha: 0 };

export const ARABIC: Record<string, string> = {
  Fajr: 'الفجر',
  Dhuhr: 'الظهر',
  'Jumu’ah': 'الجمعة',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

/** The next prayer in its own light, with a countdown and the day's five prayers on a line. */
export function PrayerCard() {
  return (
    <PaletteOverride.Provider value={usePrayerInk()}>
      <Card />
    </PaletteOverride.Provider>
  );
}

function Card() {
  const colors = useColors();
  const styles = useStyles();
  const place = useApp((s) => s.prayerPlace);
  const method = useApp((s) => s.prayerMethod) ?? regionalMethod();
  const asr = useApp((s) => s.asrSchool);
  const alerts = useApp((s) => s.premium && s.prayerAlerts);
  const [now, setNow] = useState(() => new Date());
  const [status, setStatus] = useState<LocateResult | null>(null);

  // The countdown moves on every half minute; a stale place is refreshed quietly.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    locate(false);
    return () => clearInterval(timer);
  }, []);

  if (!place) {
    const blocked = status === 'blocked';
    return (
      <Pressable
        accessibilityRole="button"
        onPress={async () => (blocked ? Linking.openSettings().catch(() => {}) : setStatus(await locate(true)))}>
        {({ pressed }) => (
          <Light index={0} style={[styles.card, styles.prompt, pressed && { opacity: 0.85 }]}>
            <Text style={styles.eyebrow}>Prayer times</Text>
            <View style={styles.promptRow}>
              <Text style={styles.promptTitle}>{blocked ? 'Allow location in Settings' : 'Show today’s prayers'}</Text>
              <Text style={styles.promptArrow}>→</Text>
            </View>
          </Light>
        )}
      </Pressable>
    );
  }

  const { today, next } = schedule(place, method, asr, now);
  const nextIndex = today.findIndex((p) => p.at.getTime() === next.at.getTime());
  // How far along the day's line the gold has reached: up to the next prayer, or all the way after Isha.
  const reached = nextIndex === -1 ? today.length - 1 : nextIndex;

  return (
    <Pressable onPress={() => router.push('/prayer-times')} accessibilityRole="button" accessibilityLabel={`${next.name} ${until(next.at, now)}, at ${clock(next.at)}${alerts ? ', alert on' : ''}`}>
      {({ pressed }) => (
        <Light index={LIGHT[next.key]} style={[styles.card, pressed && { opacity: 0.9 }]}>
          <View style={styles.head}>
            <Text style={styles.eyebrow}>Next prayer</Text>
            <View style={styles.headRight}>
              {alerts && <Icon name="bell" size={14} color={colors.gold} strokeWidth={2} />}
              <Text style={styles.at}>{clock(next.at)}</Text>
            </View>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.name}>{next.name}</Text>
            <Text style={styles.arabic}>{ARABIC[next.name]}</Text>
          </View>
          <Text style={styles.until}>{until(next.at, now)}</Text>

          <View style={styles.timeline}>
            <View style={styles.track} />
            <View style={[styles.trackFill, { width: `${reached * (80 / (today.length - 1))}%` }]} />
            {today.map((p, i) => {
              const isNext = i === nextIndex;
              const past = p.at <= now;
              return (
                <View key={p.key} style={styles.stop}>
                  <View style={styles.dotBox}>{isNext ? <NextDot /> : <View style={[styles.dot, past && styles.dotPast]} />}</View>
                  <Text style={[styles.stopName, isNext && styles.stopNext, past && styles.stopPast]}>{p.name}</Text>
                  <Text style={[styles.stopTime, isNext && styles.stopNext, past && styles.stopPast]}>{shortClock(p.at)}</Text>
                </View>
              );
            })}
          </View>
        </Light>
      )}
    </Pressable>
  );
}

/**
 * The light behind a prayer card, darkened towards the bottom where the timeline sits: one of the scenes of the card
 * style's world, or a blurred manuscript page when the style has no world. It takes its colours from the palette
 * around it, so it goes inside usePrayerInk's.
 */
export function Light({ index, style, children }: { index: number; style: StyleProp<ViewStyle>; children: ReactNode }) {
  const colors = useColors();
  const world = useWorld();
  const source = world ? SCENES[world][index % SCENES[world].length] : GLOW[index];
  const veil = (a: number) => `rgba(${colors.pageRgb},${a})`;
  return (
    <View style={style}>
      <Image source={source} contentFit="cover" transition={600} style={StyleSheet.absoluteFill} accessible={false} />
      <LinearGradient
        colors={[veil(0.3), veil(0.42), veil(0.85)]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

/** The next prayer's place on the line: a gold ring that breathes slowly. */
function NextDot() {
  const styles = useStyles();
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [pulse]);
  const halo = useAnimatedStyle(() => ({ opacity: 0.45 * (1 - pulse.get()), transform: [{ scale: 1 + 0.9 * pulse.get() }] }));
  return (
    <View style={styles.nextDot}>
      <Animated.View style={[styles.halo, halo]} />
      <View style={styles.nextCore} />
    </View>
  );
}

const DOT = 14;

const useStyles = makeStyles((colors) => ({
  card: { borderRadius: layout.radius.lg, overflow: 'hidden', padding: 20, backgroundColor: colors.raised },
  prompt: { paddingVertical: 22 },
  promptRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  promptTitle: { flex: 1, fontFamily: fonts.read, fontSize: 24, color: colors.text },
  promptArrow: { fontFamily: fonts.read, fontSize: 24, color: colors.gold },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: { ...eyebrow, color: colors.gold },
  at: { fontFamily: fonts.uiMedium, fontSize: 15, color: colors.text, fontVariant: ['tabular-nums'] },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10 },
  name: { fontFamily: fonts.read, fontSize: 42, lineHeight: 50, color: colors.text },
  arabic: { fontFamily: fonts.arabic, fontSize: 28, lineHeight: 50, color: colors.gold },
  until: { fontFamily: fonts.readItalic, fontSize: 17, color: colors.read, marginTop: 2 },
  timeline: { flexDirection: 'row', marginTop: 24 },
  // The line runs between the first and last dots, at their centres (10% and 90% of the row).
  track: { position: 'absolute', left: '10%', right: '10%', top: DOT / 2 - 0.5, height: 1, backgroundColor: `rgba(${colors.textRgb},0.22)` },
  trackFill: { position: 'absolute', left: '10%', top: DOT / 2 - 1, height: 2, borderRadius: 1, backgroundColor: colors.gold },
  stop: { flex: 1, alignItems: 'center' },
  dotBox: { width: DOT, height: DOT, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: `rgba(${colors.textRgb},0.45)`, backgroundColor: colors.page },
  dotPast: { backgroundColor: colors.gold, borderColor: colors.gold },
  nextDot: { width: DOT, height: DOT, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: colors.gold },
  nextCore: { width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.page },
  stopName: { fontFamily: fonts.ui, fontSize: 11.5, color: colors.read, marginTop: 8 },
  stopTime: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.text, marginTop: 2, fontVariant: ['tabular-nums'] },
  stopNext: { color: colors.gold },
  stopPast: { color: `rgba(${colors.textRgb},0.45)` },
}));
