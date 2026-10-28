import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInRight, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Mark } from '@/components/mark';
import { PrimaryButton } from '@/components/primary-button';
import { PASSAGES, passageEnglish, passageRef, surahInfo, TOPICS, topicLabel, type Topic } from '@/data/content';
import { haptic } from '@/lib/feedback';
import { DAILY_GOALS, useApp, type Display } from '@/store/app-store';
import { colors, fonts } from '@/theme/tokens';

const SAMPLE = PASSAGES.find((p) => p.id === '94:5-6')!;

const STEPS = ['welcome', 'why', 'habit', 'topics', 'goal', 'display', 'building', 'plan'] as const;
type Step = (typeof STEPS)[number];
/** The question steps, which share the progress bar. */
const QUESTIONS: Step[] = ['why', 'habit', 'topics', 'goal', 'display'];

const WHY = [
  { id: 'closer', title: 'Feel closer to Allah', arabic: 'قُرْب' },
  { id: 'calm', title: 'Find calm when life is heavy', arabic: 'سَكِينَة' },
  { id: 'daily', title: 'Read the Quran every day', arabic: 'وِرْد' },
  { id: 'understand', title: 'Understand what I recite', arabic: 'فَهْم' },
  { id: 'duas', title: 'Learn duas for my own life', arabic: 'دُعَاء' },
];

const HABITS = [
  { id: 'daily', title: 'Every day', reply: 'Ma sha Allah. Scroll Quran will sit beside your daily reading.' },
  { id: 'weekly', title: 'A few times a week', reply: 'A few minutes every day is how a habit takes root.' },
  { id: 'ramadan', title: 'Mostly in Ramadan', reply: 'Many people feel this. A verse a day keeps Ramadan close all year.' },
  { id: 'starting', title: 'I’m just starting', reply: 'Welcome. Every verse comes with its meaning, so you can start anywhere.' },
];

const GOAL_INFO: Record<(typeof DAILY_GOALS)[number], { title: string; time: string }> = {
  5: { title: 'Gentle', time: 'about 2 minutes' },
  10: { title: 'Steady', time: 'about 5 minutes' },
  20: { title: 'Devoted', time: 'about 10 minutes' },
};

const READ_OPTIONS: { id: Display; title: string }[] = [
  { id: 'both', title: 'Arabic and English' },
  { id: 'english', title: 'English only' },
  { id: 'arabic', title: 'Arabic only' },
];

