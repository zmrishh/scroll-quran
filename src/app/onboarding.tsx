import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { InkText } from '@/components/ink-text';
import { FeedPreview, HeartPreview, PhoneStage, QuranPreview, TopicFeedPreview } from '@/components/phone-preview';
import { PlanPage, ValuePage } from '@/components/plus-pages';
import { PrimaryButton } from '@/components/primary-button';
import { ProgressRule } from '@/components/progress-rule';
import { ScrollNoise } from '@/components/scroll-noise';
import { SignInPanel } from '@/components/sign-in-panel';
import { TOPICS, topicLabel, type Topic } from '@/data/content';
import { haptic } from '@/lib/feedback';
import { DAILY_GOALS, useApp } from '@/store/app-store';
import { makeStyles, useColors } from '@/theme/theme';
import { eyebrow, fonts, layout } from '@/theme/tokens';

/**
 * Onboarding is one page that keeps going: the same gold rule along the top, titles written in like ink, and one phone
 * that stays in place while the app plays on it. It moves from where the hours go, to the reader's own feed, to what
 * those hours could become; the plans are simply the next page of that, in the same layout with the same button.
 */
type Step =
  | 'hook'
  | 'time'
  | 'scroll'
  | 'why'
  | 'topics'
  | 'building'
  | 'reveal'
  | 'heart'
  | 'quran'
  | 'value'
  | 'plans'
  | 'account';
const ORDER: Step[] = ['hook', 'time', 'scroll', 'why', 'topics', 'building', 'reveal', 'heart', 'quran', 'value', 'plans', 'account'];
// The Plus pages are skipped by anyone who already has Plus, and the account step by anyone signed in.
const PLUS_STEPS: Step[] = ['value', 'plans'];
const PHONE_STEPS: Step[] = ['scroll', 'reveal', 'heart', 'quran'];
const NO_BACK: Step[] = ['hook', 'building', 'account'];

const WHY = ['Closeness to Allah', 'Calm in hard times', 'A daily habit', 'Understanding the words'];

const joinNames = (names: string[]) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/** The words above the phone, and above the questions and the offer. */
function headFor(step: Step, names: string): { title: string; sub?: string } | null {
  switch (step) {
    case 'scroll':
      return { title: 'What if every scroll brought you closer to Allah?', sub: 'The same thumb, the same swipe. A verse at the end of it.' };
    case 'why':
      return { title: 'What brings you here?' };
    case 'topics':
      return { title: 'What does your heart need more of?' };
    case 'reveal':
      return { title: 'Your feed is ready.', sub: `${names || 'The Quran'}, one verse at a time.` };
    case 'heart':
      return { title: 'It meets the heart you have today.', sub: 'Tell it how you feel, and the verses follow.' };
    case 'quran':
      return { title: 'And the whole Quran, whenever you want it.', sub: 'Every surah in Arabic and English, waiting where you left off.' };
    case 'value':
      return { title: 'Give the Quran fifteen minutes a day.' };
    case 'plans':
      return { title: 'Start your year with the Quran.', sub: 'No daily limit, every topic feed and every manuscript style.' };
    default:
      return null;
  }
}

