import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { arabicNumber, PASSAGES, type Passage } from '@/data/content';
import { haptic } from '@/lib/feedback';
import type { ArabicSize } from '@/store/app-store';
import { colors, fonts } from '@/theme/tokens';

const SIZE_SCALE: Record<ArabicSize, number> = { s: 0.88, m: 1, l: 1.14 };

// Tanzil's 1:1, shown as its own line above passages that open a surah.
const BISMILLAH = PASSAGES.find((p) => p.surah === 1)?.ayat[0].ar ?? '';

export function arabicSize(chars: number) {
  if (chars <= 60) return 34;
  if (chars <= 110) return 30;
  if (chars <= 170) return 27;
  if (chars <= 240) return 24;
  if (chars <= 320) return 22;
  return 20;
}

export function translationSize(chars: number) {
  if (chars <= 90) return 20;
  if (chars <= 160) return 18.5;
  if (chars <= 260) return 17;
  return 16;
}

/** The Arabic of a passage, right-aligned, with numbered ayah markers. */
export function Arabic({ ayat, bismillah, size, boost = 0 }: { ayat: Passage['ayat']; bismillah?: boolean; size: ArabicSize; boost?: number }) {
  const chars = ayat.reduce((s, a) => s + a.ar.length, 0);
  const fs = (arabicSize(chars) + boost) * SIZE_SCALE[size];
  return (
    <View>
      {bismillah && <Text style={styles.bismillah}>{BISMILLAH}</Text>}
      <Text style={[styles.arabic, { fontSize: fs, lineHeight: fs * 1.9 }]}>
        {ayat.map((a, i) => (
          <Text key={a.n}>
            {a.ar}
            {/* No-break space keeps the ayah marker on the line of its last word. */}
            <Text style={styles.marker}>{` ۝${arabicNumber(a.n)}`}</Text>
            {i < ayat.length - 1 ? ' ' : ''}
          </Text>
        ))}
      </Text>
    </View>
  );
}

type TranslationProps = {
  text: string;
  /** Brightened against the rest of the translation; hidden when `blank`. */
  keyText?: string;
  fontSize: number;
  blank?: boolean;
  /** Dims the words outside the key one more step (duas: the narration around the words to say). */
  quietRest?: boolean;
};

/** The English meaning. The key line is set brighter than the rest; nothing else is marked. */
export function Translation({ text, keyText, fontSize, blank, quietRest }: TranslationProps) {
  const [revealed, setRevealed] = useState(false);
  const ks = keyText ? text.indexOf(keyText) : -1;
  const style = [styles.read, { fontSize, lineHeight: fontSize * 1.55 }];
  if (ks < 0) return <Text style={style}>{text}</Text>;

  const before = text.slice(0, ks);
  const key = text.slice(ks, ks + keyText!.length);
  const after = text.slice(ks + keyText!.length);
  const hidden = blank && !revealed;
  const rest = quietRest ? styles.quietRest : null;

  return (
    <View>
      <Text style={style}>
        <Text style={rest}>{before}</Text>
        {hidden ? (
          <Text
            onPress={() => {
              haptic.medium();
              setRevealed(true);
            }}
            style={styles.blank}>
            {key}
          </Text>
        ) : (
          <Text style={styles.key}>{key}</Text>
        )}
        <Text style={rest}>{after}</Text>
      </Text>
      {hidden && <Text style={styles.blankHint}>Tap the gap to see the missing words</Text>}
    </View>
  );
}

/** Thin segmented bars for passages read in pages; sits just above the content area. */
export function PageBars({ count, index, top }: { count: number; index: number; top: number }) {
  return (
    <View style={[styles.bars, { top }]} pointerEvents="none">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.bar, { backgroundColor: i <= index ? colors.gold : colors.line }]} />
      ))}
    </View>
  );
}

/** Small grey line under the content: a hint, a context line. */
export function Note({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[styles.note, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  bismillah: { fontFamily: fonts.quran, fontSize: 17, lineHeight: 34, color: colors.gold, textAlign: 'right', writingDirection: 'rtl' },
  arabic: { fontFamily: fonts.quran, color: colors.text, textAlign: 'right', writingDirection: 'rtl' },
  marker: { color: colors.gold },
  read: { fontFamily: fonts.read, color: colors.read },
  key: { color: colors.text },
  quietRest: { color: colors.quiet },
  blank: { color: 'transparent', backgroundColor: colors.line },
  blankHint: { fontFamily: fonts.ui, fontSize: 13, color: colors.faint, marginTop: 10 },
  bars: { position: 'absolute', left: 28, right: 28, flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 2, borderRadius: 1 },
  note: { fontFamily: fonts.ui, fontSize: 13, color: colors.faint, marginTop: 18 },
});
