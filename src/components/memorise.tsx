import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { arabicNumber, type Passage } from '@/data/content';
import { haptic } from '@/lib/feedback';
import { useApp, type ArabicSize } from '@/store/app-store';
import { makeStyles, useColors } from '@/theme/theme';
import { fonts } from '@/theme/tokens';

import { arabicSize } from './reading';

const SIZE_SCALE: Record<ArabicSize, number> = { s: 0.88, m: 1, l: 1.14 };

/** Only passages short enough to practise word by word offer memorise mode. */
export const canMemorise = (ayat: Passage['ayat']) => ayat.reduce((s, a) => s + a.ar.length, 0) <= 240;

type Token = { text: string; marker: boolean };

/**
 * Hifz practice: every Arabic word starts hidden; tap a word to check yourself.
 * Going through the whole passage counts once towards "ayat memorised".
 */
export function MemoriseArabic({ ayat, size }: { ayat: Passage['ayat']; size: ArabicSize }) {
  const styles = useStyles();
  const tokens: Token[] = ayat.flatMap((a) => [
    ...a.ar.split(' ').map((w) => ({ text: w, marker: false })),
    { text: `۝${arabicNumber(a.n)}`, marker: true },
  ]);
  const words = tokens.filter((t) => !t.marker).length;
  const [shown, setShown] = useState<Set<number>>(() => new Set());
  const [done, setDone] = useState(false);
  const fs = arabicSize(ayat.reduce((s, a) => s + a.ar.length, 0)) * SIZE_SCALE[size];

  const reveal = (i: number) => {
    if (shown.has(i)) return;
    const next = new Set(shown).add(i);
    setShown(next);
    if (next.size === words && !done) {
      setDone(true);
      useApp.getState().addMemorised();
      haptic.success();
    } else haptic.tap();
  };

  let wordIndex = -1;
  return (
    <View>
      <View style={styles.words}>
        {tokens.map((t, i) => {
          if (t.marker) {
            return (
              <Text key={i} style={[styles.marker, { fontSize: fs, lineHeight: fs * 1.9 }]}>
                {t.text}
              </Text>
            );
          }
          const w = ++wordIndex;
          const visible = shown.has(w);
          return (
            <Pressable key={i} onPress={() => reveal(w)} hitSlop={4} accessibilityLabel={visible ? t.text : 'Hidden word'}>
              <Text
                style={[
                  styles.word,
                  { fontSize: fs, lineHeight: fs * 1.9, marginHorizontal: fs * 0.14 },
                  !visible && styles.hidden,
                ]}>
                {t.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.bar}>
        <Text style={styles.progress}>
          {shown.size} of {words} words
        </Text>
        <View style={styles.actions}>
          <Pressable hitSlop={8} onPress={() => setShown(new Set(Array.from({ length: words }, (_, i) => i)))}>
            <Text style={styles.action}>Show all</Text>
          </Pressable>
          <Pressable
            hitSlop={8}
            onPress={() => {
              setShown(new Set());
              setDone(false);
            }}>
            <Text style={styles.action}>Hide all</Text>
          </Pressable>
        </View>
      </View>
      {done && (
        <Animated.Text entering={FadeIn.duration(300)} style={styles.done}>
          You went through every word. Try it again tomorrow.
        </Animated.Text>
      )}
    </View>
  );
}

/** The quiet text button that switches a card into and out of memorise mode. */
export function MemoriseToggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <Pressable
      hitSlop={10}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      style={styles.toggle}
      accessibilityRole="button">
      <Text style={[styles.toggleText, on && { color: colors.gold }]}>{on ? 'Done memorising' : 'Memorise this'}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  words: { flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'center' },
  word: { fontFamily: fonts.quran, color: colors.text, writingDirection: 'rtl' },
  hidden: { color: 'transparent', backgroundColor: colors.line, borderRadius: 8 },
  marker: { fontFamily: fonts.quran, color: colors.gold, marginHorizontal: 4 },
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  progress: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet, fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', gap: 18 },
  action: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.read },
  done: { fontFamily: fonts.read, fontSize: 15, lineHeight: 22, color: colors.gold, marginTop: 10 },
  toggle: { alignSelf: 'flex-start', marginTop: 20 },
  toggleText: { fontFamily: fonts.uiMedium, fontSize: 13.5, color: colors.quiet },
}));
