import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Surface } from '@/components/ui';
import { surahInfo, SURAHS, type Surah } from '@/data/content';
import { useApp } from '@/store/app-store';
import { colors, fonts } from '@/theme/tokens';

const openSurah = (n: number, ayah?: number) =>
  router.push({ pathname: '/surah/[n]', params: ayah ? { n: String(n), ayah: String(ayah) } : { n: String(n) } });

/** Matches a surah by number, transliterated name, Arabic name or English meaning. */
function matches(s: Surah, q: string) {
  if (!q) return true;
  if (/^\d+$/.test(q)) return String(s.n).startsWith(q);
  const plain = (x: string) => x.toLowerCase().replace(/[^a-z]/g, '');
  return plain(s.name).includes(plain(q)) || s.meaning.toLowerCase().includes(q.toLowerCase()) || s.arabic.includes(q);
}

export default function QuranScreen() {
  const insets = useSafeAreaInsets();
  const lastRead = useApp((s) => s.lastRead);
  const [query, setQuery] = useState('');
  const q = query.trim();
  const shown = SURAHS.filter((s) => matches(s, q));

  return (
    <View style={styles.screen}>
      <FlatList
        data={shown}
        keyExtractor={(s) => String(s.n)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Quran</Text>

            {lastRead && (
              <Pressable onPress={() => openSurah(lastRead.surah, lastRead.ayah)}>
                {({ pressed }) => (
                  <Surface accent style={[styles.continue, pressed && { opacity: 0.8 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.continueLabel}>Continue reading</Text>
                      <Text style={styles.continueName}>
                        {surahInfo(lastRead.surah).name} · ayah {lastRead.ayah}
                      </Text>
                    </View>
                    <Text style={styles.continueArabic}>{surahInfo(lastRead.surah).arabic}</Text>
                  </Surface>
                )}
              </Pressable>
            )}

            <View style={styles.search}>
              <Icon name="search" size={18} color={colors.quiet} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name or number"
                placeholderTextColor={colors.faint}
                style={styles.searchInput}
                selectionColor={colors.gold}
                autoCorrect={false}
                returnKeyType="search"
              />
              {query ? (
                <Pressable hitSlop={10} onPress={() => setQuery('')} accessibilityLabel="Clear search">
                  <Icon name="x" size={16} color={colors.quiet} />
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No surah matches “{q}”.</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => openSurah(item.n)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
            <View style={styles.num}>
              <Text style={styles.numText}>{item.n}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.meaning} · {item.type} · {item.ayahs} ayat
              </Text>
            </View>
            <Text style={styles.arabic}>{item.arabic}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  content: { paddingHorizontal: 20, paddingBottom: 30, maxWidth: 600, width: '100%', alignSelf: 'center' },
  header: { marginBottom: 8, paddingHorizontal: 8 },
  title: { fontFamily: fonts.read, fontSize: 32, color: colors.text },
  continue: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  continueLabel: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.gold },
  continueName: { fontFamily: fonts.uiMedium, fontSize: 16, color: colors.text, marginTop: 2 },
  continueArabic: { fontFamily: fonts.arabic, fontSize: 22, lineHeight: 42, color: colors.gold },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    marginTop: 18,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.raised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  searchInput: { flex: 1, fontFamily: fonts.ui, fontSize: 15, color: colors.text, padding: 0 },
  empty: { fontFamily: fonts.read, fontSize: 16, color: colors.quiet, marginTop: 20, paddingHorizontal: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  num: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.gold, fontVariant: ['tabular-nums'] },
  name: { fontFamily: fonts.uiMedium, fontSize: 16, color: colors.text },
  meta: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.quiet, marginTop: 2 },
  arabic: { fontFamily: fonts.arabic, fontSize: 20, lineHeight: 38, color: colors.gold },
});
