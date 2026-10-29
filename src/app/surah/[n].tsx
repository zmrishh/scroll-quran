import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, type ListViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { arabicSize } from '@/components/reading';
import { arabicNumber, PASSAGES, surahInfo, type Ayah } from '@/data/content';
import { surahAyat } from '@/data/full';
import { useApp } from '@/store/app-store';
import { makeStyles, useColors } from '@/theme/theme';
import { fonts, layout } from '@/theme/tokens';

const SIZE_SCALE = { s: 0.88, m: 1, l: 1.14 } as const;
// Tanzil's 1:1, shown above every surah except Al-Fatihah (where it is ayah 1) and At-Tawbah.
const BISMILLAH = PASSAGES.find((p) => p.surah === 1)?.ayat[0].ar ?? '';

/** One whole surah: every ayah in Arabic and English, opened at a given ayah if asked. */
export default function SurahReader() {
  const colors = useColors();
  const styles = useStyles();
  const params = useLocalSearchParams<{ n: string; ayah?: string }>();
  const n = Math.min(114, Math.max(1, Number(params.n) || 1));
  const target = params.ayah ? Number(params.ayah) : 0;
  const insets = useSafeAreaInsets();
  const info = surahInfo(n);
  const display = useApp((s) => s.display);
  const size = useApp((s) => s.arabicSize);
  const [ayat] = useState(() => surahAyat(n));
  const [highlight, setHighlight] = useState(target);
  const listRef = useRef<FlatList<Ayah>>(null);
  const [onViewable] = useState(() => ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.item) useApp.getState().setLastRead(n, (first.item as Ayah).n);
  });

  // Jump to the requested ayah once the list has laid out, then let the highlight fade.
  useEffect(() => {
    if (target < 2) return;
    const jump = setTimeout(() => listRef.current?.scrollToIndex({ index: target - 1, viewPosition: 0, animated: false }), 50);
    const fade = setTimeout(() => setHighlight(0), 2400);
    return () => {
      clearTimeout(jump);
      clearTimeout(fade);
    };
  }, [target]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <Pressable hitSlop={12} onPress={() => router.back()} accessibilityLabel="Back" style={styles.back}>
          <Icon name="chevron-left" size={24} color={colors.read} strokeWidth={2} />
        </Pressable>
        <Text style={styles.barTitle} numberOfLines={1}>
          {n}. {info.name}
        </Text>
        <Text style={styles.barArabic}>{info.arabic}</Text>
      </View>

      <FlatList
        ref={listRef}
        data={ayat}
        keyExtractor={(a) => String(a.n)}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        onViewableItemsChanged={onViewable}
        initialNumToRender={Math.max(12, target + 4)}
        onScrollToIndexFailed={(e) => {
          listRef.current?.scrollToOffset({ offset: e.averageItemLength * e.index, animated: false });
          setTimeout(() => listRef.current?.scrollToIndex({ index: e.index, viewPosition: 0, animated: false }), 120);
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerArabic}>{info.arabic}</Text>
            <Text style={styles.headerName}>{info.name}</Text>
            <Text style={styles.headerMeta}>
              {info.meaning} · {info.type} · {info.ayahs} ayat
            </Text>
            {n !== 1 && n !== 9 && display !== 'english' && <Text style={styles.bismillah}>{BISMILLAH}</Text>}
          </View>
        }
        renderItem={({ item }) => <AyahRow ayah={item} display={display} scale={SIZE_SCALE[size]} lit={item.n === highlight} />}
      />
    </View>
  );
}

function AyahRow({ ayah, display, scale, lit }: { ayah: Ayah; display: string; scale: number; lit: boolean }) {
  const styles = useStyles();
  const fs = Math.min(arabicSize(ayah.ar.length), 27) * scale;
  return (
    <View style={[styles.row, lit && styles.rowLit]}>
      <Text style={styles.number}>{ayah.n}</Text>
      {display !== 'english' && (
        <Text style={[styles.arabic, { fontSize: fs, lineHeight: fs * 1.9 }]}>
          {ayah.ar}
          <Text style={styles.marker}>{` ۝${arabicNumber(ayah.n)}`}</Text>
        </Text>
      )}
      {display !== 'arabic' && <Text style={styles.english}>{ayah.en}</Text>}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.page },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 16 },
  back: { width: 32, height: 32, justifyContent: 'center' },
  barTitle: { flex: 1, fontFamily: fonts.uiMedium, fontSize: 15, color: colors.read },
  barArabic: { fontFamily: fonts.arabic, fontSize: 17, lineHeight: 32, color: colors.gold },
  header: { alignItems: 'center', paddingHorizontal: layout.gutter, paddingTop: 18, paddingBottom: 26 },
  headerArabic: { fontFamily: fonts.arabic, fontSize: 44, lineHeight: 84, color: colors.gold },
  headerName: { fontFamily: fonts.read, fontSize: 24, color: colors.text },
  headerMeta: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet, marginTop: 4 },
  bismillah: { fontFamily: fonts.quran, fontSize: 22, lineHeight: 44, color: colors.text, marginTop: 22 },
  row: { paddingHorizontal: layout.gutter, paddingVertical: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  rowLit: { backgroundColor: colors.goldSoft },
  number: { fontFamily: fonts.uiMedium, fontSize: 12.5, color: colors.gold, marginBottom: 6 },
  arabic: { fontFamily: fonts.quran, color: colors.text, textAlign: 'right', writingDirection: 'rtl' },
  marker: { color: colors.gold },
  english: { fontFamily: fonts.read, fontSize: 17, lineHeight: 26, color: colors.read, marginTop: 10 },
}));
