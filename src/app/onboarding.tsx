import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { PASSAGES, TOPICS, type Topic } from '@/data/content';
import { haptic } from '@/lib/feedback';
import { useApp, type Display } from '@/store/app-store';
import { colors, fonts } from '@/theme/tokens';

const SAMPLE = PASSAGES.find((p) => p.id === '94:5-6')!.ayat[0];

const READ_OPTIONS: { id: Display; title: string }[] = [
  { id: 'both', title: 'Arabic and English' },
  { id: 'english', title: 'English only' },
  { id: 'arabic', title: 'Arabic only' },
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [display, setDisplay] = useState<Display>('both');

  const finish = () => {
    useApp.getState().completeOnboarding(topics, display);
    router.replace('/');
    setTimeout(() => router.push('/paywall'), 450);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar style="light" />
      <View style={styles.inner}>
        <View style={styles.topBar}>
          {step > 0 ? (
            <Pressable hitSlop={12} onPress={() => setStep(step - 1)} style={styles.back} accessibilityLabel="Back">
              <Icon name="chevron-right" size={22} color={colors.quiet} strokeWidth={2} />
            </Pressable>
          ) : (
            <Text style={styles.brand}>Scroll Quran</Text>
          )}
          <Text style={styles.stepCount}>{step + 1} of 3</Text>
        </View>

        {step === 0 && (
          <Animated.View key="welcome" entering={FadeIn.duration(600)} exiting={FadeOut.duration(150)} style={styles.flex}>
            <View style={styles.sample}>
              <Text style={styles.sampleArabic}>{SAMPLE.ar}</Text>
              <Text style={styles.sampleEnglish}>{SAMPLE.en}</Text>
              <View style={styles.sampleSource}>
                <Text style={styles.sampleSurah}>الشرح</Text>
                <Text style={styles.sampleRef}>Ash-Sharh 94:5</Text>
              </View>
            </View>
            <Text style={styles.h1}>The Quran, one verse at a time.</Text>
            <Text style={styles.sub}>Swipe up for the next verse, dua or Name of Allah.</Text>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View key="topics" entering={FadeIn.duration(300)} exiting={FadeOut.duration(120)} style={styles.flex}>
            <Text style={styles.h1}>What do you need more of?</Text>
            <Text style={styles.sub}>Pick a few. Your feed will lean towards them.</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
              {TOPICS.map((t) => {
                const on = topics.includes(t.id);
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => {
                      haptic.tap();
                      setTopics(on ? topics.filter((x) => x !== t.id) : [...topics, t.id]);
                    }}
                    style={({ pressed }) => [styles.choice, pressed && { opacity: 0.6 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.choiceTitle, on && { color: colors.text }]}>{t.label}</Text>
                      <Text style={styles.choiceSub}>{t.blurb}</Text>
                    </View>
                    <Text style={styles.choiceArabic}>{t.arabic}</Text>
                    <View style={[styles.tick, on && styles.tickOn]}>{on && <Icon name="check" size={14} color={colors.page} strokeWidth={3} />}</View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View key="display" entering={FadeIn.duration(300)} exiting={FadeOut.duration(120)} style={styles.flex}>
            <Text style={styles.h1}>How do you want to read?</Text>
            <Text style={styles.sub}>You can change this later.</Text>
            <View style={styles.preview}>
              {display !== 'english' && <Text style={styles.sampleArabic}>{SAMPLE.ar}</Text>}
              {display !== 'arabic' && <Text style={styles.sampleEnglish}>{SAMPLE.en}</Text>}
            </View>
            {READ_OPTIONS.map((o) => {
              const on = o.id === display;
              return (
                <Pressable
                  key={o.id}
                  onPress={() => {
                    haptic.tap();
                    setDisplay(o.id);
                  }}
                  style={({ pressed }) => [styles.choice, pressed && { opacity: 0.6 }]}>
                  <Text style={[styles.choiceTitle, { flex: 1 }, on && { color: colors.text }]}>{o.title}</Text>
                  <View style={[styles.tick, on && styles.tickOn]}>{on && <Icon name="check" size={14} color={colors.page} strokeWidth={3} />}</View>
                </Pressable>
              );
            })}
          </Animated.View>
        )}

        <View style={styles.footer}>
          {step === 0 && <PrimaryButton label="Begin" onPress={() => setStep(1)} />}
          {step === 1 && (
            <PrimaryButton label={topics.length ? 'Continue' : 'Pick at least one'} disabled={!topics.length} onPress={() => setStep(2)} />
          )}
          {step === 2 && <PrimaryButton label="Start reading" onPress={finish} />}
          {step === 0 && <Text style={styles.trust}>No ads. Nothing here is written by AI.</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  inner: { flex: 1, paddingHorizontal: 28, maxWidth: 600, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44 },
  brand: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.quiet },
  back: { width: 32, height: 32, justifyContent: 'center', transform: [{ rotate: '180deg' }] },
  stepCount: { fontFamily: fonts.ui, fontSize: 13, color: colors.faint },
  sample: { flex: 1, justifyContent: 'center' },
  sampleArabic: { fontFamily: fonts.quran, fontSize: 34, lineHeight: 64, color: colors.text, textAlign: 'right', writingDirection: 'rtl' },
  sampleEnglish: { fontFamily: fonts.read, fontSize: 20, lineHeight: 30, color: colors.read, marginTop: 14 },
  sampleSource: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  sampleSurah: { fontFamily: fonts.arabic, fontSize: 16, lineHeight: 30, color: colors.gold },
  sampleRef: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet },
  h1: { fontFamily: fonts.read, fontSize: 28, lineHeight: 36, color: colors.text, marginTop: 8 },
  sub: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: colors.quiet, marginTop: 8, marginBottom: 18 },
  list: { flex: 1 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  choiceTitle: { fontFamily: fonts.uiMedium, fontSize: 17, color: colors.read },
  choiceSub: { fontFamily: fonts.ui, fontSize: 13, color: colors.faint, marginTop: 2 },
  choiceArabic: { fontFamily: fonts.arabic, fontSize: 18, lineHeight: 34, color: colors.quiet },
  tick: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.faint, alignItems: 'center', justifyContent: 'center' },
  tickOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  preview: { minHeight: 170, justifyContent: 'center', marginBottom: 12 },
  footer: { paddingTop: 14 },
  trust: { fontFamily: fonts.ui, fontSize: 13, color: colors.faint, textAlign: 'center', marginTop: 14 },
});
