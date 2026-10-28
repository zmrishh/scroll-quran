import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, type HostInstance } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { contentKey, DHIKR, DUAS, NAMES, PASSAGES, passageRef, surahInfo, type ContentKind } from '@/data/content';
import type { FeedItem } from '@/feed/engine';
import { haptic } from '@/lib/feedback';
import { shareCard } from '@/lib/share';
import { saveOrUpsell } from '@/lib/upsell';
import { useApp, type Mood } from '@/store/app-store';
import { useChrome } from '@/theme/layout';
import { colors, fonts } from '@/theme/tokens';

import { CardFooter } from './action-row';
import { CardFrame } from './card-frame';
import { AyahCard, ayahPages, PagedAyahCard } from './cards/ayah-card';
import { CheckInCard } from './cards/checkin-card';
import { DuaCard, NameCard } from './cards/content-cards';
import { DhikrCard } from './cards/dhikr-card';
import { QuizCard } from './cards/quiz-card';
import { Icon } from './icon';
import { NoteSheet } from './note-sheet';
import { PaywallPanel } from './paywall-panel';
import { PageBars } from './reading';

type Props = { item: FeedItem; height: number; active: boolean; showHint?: boolean; onMood?: (mood: Mood) => void };

/** One quiet line saying where a card comes from. */
export function footerLabel(item: FeedItem): string {
  switch (item.kind) {
    case 'ayah': {
      const p = PASSAGES.find((x) => x.id === item.id);
      return p ? passageRef(p) + (p.speaker ? ` · ${p.speaker}` : '') : '';
    }
    case 'dua': {
      const d = DUAS.find((x) => x.id === item.id);
      return d ? `Dua · ${passageRef(d)}` + (d.speaker ? ` · ${d.speaker}` : '') : '';
    }
    case 'name': {
      const n = NAMES.find((x) => x.id === item.id);
      return n?.ref ? `Name of Allah · ${n.ref}` : 'Name of Allah';
    }
    case 'dhikr':
      return 'Dhikr';
    case 'quiz':
      return 'Quiz';
    case 'checkin':
      return 'Daily check-in';
    default:
      return '';
  }
}

/** Where an ayah or dua card sits in the full Quran, for "read in context". */
export function sourceOf(item: FeedItem): { surah: number; ayah: number } | null {
  if (item.kind !== 'ayah' && item.kind !== 'dua') return null;
  const p = (item.kind === 'ayah' ? PASSAGES : DUAS).find((x) => x.id === item.id);
  return p ? { surah: p.surah, ayah: p.from } : null;
}

export const openInSurah = (src: { surah: number; ayah: number }) =>
  router.push({ pathname: '/surah/[n]', params: { n: String(src.surah), ayah: String(src.ayah) } });

/** The surah's Arabic name for ayah and dua cards. */
export function footerArabic(item: FeedItem): string | undefined {
  if (item.kind !== 'ayah' && item.kind !== 'dua') return undefined;
  const p = (item.kind === 'ayah' ? PASSAGES : DUAS).find((x) => x.id === item.id);
  return p ? surahInfo(p.surah).arabic : undefined;
}

export function FeedCard({ item, height, active, showHint, onMood }: Props) {
  const chrome = useChrome();
  const shotRef = useRef<HostInstance>(null);
  const [capturing, setCapturing] = useState(false);
  const [page, setPage] = useState(0);
  const [noteOpen, setNoteOpen] = useState(false);
  const key = item.kind === 'quiz' || item.kind === 'limit' || item.kind === 'checkin' ? null : contentKey(item.kind, item.id);
  const liked = useApp((s) => (key ? !!s.liked[key] : false));
  const saved = useApp((s) => (key ? !!s.saved[key] : false));
  const noted = useApp((s) => (key ? !!s.notes[key] : false));
  const premium = useApp((s) => s.premium);
  const display = useApp((s) => s.display);
  const { toggleLike, like } = useApp.getState();

  const passage = item.kind === 'ayah' ? PASSAGES.find((p) => p.id === item.id) : undefined;
  const pages = passage ? ayahPages(passage, display) : [];
  const source = sourceOf(item);

  useEffect(() => {
    if (active && item.kind === 'name') useApp.getState().seeName(item.id);
  }, [active, item]);

  if (item.kind === 'limit') return <LimitCard height={height} />;

  const turn = (side: 'next' | 'prev') => {
    const next = side === 'next' ? page + 1 : page - 1;
    if (next < 0 || next >= pages.length) return;
    haptic.tap();
    setPage(next);
  };

  return (
    <CardFrame
      height={height}
      contentTop={chrome.contentTop}
      contentBottom={chrome.contentBottom}
      shotRef={shotRef}
      watermark={capturing}
      onSingleTap={pages.length ? turn : undefined}
      onDoubleTap={
        key
          ? () => {
              like(key, item.topics);
              haptic.medium();
            }
          : undefined
      }
      overlay={
        <>
          {pages.length > 0 && <PageBars count={pages.length} index={page} top={chrome.contentTop - 6} />}
          <CardFooter
            label={footerLabel(item)}
            arabic={footerArabic(item)}
            onSource={source ? () => openInSurah(source) : undefined}
            bottom={chrome.footerBottom}
            actions={
              key
                ? {
                    liked,
                    saved,
                    noted,
                    onLike: () => (toggleLike(key, item.topics) ? haptic.medium() : haptic.tap()),
                    onSave: () => saveOrUpsell(key, item.topics),
                    onNote: () => {
                      haptic.tap();
                      setNoteOpen(true);
                    },
                    onShare: () => shareCard(shotRef, premium ? undefined : setCapturing),
                  }
                : undefined
            }
          />
          {showHint && <SwipeHint bottom={chrome.contentBottom} />}
          {key && <NoteSheet open={noteOpen} noteKey={key} source={footerLabel(item)} onClose={() => setNoteOpen(false)} />}
        </>
      }>
      <CardBody item={item} pages={pages} page={page} onMood={onMood} />
    </CardFrame>
  );
}

