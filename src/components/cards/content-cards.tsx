import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { contentKey, passageEnglish, type DivineName, type Dua } from '@/data/content';
import { haptic } from '@/lib/feedback';
import { useApp, type ArabicSize, type Display } from '@/store/app-store';
import { colors, fonts } from '@/theme/tokens';

import { canMemorise, MemoriseArabic, MemoriseToggle } from '../memorise';
import { Arabic, Translation, translationSize } from '../reading';

/** A dua: one line on when to say it, the Arabic, and the words with their narration quieter. */
export function DuaCard({ dua, display, size }: { dua: Dua; display: Display; size: ArabicSize }) {
  const en = passageEnglish(dua);
  const [memorising, setMemorising] = useState(false);
  return (
    <>
      <Text style={styles.when}>
        <Text style={styles.whenTitle}>{dua.title}. </Text>
        {dua.when}
      </Text>
      {display !== 'english' && (memorising ? <MemoriseArabic ayat={dua.ayat} size={size} /> : <Arabic ayat={dua.ayat} size={size} />)}
      {display !== 'arabic' && (
        <View style={display === 'english' ? null : styles.gap}>
          <Translation text={en} keyText={dua.key} fontSize={translationSize(en.length)} quietRest />
        </View>
      )}
      <View style={styles.duaActions}>
        <AmeenButton duaKey={contentKey('dua', dua.id)} />
        {display !== 'english' && canMemorise(dua.ayat) && (
          <MemoriseToggle on={memorising} onPress={() => setMemorising(!memorising)} />
        )}
      </View>
    </>
  );
}

/** Saying "Ameen" to a dua, the way people answer duas shared online; the app keeps a private count. */
function AmeenButton({ duaKey }: { duaKey: string }) {
  const [said, setSaid] = useState(false);
  const count = useApp((s) => s.ameen[duaKey] ?? 0);
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.ameenRow}>
      <Pressable
        accessibilityRole="button"
        disabled={said}
        onPress={() => {
          setSaid(true);
          useApp.getState().sayAmeen(duaKey);
          scale.set(withSequence(withTiming(0.9, { duration: 80 }), withSpring(1, { damping: 8, stiffness: 300 })));
          haptic.success();
        }}>
        <Animated.View style={[styles.ameen, said && styles.ameenOn, style]}>
          <Text style={[styles.ameenText, said && { color: colors.page }]}>{said ? 'Ameen ✓' : 'Ameen'}</Text>
        </Animated.View>
      </Pressable>
      {count > 0 && <Text style={styles.ameenCount}>{count === 1 ? 'Said once' : `Said ${count} times`}</Text>}
    </View>
  );
}

/** A Name of Allah: the Arabic large, then its meaning and one line to sit with. */
export function NameCard({ name }: { name: DivineName }) {
  return (
    <>
      <Text style={styles.nameArabic}>{name.arabic}</Text>
      <Text style={styles.translit}>{name.translit}</Text>
      <Text style={styles.meaning}>{name.meaning}</Text>
      <Text style={styles.reflection}>{name.reflection}</Text>
      <Text style={styles.root}>
        Root <Text style={styles.rootLetters}>{name.root.join(' ')}</Text> · {name.rootSense}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  when: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 20, color: colors.quiet, marginBottom: 22 },
  whenTitle: { fontFamily: fonts.uiMedium, color: colors.read },
  gap: { marginTop: 22 },
  duaActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 },
  ameenRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ameen: { height: 38, paddingHorizontal: 20, borderRadius: 19, borderWidth: 1, borderColor: colors.gold, justifyContent: 'center' },
  ameenOn: { backgroundColor: colors.gold },
  ameenText: { fontFamily: fonts.uiMedium, fontSize: 15, color: colors.gold },
  ameenCount: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet },
  nameArabic: { fontFamily: fonts.arabic, fontSize: 76, lineHeight: 140, color: colors.gold, textAlign: 'right', writingDirection: 'rtl' },
  translit: { fontFamily: fonts.uiMedium, fontSize: 26, letterSpacing: -0.4, color: colors.text, marginTop: 4 },
  meaning: { fontFamily: fonts.read, fontSize: 19, lineHeight: 27, color: colors.read, marginTop: 4 },
  reflection: { fontFamily: fonts.readItalic, fontSize: 17, lineHeight: 26, color: colors.read, marginTop: 26 },
  root: { fontFamily: fonts.ui, fontSize: 13, color: colors.faint, marginTop: 26 },
  rootLetters: { fontFamily: fonts.arabic, fontSize: 15, color: colors.gold },
});