export default function Onboarding() {
  const colors = useColors();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [step, setStep] = useState<Step | 'signin'>('hook');
  const [why, setWhy] = useState<string[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [bought, setBought] = useState(false);
  const [room, setRoom] = useState(0);
  const signedIn = useApp((s) => !!s.account);

  const names = joinNames(topics.map(topicLabel));
  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  const skipped = (st: Step) => {
    const s = useApp.getState();
    return (PLUS_STEPS.includes(st) && s.premium) || (st === 'account' && !!s.account);
  };

  /** On to the next step that applies, or back to the last one (never back into the pause). Past the end is the app. */
  const go = (dir: 1 | -1) => {
    if (step === 'signin') return;
    let i = ORDER.indexOf(step) + dir;
    while (ORDER[i] && (skipped(ORDER[i]) || (dir < 0 && ORDER[i] === 'building'))) i += dir;
    if (step === 'reveal' && dir > 0) useApp.getState().completeOnboarding(topics, 'both', DAILY_GOALS[0]);
    if (ORDER[i]) setStep(ORDER[i]);
    else if (dir > 0) router.replace('/');
  };

  const renderPhone = (id: string) => {
    switch (id) {
      case 'reveal':
        return <TopicFeedPreview topics={topics} />;
      case 'heart':
        return <HeartPreview />;
      case 'quran':
        return <QuranPreview />;
      default:
        return <FeedPreview />;
    }
  };

  if (step === 'signin' || step === 'account') {
    return (
      <View style={styles.screen}>
        {step === 'account' && (
          <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
            <View style={styles.back} />
            <View style={styles.flex}>
              <ProgressRule progress={1} />
            </View>
          </View>
        )}
        {step === 'signin' ? (
          <SignInPanel
            initialMode="in"
            inTitle="Welcome back"
            onDone={(account) => setStep(account ? 'why' : 'hook')}
            bottomInset={insets.bottom + 16}
          />
        ) : (
          <SignInPanel
            initialMode="up"
            upTitle={bought ? 'Save your Plus' : 'Save your plan'}
            onDone={() => router.replace('/')}
            bottomInset={insets.bottom + 16}
          />
        )}
      </View>
    );
  }

  const head = headFor(step, names);
  const phone = PHONE_STEPS.includes(step);
  const progress = ORDER.indexOf(step) / (ORDER.length - 1);
  const canBack = !NO_BACK.includes(step);

  return (
    <View style={styles.screen}>
      {(step === 'hook' || step === 'time') && <ScrollNoise on={step === 'hook'} />}

      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <Pressable
          hitSlop={12}
          disabled={!canBack}
          onPress={() => go(-1)}
          style={[styles.back, !canBack && styles.gone]}
          accessibilityLabel="Back">
          <Icon name="chevron-left" size={20} color={colors.read} strokeWidth={2} />
        </Pressable>
        <View style={styles.flex}>
          <ProgressRule progress={progress} />
        </View>
        {step === 'plans' && (
          <Pressable hitSlop={12} onPress={() => go(1)} accessibilityRole="button">
            <Text style={styles.notNow}>Not now</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.body, { paddingBottom: insets.bottom + 16 }]}>
        {step === 'hook' && (
          <View style={styles.centre}>
            <InkText key="hook" delay={250} style={styles.big}>
              The average person spends <Text style={styles.em}>{'2+ hours a day'}</Text> scrolling.
            </InkText>
            <Animated.Text entering={FadeIn.delay(1700).duration(700)} style={styles.sub}>
              That’s more than a month, every year.
            </Animated.Text>
          </View>
        )}

        {step === 'time' && (
          <View style={styles.centre}>
            <Animated.Text entering={FadeIn.duration(600)} style={styles.eyebrow}>
              The Prophet ﷺ said
            </Animated.Text>
            <InkText key="time" delay={400} style={styles.quote}>
              “There are two blessings many people lose: health and free{' '}time.”
            </InkText>
            <Animated.Text entering={FadeIn.delay(2300).duration(700)} style={styles.source}>
              Sahih al-Bukhari 6412
            </Animated.Text>
          </View>
        )}

        {step === 'building' && <Building names={names} onDone={() => go(1)} />}

        {head && (
          <View style={[styles.head, phone && styles.headFixed]}>
            <InkText key={step} style={styles.title}>
              {head.title}
            </InkText>
            {head.sub && (
              <Animated.Text key={`${step}-sub`} entering={FadeIn.delay(900).duration(600)} style={styles.sub}>
                {head.sub}
              </Animated.Text>
            )}
          </View>
        )}

        {phone && (
          <View style={styles.stage} onLayout={(e) => setRoom(e.nativeEvent.layout.height)}>
            {room > 0 && <PhoneStage id={step} height={Math.min(room, Math.max(280, height * 0.6), 560)} render={renderPhone} />}
          </View>
        )}

        {step === 'why' && (
          <Animated.View key="why" entering={FadeIn.delay(450).duration(500)} style={styles.flex}>
            <View style={styles.list}>
              {WHY.map((w) => (
                <Line key={w} label={w} on={why.includes(w)} onPress={() => setWhy((list) => toggle(list, w))} />
              ))}
            </View>
          </Animated.View>
        )}

        {step === 'topics' && (
          <Animated.View key="topics" entering={FadeIn.delay(450).duration(500)} style={styles.flex}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
              {TOPICS.map((t) => (
                <TopicCell
                  key={t.id}
                  arabic={t.arabic}
                  label={t.label}
                  on={topics.includes(t.id)}
                  onPress={() => setTopics((list) => toggle(list, t.id))}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {step === 'value' && (
          <ScrollView key="value" style={styles.flex} showsVerticalScrollIndicator={false} contentContainerStyle={styles.grow}>
            <ValuePage />
          </ScrollView>
        )}

        {step === 'plans' && (
          <ScrollView key="plans" style={styles.flex} showsVerticalScrollIndicator={false} contentContainerStyle={styles.grow}>
            <PlanPage
              onDone={() => {
                setBought(true);
                go(1);
              }}
            />
          </ScrollView>
        )}

        {step !== 'building' && step !== 'plans' && (
          <PrimaryButton
            label="Continue"
            disabled={(step === 'why' && !why.length) || (step === 'topics' && !topics.length)}
            onPress={() => go(1)}
          />
        )}
        {step === 'hook' && !signedIn && (
          <Pressable hitSlop={8} onPress={() => setStep('signin')} style={styles.returning} accessibilityRole="button">
            <Text style={styles.returningText}>
              Already have an account? <Text style={styles.returningLink}>Sign in</Text>
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** A choice set like a line of a printed list: the words carry it, a gold mark shows it's chosen. */
function Line({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const colors = useColors();
  const styles = useStyles();
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

function TopicCell({ arabic, label, on, onPress }: { arabic: string; label: string; on: boolean; onPress: () => void }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      style={({ pressed }) => [styles.cell, pressed && { opacity: 0.6 }]}>
      <Text style={[styles.cellArabic, on && { color: colors.gold }]}>{arabic}</Text>
      <Text style={[styles.cellLabel, on && { color: colors.text }]}>{label}</Text>
      <View style={[styles.rule, on && styles.ruleOn]} />
    </Pressable>
  );
}

const BUILD_MS = 3600;

/** A short pause while the feed is gathered from the reader's topics, then on by itself. */
function Building({ names, onDone }: { names: string; onDone: () => void }) {
  const styles = useStyles();
  useEffect(() => {
    const timer = setTimeout(() => {
      haptic.success();
      onDone();
    }, BUILD_MS);
    return () => clearTimeout(timer);
    // Runs once: nothing it depends on changes while it's showing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.centre}>
      <InkText style={styles.title}>{names ? `Gathering verses on ${names}` : 'Gathering your verses'}</InkText>
      <Animated.Text entering={FadeIn.delay(1500).duration(800)} style={styles.hadith}>
        “The most beloved of deeds to Allah are those done consistently, even if they are small.”
      </Animated.Text>
      <Animated.Text entering={FadeIn.delay(1800).duration(800)} style={styles.source}>
        The Prophet ﷺ · Bukhari and Muslim
      </Animated.Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.page },
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: layout.gutter - 8, paddingRight: layout.gutter, zIndex: 2 },
  notNow: { fontFamily: fonts.uiMedium, fontSize: 14.5, color: colors.read, marginLeft: 6 },
  back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  gone: { opacity: 0 },
  body: { flex: 1, paddingHorizontal: layout.gutter, paddingTop: 22, width: '100%', maxWidth: 600, alignSelf: 'center' },
  centre: { flex: 1, justifyContent: 'center' },
  big: { fontFamily: fonts.read, fontSize: 34, lineHeight: 44, color: colors.text, textAlign: 'center' },
  em: { fontFamily: fonts.readItalic, color: colors.gold },
  head: { marginBottom: 8 },
  // The same height on every phone step, so the phone below never moves.
  headFixed: { minHeight: 150 },
  title: { fontFamily: fonts.read, fontSize: 28, lineHeight: 36, color: colors.text, textAlign: 'center' },
  sub: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 23, color: colors.quiet, textAlign: 'center', marginTop: 10 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  eyebrow: { ...eyebrow, color: colors.gold, textAlign: 'center', marginBottom: 16 },
  quote: { fontFamily: fonts.read, fontSize: 30, lineHeight: 40, color: colors.text, textAlign: 'center' },
  source: { fontFamily: fonts.ui, fontSize: 14, color: colors.quiet, textAlign: 'center', marginTop: 16 },
  hadith: { fontFamily: fonts.readItalic, fontSize: 18, lineHeight: 27, color: colors.read, textAlign: 'center', marginTop: 22 },
  grow: { flexGrow: 1, paddingBottom: 12 },
  returning: { alignSelf: 'center', marginTop: 16, paddingVertical: 4 },
  returningText: { fontFamily: fonts.ui, fontSize: 14.5, color: colors.read },
  returningLink: { fontFamily: fonts.uiMedium, color: colors.gold },
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
}));
