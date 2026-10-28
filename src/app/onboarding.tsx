import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArtPanel } from '@/components/art';
import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import type { ArtKey } from '@/data/art';
import { PASSAGES, passageEnglish, passageRef, TOPICS, topicLabel, type Topic } from '@/data/content';
import { haptic } from '@/lib/feedback';
import { DAILY_GOALS, useApp } from '@/store/app-store';
import { colors, fonts } from '@/theme/tokens';

type Step = 'welcome' | 'why' | 'topics' | 'goal' | 'building' | 'plan';
const QUESTIONS: Step[] = ['why', 'topics', 'goal'];
const ART_FOR: Record<Step, ArtKey> = {
  welcome: 'fatiha',
  why: 'rosette',
  topics: 'blue',
  goal: 'morocco',
  building: 'baghdad',
  plan: 'baghdad',
};

const WHY = ['Closeness to Allah', 'Calm in hard times', 'A daily habit', 'Understanding the words'];

const MINUTES: Record<(typeof DAILY_GOALS)[number], string> = { 5: '2 min', 10: '5 min', 20: '10 min' };

const joinNames = (names: string[]) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [step, setStep] = useState<Step>('welcome');
  const [why, setWhy] = useState<string[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [goal, setGoal] = useState<(typeof DAILY_GOALS)[number] | null>(null);

  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const question = QUESTIONS.indexOf(step);
  const back = () => setStep(step === 'plan' ? 'goal' : step === 'why' ? 'welcome' : QUESTIONS[question - 1]);

  const finish = () => {
    useApp.getState().completeOnboarding(topics, 'both', goal ?? DAILY_GOALS[0]);
    if (useApp.getState().account) {
      router.replace('/');
      setTimeout(() => router.push('/paywall'), 450);
    } else {
      router.replace({ pathname: '/sign-in', params: { from: 'onboarding' } });
    }
  };

  // Full-screen art for the welcome and the pause; a band across the top for the rest.
  const fullBleed = step === 'welcome' || step === 'building';
  const band = height * (step === 'plan' ? 0.3 : 0.38);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ArtPanel
        art={ART_FOR[step]}
        fade={fullBleed ? 'deep' : 'edge'}
        caption={fullBleed ? 'top' : 'bottom'}
        inset={insets.top + (fullBleed ? 0 : 44)}
        style={fullBleed ? StyleSheet.absoluteFill : { height: band }}
      />

      {!fullBleed && (
        <View style={[styles.topBar, { top: insets.top + 6 }]}>
          <Pressable hitSlop={12} onPress={back} style={styles.back} accessibilityLabel="Back">
            <Icon name="chevron-left" size={20} color={colors.text} strokeWidth={2} />
          </Pressable>
          {question >= 0 && (
            <View style={styles.progress}>
              {QUESTIONS.map((q, i) => (
                <View key={q} style={[styles.progressPart, i <= question && styles.progressOn]} />
              ))}
            </View>
          )}
        </View>
      )}

      <View style={[styles.body, { paddingBottom: insets.bottom + 16 }, fullBleed && styles.bodyBottom]}>
        {step === 'welcome' && (
          <Animated.View entering={FadeIn.delay(300).duration(800)}>
            <Text style={styles.brand}>Scroll Quran</Text>
            <Text style={styles.display}>The Quran, one verse at a time.</Text>
            <PrimaryButton label="Begin" onPress={() => setStep('why')} style={{ marginTop: 28 }} />
          </Animated.View>
        )}

        {step === 'why' && (
          <Animated.View key="why" entering={FadeIn.duration(350)} style={styles.flex}>
            <Text style={styles.h1}>What brings you here?</Text>
            <View style={styles.list}>
              {WHY.map((w) => (
                <Line key={w} label={w} on={why.includes(w)} onPress={() => setWhy((list) => toggle(list, w))} />
              ))}
            </View>
          </Animated.View>
        )}

        {step === 'topics' && (
          <Animated.View key="topics" entering={FadeIn.duration(350)} style={styles.flex}>
            <Text style={styles.h1}>What do you need more of?</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
              {TOPICS.map((t) => {
                const on = topics.includes(t.id);
                return (
                  <Pressable
                    key={t.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    onPress={() => {
                      haptic.tap();
                      setTopics((list) => toggle(list, t.id));
                    }}
                    style={({ pressed }) => [styles.cell, pressed && { opacity: 0.6 }]}>
                    <Text style={[styles.cellArabic, on && { color: colors.gold }]}>{t.arabic}</Text>
                    <Text style={[styles.cellLabel, on && { color: colors.text }]}>{t.label}</Text>
                    <View style={[styles.rule, on && styles.ruleOn]} />
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {step === 'goal' && (
          <Animated.View key="goal" entering={FadeIn.duration(350)} style={styles.flex}>
            <Text style={styles.h1}>How much each day?</Text>
            <View style={styles.goals}>
              {DAILY_GOALS.map((g) => {
                const on = goal === g;
                return (
                  <Pressable
                    key={g}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={`${g} cards a day, about ${MINUTES[g]}`}
                    onPress={() => {
                      haptic.tap();
                      setGoal(g);
                    }}
                    style={({ pressed }) => [styles.goal, pressed && { opacity: 0.6 }]}>
                    <Text style={[styles.goalNumber, on && { color: colors.gold }]}>{g}</Text>
                    <Text style={[styles.goalUnit, on && { color: colors.text }]}>cards</Text>
                    <Text style={styles.goalTime}>{MINUTES[g]}</Text>
                    <View style={[styles.rule, { alignSelf: 'stretch' }, on && styles.ruleOn]} />
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {step === 'building' && <Building onDone={() => setStep('plan')} />}

        {step === 'plan' && <Plan topics={topics} goal={goal ?? DAILY_GOALS[0]} />}

        {step === 'why' && <PrimaryButton label="Continue" disabled={!why.length} onPress={() => setStep('topics')} />}
        {step === 'topics' && <PrimaryButton label="Continue" disabled={!topics.length} onPress={() => setStep('goal')} />}
        {step === 'goal' && <PrimaryButton label="Continue" disabled={!goal} onPress={() => setStep('building')} />}
        {step === 'plan' && <PrimaryButton label="Save my plan" onPress={finish} />}
      </View>
    </View>
  );
}

/** A choice set like a line of a printed list: the words carry it, a gold mark shows it's chosen. */
function Line({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      style={({ pressed }) => [styles.line, pressed && { opacity: 0.6 }]}>
      <Text style={[styles.lineLabel, on && { color: colors.text }]}>{label}</Text>
      <View style={[styles.mark, on && styles.markOn]}>{on && <Icon name="check" size={13} color={colors.page} strokeWidth={3} />}</View>
    </Pressable>
  );
}

const BUILD_MS = 3400;

/** A short pause over the art while the feed is put together, then on to the plan by itself. */
function Building({ onDone }: { onDone: () => void }) {
  const fill = useSharedValue(0);
  useEffect(() => {
    fill.set(withTiming(1, { duration: BUILD_MS, easing: Easing.inOut(Easing.quad) }));
    const timer = setTimeout(() => {
      haptic.success();
      onDone();
    }, BUILD_MS + 200);
    return () => clearTimeout(timer);
    // Runs once: nothing it depends on changes while it's showing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const bar = useAnimatedStyle(() => ({ width: `${fill.get() * 100}%` }));

  return (
    <Animated.View entering={FadeIn.duration(600)}>
      <Text style={styles.h1}>Preparing your feed</Text>
      <Text style={styles.hadith}>“The most beloved of deeds to Allah are those done consistently, even if they are small.”</Text>
      <Text style={styles.hadithSource}>The Prophet ﷺ · Bukhari and Muslim</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.trackFill, bar]} />
      </View>
    </Animated.View>
  );
}

function Plan({ topics, goal }: { topics: Topic[]; goal: number }) {
  // A short ayah from their first topic, as a first taste of the feed.
  const first =
    PASSAGES.find((p) => p.topics.includes(topics[0]) && p.ayat.length === 1 && passageEnglish(p).length < 130) ??
    PASSAGES.find((p) => p.topics.includes(topics[0]))!;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.flex}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Your plan</Text>
        <Text style={styles.planLine}>
          <Text style={styles.planEm}>{goal} cards</Text> a day on <Text style={styles.planEm}>{joinNames(topics.map(topicLabel))}</Text>.
        </Text>
        <Animated.View entering={FadeIn.delay(500).duration(600)} style={styles.verse}>
          <Text style={styles.verseArabic}>{first.ayat[0].ar}</Text>
          <Text style={styles.verseEnglish}>{first.ayat[0].en}</Text>
          <Text style={styles.verseRef}>{passageRef(first)}</Text>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  flex: { flex: 1 },
  topBar: { position: 'absolute', left: 16, right: 24, flexDirection: 'row', alignItems: 'center', gap: 14, zIndex: 2 },
  back: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(12,21,18,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: { flex: 1, flexDirection: 'row', gap: 6 },
  progressPart: { flex: 1, height: 2, borderRadius: 1, backgroundColor: 'rgba(243,235,216,0.25)' },
  progressOn: { backgroundColor: colors.gold },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 6, width: '100%', maxWidth: 600, alignSelf: 'center' },
  bodyBottom: { justifyContent: 'flex-end' },
  brand: { fontFamily: fonts.uiMedium, fontSize: 13, letterSpacing: 1.2, color: colors.gold, textTransform: 'uppercase' },
  display: { fontFamily: fonts.read, fontSize: 38, lineHeight: 46, color: colors.text, marginTop: 10 },
  h1: { fontFamily: fonts.read, fontSize: 28, lineHeight: 36, color: colors.text },
  list: { marginTop: 14 },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  lineLabel: { flex: 1, fontFamily: fonts.read, fontSize: 20, color: colors.quiet },
  mark: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.faint, alignItems: 'center', justifyContent: 'center' },
  markOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 24, paddingTop: 8, paddingBottom: 12 },
  cell: { width: '46%', paddingTop: 12 },
  cellArabic: { fontFamily: fonts.arabic, fontSize: 22, lineHeight: 40, color: colors.faint, textAlign: 'left' },
  cellLabel: { fontFamily: fonts.read, fontSize: 18, color: colors.quiet, marginTop: -2, marginBottom: 10 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  ruleOn: { height: 2, backgroundColor: colors.gold },
  goals: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 18, paddingBottom: 24 },
  goal: { flex: 1, alignItems: 'flex-start' },
  goalNumber: { fontFamily: fonts.read, fontSize: 56, lineHeight: 64, color: colors.faint, fontVariant: ['tabular-nums'] },
  goalUnit: { fontFamily: fonts.read, fontSize: 18, color: colors.quiet },
  goalTime: { fontFamily: fonts.ui, fontSize: 13, color: colors.faint, marginTop: 4, marginBottom: 12 },
  hadith: { fontFamily: fonts.readItalic, fontSize: 19, lineHeight: 28, color: colors.read, marginTop: 14 },
  hadithSource: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.quiet, marginTop: 10 },
  track: { height: 2, borderRadius: 1, backgroundColor: 'rgba(243,235,216,0.2)', marginTop: 28, overflow: 'hidden' },
  trackFill: { height: 2, backgroundColor: colors.gold },
  eyebrow: { fontFamily: fonts.uiMedium, fontSize: 13, letterSpacing: 1.2, color: colors.gold, textTransform: 'uppercase' },
  planLine: { fontFamily: fonts.read, fontSize: 28, lineHeight: 38, color: colors.read, marginTop: 10 },
  planEm: { color: colors.text },
  verse: { marginTop: 26, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, marginBottom: 16 },
  verseArabic: { fontFamily: fonts.quran, fontSize: 26, lineHeight: 52, color: colors.text, textAlign: 'right', writingDirection: 'rtl' },
  verseEnglish: { fontFamily: fonts.read, fontSize: 17, lineHeight: 26, color: colors.read, marginTop: 6 },
  verseRef: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.quiet, marginTop: 8 },
});