type BodyProps = { item: FeedItem; pages?: ReturnType<typeof ayahPages>; page?: number; onMood?: (mood: Mood) => void };

/** Renders a feed item's content. Shared by the feed and the saved-card viewer. */
export function CardBody({ item, pages = [], page = 0, onMood }: BodyProps) {
  const display = useApp((s) => s.display);
  const size = useApp((s) => s.arabicSize);
  switch (item.kind) {
    case 'ayah': {
      const passage = PASSAGES.find((p) => p.id === item.id);
      if (!passage) return null;
      return pages.length ? (
        <PagedAyahCard passage={passage} display={display} size={size} pages={pages} page={page} />
      ) : (
        <AyahCard passage={passage} display={display} size={size} blank={item.blank} />
      );
    }
    case 'dua': {
      const dua = DUAS.find((p) => p.id === item.id);
      return dua ? <DuaCard dua={dua} display={display} size={size} /> : null;
    }
    case 'name': {
      const name = NAMES.find((p) => p.id === item.id);
      return name ? <NameCard name={name} /> : null;
    }
    case 'dhikr': {
      const dhikr = DHIKR.find((p) => p.id === item.id);
      return dhikr ? <DhikrCard dhikr={dhikr} /> : null;
    }
    case 'quiz':
      return <QuizCard quiz={item.quiz} />;
    case 'checkin':
      return <CheckInCard onPick={onMood} />;
    default:
      return null;
  }
}

/** Builds a standalone feed item for a saved "<kind>:<id>" key. */
export function itemFromKey(key: string): FeedItem | null {
  const i = key.indexOf(':');
  const kind = key.slice(0, i) as ContentKind;
  const id = key.slice(i + 1);
  const pool = { ayah: PASSAGES, dua: DUAS, name: NAMES, dhikr: DHIKR }[kind];
  const found = pool?.find((p) => p.id === id);
  return found ? { kind, id, key, topics: found.topics } : null;
}

function SwipeHint({ bottom }: { bottom: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.set(withDelay(1200, withRepeat(withSequence(withTiming(-5, { duration: 600 }), withTiming(0, { duration: 600 })), -1, false)));
  }, [y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.hint, { bottom }, style]}>
      <Icon name="chevron-up" size={16} color={colors.faint} strokeWidth={2} />
      <Text style={styles.hintText}>Swipe up for the next verse</Text>
    </Animated.View>
  );
}

/**
 * The end of the free feed: the paywall itself, with no way to dismiss it.
 * New free cards arrive at midnight; until then the only way on is Plus.
 */
function LimitCard({ height }: { height: number }) {
  const chrome = useChrome();
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const mins = Math.max(1, Math.round((midnight.getTime() - now.getTime()) / 60000));
  const resetIn = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;

  return (
    <View style={[styles.limit, { height, paddingTop: chrome.contentTop - 10, paddingBottom: 16 }]}>
      <PaywallPanel reason="limit" compact />
      <Text style={styles.limitReset}>Your free cards come back in {resetIn}.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 2 },
  hintText: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.faint },
  limit: { backgroundColor: colors.page, paddingHorizontal: 28, justifyContent: 'center' },
  limitReset: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.quiet, textAlign: 'center', marginTop: 10 },
});
