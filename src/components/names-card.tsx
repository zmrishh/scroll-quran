import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';

import { NAMES } from '@/data/content';
import { haptic } from '@/lib/feedback';
import { useApp } from '@/store/app-store';
import { makeStyles } from '@/theme/theme';
import { fonts } from '@/theme/tokens';

import { Surface } from './ui';

/**
 * The names of Allah met in the feed, strung like prayer beads: one bead for each name, gold once it's been met. The
 * names met can be swiped through, starting from the latest, and a tap opens the name's card.
 */
export function NamesCard() {
  const styles = useStyles();
  const seen = useApp((s) => s.seenNames);
  const met = NAMES.filter((n) => seen[n.id]);
  // Keys keep the order they were added in, so the last one is the name met most recently.
  const latest = Object.keys(seen).findLast((id) => met.some((n) => n.id === id));
  const start = Math.max(0, met.findIndex((n) => n.id === latest));
  const [page, setPage] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const pager = useRef<ScrollViewInstance>(null);
  const placed = useRef(false);
  const current = met[Math.min(page ?? start, met.length - 1)];

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width || !placed.current) return;
    const i = Math.min(met.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.x / width)));
    if (i !== (page ?? start)) {
      haptic.tap();
      setPage(i);
    }
  };

  return (
    <Surface style={styles.card}>
      {met.length > 0 && (
        <View onLayout={onLayout}>
          {width > 0 && (
            <ScrollView
              ref={pager}
              horizontal
              pagingEnabled
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={onScroll}
              onContentSizeChange={() => {
                if (placed.current) return;
                pager.current?.scrollTo({ x: start * width, animated: false });
                placed.current = true;
              }}>
              {met.map((n) => (
                <Pressable
                  key={n.id}
                  onPress={() => router.push({ pathname: '/card/[key]', params: { key: `name:${n.id}` } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${n.translit}, ${n.meaning}`}
                  style={({ pressed }) => [styles.page, { width }, pressed && { opacity: 0.7 }]}>
                  <Text style={styles.arabic}>{n.arabic}</Text>
                  <Text style={styles.translit}>{n.translit}</Text>
                  <Text style={styles.meaning}>{n.meaning}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      <View style={[styles.beads, met.length > 0 && styles.beadsUnder]} accessibilityLabel={`${met.length} of ${NAMES.length} names met`}>
        <View style={styles.string} />
        {NAMES.map((n) => (
          <View key={n.id} style={styles.slot}>
            <View style={[styles.bead, seen[n.id] && styles.beadMet, current?.id === n.id && styles.beadNow]} />
          </View>
        ))}
      </View>

      {met.length === 0 && <Text style={styles.empty}>Names you meet in the feed gather here.</Text>}
    </Surface>
  );
}

const useStyles = makeStyles((colors) => ({
  card: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 20 },
  page: { alignItems: 'center', paddingBottom: 2 },
  arabic: { fontFamily: fonts.arabic, fontSize: 36, lineHeight: 66, color: colors.gold, textAlign: 'center' },
  translit: { fontFamily: fonts.read, fontSize: 20, lineHeight: 26, color: colors.text, textAlign: 'center' },
  meaning: { fontFamily: fonts.ui, fontSize: 13.5, color: colors.quiet, textAlign: 'center', marginTop: 4 },

  beads: { flexDirection: 'row', alignItems: 'center', height: 14 },
  beadsUnder: { marginTop: 20 },
  // The string the beads hang on, through their middles.
  string: { position: 'absolute', left: 4, right: 4, top: 7, height: 1, backgroundColor: colors.gold, opacity: 0.3 },
  slot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bead: { width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: colors.faint, backgroundColor: colors.raised },
  beadMet: { width: 8, height: 8, borderRadius: 4, borderWidth: 0, backgroundColor: colors.gold },
  beadNow: { width: 12, height: 12, borderRadius: 6 },
  empty: { fontFamily: fonts.read, fontSize: 15, lineHeight: 22, color: colors.quiet, textAlign: 'center', marginTop: 16 },
}));