const joinNames = (names: string[]) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('welcome');
  const [why, setWhy] = useState<string[]>([]);
  const [habit, setHabit] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [goal, setGoal] = useState<(typeof DAILY_GOALS)[number] | null>(null);
  const [display, setDisplay] = useState<Display>('both');

  const index = STEPS.indexOf(step);
  const go = (to: Step) => setStep(to);
  const next = () => go(STEPS[index + 1]);
  const back = () => go(step === 'plan' ? 'display' : STEPS[index - 1]);
  const question = QUESTIONS.indexOf(step);

  const finish = () => {
    useApp.getState().completeOnboarding(topics, display, goal ?? DAILY_GOALS[0]);
    if (useApp.getState().account) {
      router.replace('/');
      setTimeout(() => router.push('/paywall'), 450);
    } else {
      router.replace({ pathname: '/sign-in', params: { from: 'onboarding' } });
    }
  };

  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar style="light" />
      <View style={styles.inner}>
        <View style={styles.topBar}>
          {step === 'welcome' ? (
            <Text style={styles.brand}>Scroll Quran</Text>
          ) : step !== 'building' ? (
            <Pressable hitSlop={12} onPress={back} style={styles.back} accessibilityLabel="Back">
              <Icon name="chevron-left" size={22} color={colors.quiet} strokeWidth={2} />
            </Pressable>
          ) : (
            <View style={styles.back} />
          )}
          {question >= 0 && <Progress done={question} total={QUESTIONS.length} />}
          <View style={styles.back} />
        </View>

        {step === 'welcome' && (
          <Animated.View key="welcome" entering={FadeIn.duration(500)} exiting={FadeOut.duration(150)} style={styles.flex}>
            <View style={styles.welcomeHero}>
              <Mark size={52} draw duration={900} />
              <View style={styles.words}>
                {SAMPLE.ayat[0].ar.split(' ').map((w, i) => (
                  <Animated.Text key={i} entering={FadeIn.delay(700 + i * 160).duration(600)} style={styles.word}>
                    {w}
                  </Animated.Text>
                ))}
              </View>
              <Animated.Text entering={FadeIn.delay(1500).duration(800)} style={styles.sampleEnglish}>
                {SAMPLE.ayat[0].en}
              </Animated.Text>
              <Animated.View entering={FadeIn.delay(1900).duration(600)} style={styles.source}>
                <Text style={styles.sourceArabic}>{surahInfo(SAMPLE.surah).arabic}</Text>
                <Text style={styles.sourceRef}>Ash-Sharh 94:5</Text>
              </Animated.View>
            </View>
            <Text style={styles.h1}>The Quran, one verse at a time.</Text>
            <Text style={styles.sub}>Swipe through ayat, duas and the Names of Allah, chosen for what you’re carrying today.</Text>
          </Animated.View>
        )}

        {step === 'why' && (
          <Animated.View key="why" entering={FadeInRight.duration(320)} exiting={FadeOut.duration(120)} style={styles.flex}>
            <Text style={styles.h1}>What brings you to the Quran?</Text>
            <Text style={styles.sub}>Choose as many as are true.</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.flex}>
              {WHY.map((o) => (
                <Choice key={o.id} title={o.title} arabic={o.arabic} on={why.includes(o.id)} onPress={() => setWhy(toggle(why, o.id))} />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {step === 'habit' && (
          <Animated.View key="habit" entering={FadeInRight.duration(320)} exiting={FadeOut.duration(120)} style={styles.flex}>
            <Text style={styles.h1}>How often do you read the Quran now?</Text>
            <Text style={styles.sub}>There’s no wrong answer.</Text>
            {HABITS.map((o) => (
              <Choice key={o.id} title={o.title} round on={habit === o.id} onPress={() => setHabit(o.id)} />
            ))}
            {habit && (
              <Animated.View key={habit} entering={FadeIn.duration(450)} style={styles.reply}>
                <Text style={styles.replyText}>{HABITS.find((h) => h.id === habit)!.reply}</Text>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {step === 'topics' && (
          <Animated.View key="topics" entering={FadeInRight.duration(320)} exiting={FadeOut.duration(120)} style={styles.flex}>
            <Text style={styles.h1}>What do you need more of?</Text>
            <Text style={styles.sub}>Your feed will lean towards these.</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.flex}>
              {TOPICS.map((t) => (
                <Choice
                  key={t.id}
                  title={t.label}
                  sub={t.blurb}
                  arabic={t.arabic}
                  on={topics.includes(t.id)}
                  onPress={() => setTopics(toggle(topics, t.id))}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {step === 'goal' && (
          <Animated.View key="goal" entering={FadeInRight.duration(320)} exiting={FadeOut.duration(120)} style={styles.flex}>
            <Text style={styles.h1}>Set a daily goal</Text>
            <Text style={styles.sub}>Reach it and your streak grows. We’ll celebrate each day you do.</Text>
            {DAILY_GOALS.map((g) => (
              <Choice
                key={g}
                title={GOAL_INFO[g].title}
                sub={`${g} cards a day · ${GOAL_INFO[g].time}`}
                round
                on={goal === g}
                onPress={() => setGoal(g)}
              />
            ))}
            <View style={styles.hadith}>
              <Text style={styles.hadithText}>
                “The most beloved of deeds to Allah are those done consistently, even if they are small.”
              </Text>
              <Text style={styles.hadithSource}>The Prophet Muhammad ﷺ · Bukhari and Muslim</Text>
            </View>
          </Animated.View>
        )}

        {step === 'display' && (
          <Animated.View key="display" entering={FadeInRight.duration(320)} exiting={FadeOut.duration(120)} style={styles.flex}>
            <Text style={styles.h1}>How do you want to read?</Text>
            <Text style={styles.sub}>You can change this any time.</Text>
            <View style={styles.preview}>
              {display !== 'english' && <Text style={styles.previewArabic}>{SAMPLE.ayat[0].ar}</Text>}
              {display !== 'arabic' && <Text style={styles.previewEnglish}>{SAMPLE.ayat[0].en}</Text>}
            </View>
            {READ_OPTIONS.map((o) => (
              <Choice key={o.id} title={o.title} round on={display === o.id} onPress={() => setDisplay(o.id)} />
            ))}
          </Animated.View>
        )}

        {step === 'building' && <Building topics={topics} goal={goal ?? DAILY_GOALS[0]} onDone={() => go('plan')} />}

        {step === 'plan' && <Plan topics={topics} goal={goal ?? DAILY_GOALS[0]} display={display} why={why} />}

        <View style={styles.footer}>
          {step === 'welcome' && (
            <>
              <PrimaryButton label="Begin" onPress={next} />
              <Text style={styles.trust}>No ads. Nothing here is written by AI.</Text>
            </>
          )}
          {step === 'why' && <PrimaryButton label={why.length ? 'Continue' : 'Choose at least one'} disabled={!why.length} onPress={next} />}
          {step === 'habit' && <PrimaryButton label="Continue" disabled={!habit} onPress={next} />}
          {step === 'topics' && (
            <PrimaryButton label={topics.length ? 'Continue' : 'Choose at least one'} disabled={!topics.length} onPress={next} />
          )}
          {step === 'goal' && <PrimaryButton label={goal ? `Commit to ${goal} a day` : 'Choose a goal'} disabled={!goal} onPress={next} />}
          {step === 'display' && <PrimaryButton label="Build my feed" onPress={next} />}
          {step === 'plan' && <PrimaryButton label="Save my plan" onPress={finish} />}
        </View>
      </View>
    </View>
  );
}

function Progress({ done, total }: { done: number; total: number }) {
  return (
    <View style={styles.progress}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.progressPart, i <= done && styles.progressOn]} />
      ))}
    </View>
  );
}

type ChoiceProps = { title: string; sub?: string; arabic?: string; on: boolean; round?: boolean; onPress: () => void };

/** A selectable row: square tick for pick-several, round for pick-one. */
function Choice({ title, sub, arabic, on, round, onPress }: ChoiceProps) {
  return (
    <Pressable
      accessibilityRole={round ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: on }}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      style={({ pressed }) => [styles.choice, on && styles.choiceOn, pressed && { opacity: 0.7 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.choiceTitle, on && { color: colors.text }]}>{title}</Text>
        {sub && <Text style={styles.choiceSub}>{sub}</Text>}
      </View>
      {arabic && <Text style={[styles.choiceArabic, on && { color: colors.gold }]}>{arabic}</Text>}
      <View style={[styles.tick, round && styles.tickRound, on && styles.tickOn]}>
        {on && <Icon name="check" size={14} color={colors.page} strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

const BUILD_MS = 3200;

/** A short pause that lays out what's being set up from their answers, then moves on by itself. */
function Building({ topics, goal, onDone }: { topics: Topic[]; goal: number; onDone: () => void }) {
  const fill = useSharedValue(0);
  const lines = [
    `Choosing ayat on ${joinNames(topics.map(topicLabel))}`,
    'Adding duas from the Quran',
    `Setting your goal of ${goal} cards a day`,
  ];

  useEffect(() => {
    fill.set(withTiming(1, { duration: BUILD_MS, easing: Easing.inOut(Easing.quad) }));
    const timers = [
      ...lines.map((_, i) => setTimeout(haptic.soft, 500 + i * 850)),
      setTimeout(() => {
        haptic.success();
        onDone();
      }, BUILD_MS + 250),
    ];
    return () => timers.forEach(clearTimeout);
    // Runs once: the answers can't change while this screen is showing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bar = useAnimatedStyle(() => ({ width: `${fill.get() * 100}%` }));

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(150)} style={[styles.flex, styles.building]}>
      <Mark size={84} draw duration={1400} />
      <Text style={[styles.h1, { textAlign: 'center', marginTop: 28 }]}>Building your feed</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.trackFill, bar]} />
      </View>
      <View style={styles.buildLines}>
        {lines.map((l, i) => (
          <Animated.View key={l} entering={FadeIn.delay(500 + i * 850).duration(400)} style={styles.buildLine}>
            <Icon name="check" size={16} color={colors.gold} strokeWidth={2.4} />
            <Text style={styles.buildText}>{l}</Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

function Plan({ topics, goal, display, why }: { topics: Topic[]; goal: number; display: Display; why: string[] }) {
  const info = GOAL_INFO[goal as keyof typeof GOAL_INFO];
  // A short passage from their first topic, as a taste of the feed.
  const first =
    PASSAGES.find((p) => p.topics.includes(topics[0]) && p.ayat.length === 1 && passageEnglish(p).length < 150) ??
    PASSAGES.find((p) => p.topics.includes(topics[0]))!;
  const rows = [
    { label: 'Daily goal', value: `${goal} cards · ${info.time}` },
    { label: 'Your feeds', value: joinNames(topics.map(topicLabel)) },
    { label: 'Reading', value: READ_OPTIONS.find((o) => o.id === display)!.title },
    { label: 'Streak', value: 'Celebrated every day you reach your goal' },
  ];
  // Only the first letter drops to lower case, so Allah and Quran keep their capitals.
  const aim = WHY.filter((w) => why.includes(w.id)).map((w) => w.title[0].toLowerCase() + w.title.slice(1));

  return (
    <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(150)} style={styles.flex}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
        <Text style={styles.eyebrow}>Your plan is ready</Text>
        <Text style={styles.h1}>A daily Quran habit, made for you</Text>
        {aim.length > 0 && <Text style={styles.sub}>To help you {joinNames(aim)}.</Text>}

        <View style={styles.planCard}>
          {rows.map((r, i) => (
            <Animated.View key={r.label} entering={FadeIn.delay(150 + i * 120).duration(400)} style={[styles.planRow, i > 0 && styles.planDivider]}>
              <Text style={styles.planLabel}>{r.label}</Text>
              <Text style={styles.planValue}>{r.value}</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeIn.delay(700).duration(500)} style={styles.firstVerse}>
          <Text style={styles.firstLabel}>Your first verse</Text>
          <Text style={styles.firstArabic}>{first.ayat[0].ar}</Text>
          <Text style={styles.firstEnglish}>{first.ayat[0].en}</Text>
          <Text style={styles.sourceRef}>{passageRef(first)}</Text>
        </Animated.View>

        <Text style={styles.facts}>6,236 ayat · 114 surahs · duas from the Quran · works offline</Text>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  inner: { flex: 1, paddingHorizontal: 28, maxWidth: 600, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44, gap: 16, marginBottom: 8 },
  brand: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.quiet },
  back: { width: 32, height: 32, justifyContent: 'center' },
  progress: { flex: 1, flexDirection: 'row', gap: 6 },
  progressPart: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.line },
  progressOn: { backgroundColor: colors.gold },
  welcomeHero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  words: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', columnGap: 12, marginTop: 34 },
  word: { fontFamily: fonts.quran, fontSize: 38, lineHeight: 72, color: colors.text },
  sampleEnglish: { fontFamily: fonts.read, fontSize: 21, lineHeight: 30, color: colors.read, marginTop: 10, textAlign: 'center' },
  source: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  sourceArabic: { fontFamily: fonts.arabic, fontSize: 16, lineHeight: 30, color: colors.gold },
  sourceRef: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet },
  eyebrow: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.gold, marginTop: 8 },
  h1: { fontFamily: fonts.read, fontSize: 28, lineHeight: 36, color: colors.text, marginTop: 8 },
  sub: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: colors.quiet, marginTop: 8, marginBottom: 18 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  choiceOn: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  choiceTitle: { fontFamily: fonts.uiMedium, fontSize: 16.5, color: colors.read },
  choiceSub: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet, marginTop: 2 },
  choiceArabic: { fontFamily: fonts.arabic, fontSize: 18, lineHeight: 34, color: colors.faint },
  tick: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.faint, alignItems: 'center', justifyContent: 'center' },
  tickRound: { borderRadius: 11 },
  tickOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  reply: { marginTop: 8, paddingLeft: 14, borderLeftWidth: 2, borderLeftColor: colors.gold },
  replyText: { fontFamily: fonts.readItalic, fontSize: 17, lineHeight: 25, color: colors.text },
  hadith: { marginTop: 'auto', paddingTop: 20 },
  hadithText: { fontFamily: fonts.readItalic, fontSize: 17, lineHeight: 26, color: colors.read },
  hadithSource: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.quiet, marginTop: 8 },
  preview: { minHeight: 170, justifyContent: 'center', marginBottom: 12 },
  previewArabic: { fontFamily: fonts.quran, fontSize: 32, lineHeight: 62, color: colors.text, textAlign: 'right', writingDirection: 'rtl' },
  previewEnglish: { fontFamily: fonts.read, fontSize: 19, lineHeight: 28, color: colors.read, marginTop: 10 },
  building: { alignItems: 'center', justifyContent: 'center' },
  track: { alignSelf: 'stretch', height: 4, borderRadius: 2, backgroundColor: colors.line, marginTop: 24, overflow: 'hidden' },
  trackFill: { height: 4, backgroundColor: colors.gold },
  buildLines: { alignSelf: 'stretch', gap: 14, marginTop: 28 },
  buildLine: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  buildText: { fontFamily: fonts.ui, fontSize: 15, color: colors.read, flex: 1 },
  planCard: { marginTop: 4, borderRadius: 16, backgroundColor: colors.raised, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 18 },
  planRow: { paddingVertical: 14 },
  planDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  planLabel: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.quiet },
  planValue: { fontFamily: fonts.uiMedium, fontSize: 16, color: colors.text, marginTop: 3 },
  firstVerse: { marginTop: 22, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  firstLabel: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.gold },
  firstArabic: { fontFamily: fonts.quran, fontSize: 26, lineHeight: 52, color: colors.text, textAlign: 'right', writingDirection: 'rtl', marginTop: 8 },
  firstEnglish: { fontFamily: fonts.read, fontSize: 18, lineHeight: 27, color: colors.text, marginTop: 6, marginBottom: 8 },
  facts: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.faint, textAlign: 'center', marginTop: 22 },
  footer: { paddingTop: 14 },
  trust: { fontFamily: fonts.ui, fontSize: 13, color: colors.faint, textAlign: 'center', marginTop: 14 },
});
