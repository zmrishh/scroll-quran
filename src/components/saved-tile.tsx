import { StyleSheet, Text, View } from 'react-native';

import { lookup, passageEnglish, passageRef, surahInfo } from '@/data/content';
import { useApp } from '@/store/app-store';
import { colors, fonts } from '@/theme/tokens';

import { Surface, timeAgo } from './ui';

/** A saved card shown as a small version of itself: the Arabic, the line worth keeping, your note. */
export function SavedCard({ contentKey, at }: { contentKey: string; at: number }) {
  const note = useApp((s) => s.notes[contentKey]);
  const found = lookup(contentKey);
  if (!found?.item) return null;
  const { kind, item } = found;

  const reflection = note ? (
    <View style={styles.note}>
      <Text style={styles.noteLabel}>Your reflection</Text>
      <Text style={styles.noteText} numberOfLines={3}>
        {note.text}
      </Text>
    </View>
  ) : null;

  if (kind === 'ayah' || kind === 'dua') {
    const arabic = item.ayat.map((a) => a.ar).join(' ');
    // An ayah's key line is an excerpt, so mark where it was cut; a dua's key is the whole supplication.
    const en = passageEnglish(item);
    const excerpt =
      kind === 'dua' ? item.key : `${en.startsWith(item.key) ? '' : '…'}${item.key}${en.endsWith(item.key) ? '' : '…'}`;
    return (
      <Surface>
        {kind === 'dua' && <Text style={styles.duaTitle}>{item.title}</Text>}
        <Text style={styles.arabic} numberOfLines={2}>
          {arabic}
        </Text>
        <Text style={styles.line} numberOfLines={3}>
          {excerpt}
        </Text>
        {reflection}
        <Footer arabic={surahInfo(item.surah).arabic} label={(kind === 'dua' ? 'Dua · ' : '') + passageRef(item)} at={at} />
      </Surface>
    );
  }

  return (
    <Surface>
      <View style={styles.split}>
        <View style={{ flex: 1 }}>
          <Text style={styles.translit}>{item.translit}</Text>
          <Text style={styles.meaning}>{item.meaning}</Text>
        </View>
        <Text style={kind === 'name' ? styles.nameArabic : styles.dhikrArabic}>{item.arabic}</Text>
      </View>
      {reflection}
      <Footer label={kind === 'name' ? 'Name of Allah' : 'Dhikr'} at={at} />
    </Surface>
  );
}

function Footer({ arabic, label, at }: { arabic?: string; label: string; at: number }) {
  return (
    <View style={styles.footer}>
      {arabic && <Text style={styles.footerArabic}>{arabic}</Text>}
      <Text style={styles.footerLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.footerTime}>{timeAgo(at)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  duaTitle: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.gold, marginBottom: 4 },
  arabic: { fontFamily: fonts.quran, fontSize: 21, lineHeight: 40, color: colors.text, textAlign: 'right', writingDirection: 'rtl' },
  line: { fontFamily: fonts.read, fontSize: 16, lineHeight: 23, color: colors.read, marginTop: 6 },
  split: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  translit: { fontFamily: fonts.uiMedium, fontSize: 18, color: colors.text },
  meaning: { fontFamily: fonts.read, fontSize: 15, lineHeight: 21, color: colors.read, marginTop: 2 },
  nameArabic: { fontFamily: fonts.arabic, fontSize: 36, lineHeight: 64, color: colors.gold },
  dhikrArabic: { fontFamily: fonts.arabic, fontSize: 24, lineHeight: 46, color: colors.text, flexShrink: 1, textAlign: 'right' },
  note: { marginTop: 14, borderLeftWidth: 2, borderLeftColor: colors.gold, paddingLeft: 12 },
  noteLabel: { fontFamily: fonts.ui, fontSize: 12, color: colors.quiet },
  noteText: { fontFamily: fonts.readItalic, fontSize: 15, lineHeight: 22, color: colors.text, marginTop: 2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  footerArabic: { fontFamily: fonts.arabic, fontSize: 14, lineHeight: 26, color: colors.gold },
  footerLabel: { flex: 1, fontFamily: fonts.ui, fontSize: 12.5, color: colors.quiet },
  footerTime: { fontFamily: fonts.ui, fontSize: 12, color: colors.faint },
});
