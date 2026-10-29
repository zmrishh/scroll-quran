import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View, type HostInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardFooter } from '@/components/action-row';
import { CardFrame } from '@/components/card-frame';
import { ayahPages } from '@/components/cards/ayah-card';
import { CardBody, footerArabic, footerLabel, itemFromKey, openInSurah, sourceOf } from '@/components/feed-card';
import { CloseButton } from '@/components/ui';
import { NoteSheet } from '@/components/note-sheet';
import { PageBars } from '@/components/reading';
import { PASSAGES } from '@/data/content';
import { haptic } from '@/lib/feedback';
import { shareCard } from '@/lib/share';
import { saveOrUpsell } from '@/lib/upsell';
import { useApp } from '@/store/app-store';
import { makeStyles } from '@/theme/theme';
import { fonts, layout } from '@/theme/tokens';

export default function CardViewer() {
  const styles = useStyles();
  const { key } = useLocalSearchParams<{ key: string }>();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const shotRef = useRef<HostInstance>(null);
  const [capturing, setCapturing] = useState(false);
  const [page, setPage] = useState(0);
  const [noteOpen, setNoteOpen] = useState(false);
  const liked = useApp((s) => !!s.liked[key]);
  const saved = useApp((s) => !!s.saved[key]);
  const note = useApp((s) => s.notes[key]);
  const premium = useApp((s) => s.premium);
  const display = useApp((s) => s.display);
  const item = itemFromKey(key);
  if (!item) return <Missing />;
  const passage = item.kind === 'ayah' ? PASSAGES.find((p) => p.id === item.id) : undefined;
  const pages = passage ? ayahPages(passage, display) : [];
  const { toggleLike, like } = useApp.getState();
  const contentTop = insets.top + 64;

  return (
    <View style={{ flex: 1 }}>
      <CardFrame
        height={height}
        contentTop={contentTop}
        contentBottom={insets.bottom + 80}
        shotRef={shotRef}
        seed={key}
        watermark={capturing}
        onSingleTap={
          pages.length
            ? (side) => {
                const next = side === 'next' ? page + 1 : page - 1;
                if (next >= 0 && next < pages.length) setPage(next);
              }
            : undefined
        }
        onDoubleTap={() => {
          like(key, item.topics);
          haptic.medium();
        }}
        overlay={
          <>
            {pages.length > 0 && <PageBars count={pages.length} index={page} top={contentTop - 6} />}
            <CardFooter
              label={footerLabel(item)}
              arabic={footerArabic(item)}
              onSource={sourceOf(item) ? () => openInSurah(sourceOf(item)!) : undefined}
              bottom={insets.bottom + 16}
              actions={{
                liked,
                saved,
                noted: !!note,
                onLike: () => (toggleLike(key, item.topics) ? haptic.medium() : haptic.tap()),
                onSave: () => saveOrUpsell(key, item.topics),
                onNote: () => {
                  haptic.tap();
                  setNoteOpen(true);
                },
                onShare: () => shareCard(shotRef, premium ? undefined : setCapturing),
              }}
            />
            <NoteSheet open={noteOpen} noteKey={key} source={footerLabel(item)} onClose={() => setNoteOpen(false)} />
          </>
        }>
        <CardBody item={item} pages={pages} page={page} />
        {note && !capturing && (
          <Pressable onPress={() => setNoteOpen(true)} style={styles.note}>
            <Text style={styles.noteLabel}>Your reflection</Text>
            <Text style={styles.noteText}>{note.text}</Text>
          </Pressable>
        )}
      </CardFrame>
      <CloseButton style={[styles.close, { top: insets.top + 12 }]} />
    </View>
  );
}

/** A saved card whose content is no longer in the app (for example, after an update). */
function Missing() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.missing, { paddingTop: insets.top + 80 }]}>
      <Text style={styles.missingTitle}>This card is no longer available.</Text>
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Text style={styles.missingBack}>Go back</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  missing: { flex: 1, backgroundColor: colors.page, paddingHorizontal: 28 },
  missingTitle: { fontFamily: fonts.read, fontSize: 22, lineHeight: 30, color: colors.text },
  missingBack: { fontFamily: fonts.uiMedium, fontSize: 15, color: colors.gold, marginTop: 16 },
  close: { position: 'absolute', right: layout.gutter - 6 },
  note: { marginTop: 28, borderLeftWidth: 2, borderLeftColor: colors.gold, paddingLeft: 14 },
  noteLabel: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.quiet },
  noteText: { fontFamily: fonts.readItalic, fontSize: 16, lineHeight: 24, color: colors.read, marginTop: 4 },
}));
