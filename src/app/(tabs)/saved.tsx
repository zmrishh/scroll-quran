import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { SavedCard } from '@/components/saved-tile';
import { Bar, Surface } from '@/components/ui';
import { lookup } from '@/data/content';
import { haptic } from '@/lib/feedback';
import { openPaywall } from '@/lib/upsell';
import { FREE_SAVES, useApp } from '@/store/app-store';
import { makeStyles, useColors } from '@/theme/theme';
import { fonts, layout } from '@/theme/tokens';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'ayah', label: 'Ayat' },
  { id: 'dua', label: 'Duas' },
  { id: 'name', label: 'Names' },
  { id: 'dhikr', label: 'Dhikr' },
  { id: 'notes', label: 'Reflections' },
] as const;

type Filter = (typeof FILTERS)[number]['id'];

export default function SavedScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const saved = useApp((s) => s.saved);
  const notes = useApp((s) => s.notes);
  const premium = useApp((s) => s.premium);
  const [filter, setFilter] = useState<Filter>('all');

  // Saved cards and cards with a reflection, newest first by whichever happened last.
  const when = new Map<string, number>();
  for (const [k, t] of Object.entries(saved)) when.set(k, t);
  for (const [k, n] of Object.entries(notes)) when.set(k, Math.max(when.get(k) ?? 0, n.at));
  // Content removed in an app update is skipped rather than shown as an empty card.
  const all = [...when.entries()].filter(([k]) => lookup(k)?.item).sort((a, b) => b[1] - a[1]);
  const matches = (k: string, f: Filter) => (f === 'all' ? true : f === 'notes' ? !!notes[k] : k.startsWith(f + ':'));
  const shown = all.filter(([k]) => matches(k, filter));
  const savedCount = Object.keys(saved).length;
  const noteCount = Object.keys(notes).length;

  return (
    <View style={styles.screen}>
      <FlatList
        data={shown}
        keyExtractor={([k]) => k}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Saved</Text>
            <Text style={styles.summary}>
              {savedCount} {savedCount === 1 ? 'card' : 'cards'} · {noteCount} {noteCount === 1 ? 'reflection' : 'reflections'}
            </Text>

            {!premium && (
              <Pressable onPress={() => openPaywall('saves')} style={styles.meter}>
                <View style={styles.meterTop}>
                  <Text style={styles.meterText}>
                    {Math.min(savedCount, FREE_SAVES)} of {FREE_SAVES} free saves used
                  </Text>
                  <Text style={styles.meterLink}>Unlimited with Plus</Text>
                </View>
                <Bar progress={savedCount / FREE_SAVES} style={{ marginTop: 10 }} />
              </Pressable>
            )}

            {all.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills} style={styles.pillsWrap}>
                {FILTERS.map((f) => {
                  const on = f.id === filter;
                  const count = all.filter(([k]) => matches(k, f.id)).length;
                  if (f.id !== 'all' && count === 0) return null;
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => {
                        haptic.tap();
                        setFilter(f.id);
                      }}
                      style={[styles.pill, on && styles.pillOn]}>
                      <Text style={[styles.pillText, on && styles.pillTextOn]}>{f.label}</Text>
                      <Text style={[styles.pillCount, on && styles.pillTextOn]}>{count}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        }
        ListEmptyComponent={<Empty />}
        renderItem={({ item: [k, at] }) => (
          <Pressable
            style={({ pressed }) => pressed && { opacity: 0.7 }}
            onPress={() => router.push({ pathname: '/card/[key]', params: { key: k } })}>
            <SavedCard contentKey={k} at={at} />
          </Pressable>
        )}
      />
    </View>
  );
}

function Empty() {
  const colors = useColors();
  const styles = useStyles();
  return (
    <Surface style={styles.empty}>
      <View style={styles.emptyIcons}>
        <Icon name="bookmark" size={22} color={colors.gold} />
        <Icon name="note" size={22} color={colors.gold} />
      </View>
      <Text style={styles.emptyTitle}>Keep the verses that stay with you</Text>
      <Text style={styles.emptyBody}>
        Tap the bookmark on any card to save it here, or the pen to write a reflection on it.
      </Text>
      <PrimaryButton label="Go to the feed" tone="quiet" onPress={() => router.navigate('/')} style={{ marginTop: 20 }} />
    </Surface>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.page },
  content: { paddingHorizontal: layout.gutter, paddingBottom: 30, maxWidth: 600, width: '100%', alignSelf: 'center' },
  header: { marginBottom: layout.gap },
  title: { fontFamily: fonts.read, fontSize: 32, color: colors.text },
  summary: { fontFamily: fonts.ui, fontSize: 14, color: colors.quiet, marginTop: 4 },
  meter: { marginTop: 18 },
  meterTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  meterText: { fontFamily: fonts.ui, fontSize: 13, color: colors.read },
  meterLink: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.gold },
  pillsWrap: { marginTop: 18, marginHorizontal: -layout.gutter },
  pills: { gap: 8, paddingHorizontal: layout.gutter },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: colors.raised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  pillOn: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  pillText: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.read },
  pillCount: { fontFamily: fonts.ui, fontSize: 13, color: colors.faint },
  pillTextOn: { color: colors.gold },
  empty: { alignItems: 'flex-start', padding: 22 },
  emptyIcons: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  emptyTitle: { fontFamily: fonts.read, fontSize: 20, lineHeight: 27, color: colors.text },
  emptyBody: { fontFamily: fonts.ui, fontSize: 14.5, lineHeight: 21, color: colors.quiet, marginTop: 6 },
}));
