import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TOPICS, topicLabel, type Topic } from '@/data/content';
import { haptic } from '@/lib/feedback';
import { openPaywall } from '@/lib/upsell';
import { FREE_DAILY_CARDS, useApp } from '@/store/app-store';
import { HEADER_HEIGHT } from '@/theme/layout';
import { colors, fonts } from '@/theme/tokens';

import { Icon } from './icon';

type Props = { topic: Topic | null; onTopic: (t: Topic | null) => void };

/** Wordmark, a topic picker and today's count. Nothing else sits above the verse. */
export function FeedHeader({ topic, onTopic }: Props) {
  const insets = useSafeAreaInsets();
  const viewed = useApp((s) => s.viewedToday);
  const premium = useApp((s) => s.premium);
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]} pointerEvents="box-none">
      <View style={styles.row}>
        <Text style={styles.word}>Scroll Quran</Text>
        <View style={styles.right}>
          {!premium && (
            <Text style={styles.count} accessibilityLabel={`${viewed} of ${FREE_DAILY_CARDS} cards today`}>
              {Math.min(viewed, FREE_DAILY_CARDS)}/{FREE_DAILY_CARDS}
            </Text>
          )}
          <Pressable
            hitSlop={10}
            onPress={() => {
              haptic.tap();
              setOpen(true);
            }}
            style={styles.picker}
            accessibilityRole="button"
            accessibilityLabel="Choose a topic">
            <Text style={styles.pickerText}>{topic ? topicLabel(topic) : 'For you'}</Text>
            <Icon name="chevron-down" size={16} color={colors.read} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
      <TopicSheet
        open={open}
        topic={topic}
        locked={!premium}
        onClose={() => setOpen(false)}
        onPick={(t) => {
          setOpen(false);
          // Topic feeds are part of Plus; free users get "For you".
          if (t && !premium) openPaywall('topic', t);
          else if (t !== topic) onTopic(t);
        }}
      />
    </View>
  );
}

type SheetProps = { open: boolean; topic: Topic | null; locked: boolean; onClose: () => void; onPick: (t: Topic | null) => void };

function TopicSheet({ open, topic, locked, onClose, onPick }: SheetProps) {
  const insets = useSafeAreaInsets();
  const rows: { id: Topic | null; label: string; arabic: string }[] = [
    { id: null, label: 'For you', arabic: '' },
    ...TOPICS.map((t) => ({ id: t.id, label: t.label, arabic: t.arabic })),
  ];
  return (
    <Modal visible={open} transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.sheetTitle}>Show me</Text>
        {rows.map((r) => {
          const on = r.id === topic;
          return (
            <Pressable
              key={r.label}
              onPress={() => {
                haptic.tap();
                onPick(r.id);
              }}
              style={({ pressed }) => [styles.sheetRow, pressed && { opacity: 0.6 }]}>
              <Text style={[styles.sheetLabel, on && { color: colors.text }]}>{r.label}</Text>
              <Text style={styles.sheetArabic}>{r.arabic}</Text>
              <View style={styles.sheetCheck}>
                {on ? (
                  <Icon name="check" size={18} color={colors.gold} strokeWidth={2.2} />
                ) : (
                  locked && r.id && <Icon name="lock" size={15} color={colors.faint} strokeWidth={1.8} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  row: { height: HEADER_HEIGHT, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28 },
  word: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.quiet },
  right: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  count: { fontFamily: fonts.ui, fontSize: 13, color: colors.faint, fontVariant: ['tabular-nums'] },
  picker: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pickerText: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.read },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: colors.raised, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 18, paddingHorizontal: 24 },
  sheetTitle: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet, marginBottom: 6 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', height: 50, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  sheetLabel: { flex: 1, fontFamily: fonts.uiMedium, fontSize: 17, color: colors.read },
  sheetArabic: { fontFamily: fonts.arabic, fontSize: 17, lineHeight: 32, color: colors.quiet },
  sheetCheck: { width: 30, alignItems: 'flex-end' },
});
