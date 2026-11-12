import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { DHIKR, DUAS, NAMES, PASSAGES, passageEnglish, type Topic } from '@/data/content';
import type { CardStyleId } from '@/data/styles';
import type { FeedItem } from '@/feed/engine';
import { TabBarSpace, tabBarSpace } from '@/theme/layout';
import { makeStyles } from '@/theme/theme';
import { fonts } from '@/theme/tokens';

import { CardStyleOverride } from './card-style';
import { FeedCard } from './feed-card';
import { FeedHeader } from './feed-header';
import { SurahView } from './surah-view';
import { BottomBar, TabButton } from './tab-bar';

// The phone the previews are laid out on, in points, with an iPhone's safe areas. It is then scaled to fit, so the
// preview is the real app at a smaller size rather than a picture of it.
const SCREEN = { width: 390, height: 844 };
const INSETS = { top: 54, bottom: 34, left: 0, right: 0 };
const CORNER = 55;
// The tab bar floats over the screen, as in the app, so cards run the full height and keep room at their foot.
const CARD_HEIGHT = SCREEN.height;
const EVERY_MS = 2800;

type Tab = 'feed' | 'quran';

/** A phone showing part of the app, scaled to the given height. It can't be touched; it only plays. */
export function PhonePreview({ height, children }: { height: number; children: ReactNode }) {
  const styles = useStyles();
  const bezel = Math.max(6, Math.round(height * 0.02));
  const screenHeight = height - bezel * 2;
  const scale = screenHeight / SCREEN.height;
  const screenWidth = SCREEN.width * scale;
  const radius = CORNER * scale;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.body, { width: screenWidth + bezel * 2, height, borderRadius: radius + bezel, padding: bezel }]}>
      <View style={[styles.screen, { width: screenWidth, height: screenHeight, borderRadius: radius }]}>
        <View
          style={{
            position: 'absolute',
            width: SCREEN.width,
            height: SCREEN.height,
            left: (screenWidth - SCREEN.width) / 2,
            top: (screenHeight - SCREEN.height) / 2,
            transform: [{ scale }],
          }}>
          <SafeAreaInsetsContext.Provider value={INSETS}>{children}</SafeAreaInsetsContext.Provider>
          <Text style={styles.time}>9:41</Text>
          <View style={styles.island} />
        </View>
      </View>
    </View>
  );
}

/**
 * One phone that stays put while what's on its screen changes: the new screen fades in over the old one, so moving
 * between steps feels like the same app carrying on. It rises into place the first time it appears.
 */
export function PhoneStage({ id, height, render }: { id: string; height: number; render: (id: string) => ReactNode }) {
  // The screens on the phone: the one showing, and while it fades in, the one it replaces.
  const [ids, setIds] = useState([id]);
  const [shown, setShown] = useState(id);
  if (shown !== id) {
    setShown(id);
    setIds((list) => [...list.filter((x) => x !== id), id]);
  }
  const rise = useSharedValue(0);

  useEffect(() => {
    rise.set(withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) }));
  }, [rise]);

  useEffect(() => {
    const timer = setTimeout(() => setIds([id]), 700);
    return () => clearTimeout(timer);
  }, [id]);

  const style = useAnimatedStyle(() => ({ opacity: rise.get(), transform: [{ translateY: 28 * (1 - rise.get()) }] }));

  return (
    <Animated.View style={style}>
      <PhonePreview height={height}>
        {ids.map((x) => (
          <Layer key={x} visible={x === id}>
            {render(x)}
          </Layer>
        ))}
      </PhonePreview>
    </Animated.View>
  );
}

function Layer({ visible, children }: { visible: boolean; children: ReactNode }) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.set(withTiming(visible ? 1 : 0, { duration: 600, easing: Easing.inOut(Easing.quad) }));
  }, [visible, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return <Animated.View style={[{ position: 'absolute', width: SCREEN.width, height: SCREEN.height }, style]}>{children}</Animated.View>;
}

const passage = (id: string) => PASSAGES.find((p) => p.id === id) ?? PASSAGES[0];
const card = (kind: 'ayah' | 'dua' | 'name' | 'dhikr', id: string, topics: FeedItem['topics'] = []): FeedItem => ({
  kind,
  key: `preview:${kind}:${id}`,
  id,
  topics,
});

// What a first scroll looks like: verses carry it, with a dua, a Name of Allah and a dhikr between them.
const FEED: FeedItem[] = [
  card('ayah', passage('13:28').id),
  card('name', NAMES[0].id),
  card('ayah', passage('94:5-6').id),
  card('dua', DUAS[0].id),
  card('ayah', passage('2:152').id),
  card('dhikr', DHIKR[0].id),
];

// The check-in, then what follows it for an anxious heart.
const HEART: FeedItem[] = [
  { kind: 'checkin', key: 'preview:checkin', topics: [] },
  card('ayah', passage('65:3').id),
  card('ayah', passage('2:286').id),
];

const STYLES: CardStyleId[] = ['blue', 'rosette', 'morocco', 'fatiha', 'baghdad'];

/** The feed, swiping on by itself. */
export function FeedPreview() {
  return (
    <Screen tab="feed">
      <Swipe items={FEED} header />
    </Screen>
  );
}

/** Short verses from the reader's own topics, taking turns, so the feed they just asked for is the one they see. */
function topicFeed(topics: readonly Topic[]): FeedItem[] {
  const short = PASSAGES.filter((p) => passageEnglish(p).length <= 160);
  const picked: FeedItem[] = [];
  for (let round = 0; round < 3 && picked.length < 6; round++) {
    for (const t of topics) {
      const p = short.filter((x) => x.topics.includes(t) && !picked.some((i) => i.kind === 'ayah' && i.id === x.id))[0];
      if (p && picked.length < 6) picked.push(card('ayah', p.id, p.topics));
    }
  }
  return picked.length ? picked : FEED;
}

/** A feed made from the reader's topics; with `topic`, that topic's own feed, as Plus opens it. */
export function TopicFeedPreview({ topics, topic = null }: { topics: readonly Topic[]; topic?: Topic | null }) {
  const items = useMemo(() => topicFeed(topic ? [topic] : topics), [topics, topic]);
  return (
    <Screen tab="feed">
      <Swipe items={items} header topic={topic} />
    </Screen>
  );
}

/** The daily check-in, then the verses it brings. */
export function HeartPreview() {
  return (
    <Screen tab="feed">
      <Swipe items={HEART} header />
    </Screen>
  );
}

/** The opening of Ar-Rahman in the reader. */
export function QuranPreview() {
  return (
    <Screen tab="quran">
      <View style={{ height: CARD_HEIGHT }}>
        <SurahView n={55} preview />
      </View>
    </Screen>
  );
}

/** One verse, turning through the manuscript styles. */
export function StylesPreview() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setI((x) => (x + 1) % STYLES.length), EVERY_MS - 600);
    return () => clearInterval(timer);
  }, []);
  return (
    <Screen tab="feed">
      <CardStyleOverride.Provider value={STYLES[i]}>
        <Animated.View key={STYLES[i]} entering={FadeIn.duration(500)}>
          <FeedCard item={card('ayah', passage('94:5-6').id)} height={CARD_HEIGHT} active={false} />
        </Animated.View>
      </CardStyleOverride.Provider>
      <FeedHeader topic={null} onTopic={() => {}} />
    </Screen>
  );
}

/** The app's page with its tab bar, the given tab lit. */
function Screen({ tab, children }: { tab: Tab; children: ReactNode }) {
  const styles = useStyles();
  return (
    <TabBarSpace.Provider value={tabBarSpace(INSETS.bottom)}>
      <View style={styles.app}>
        <View style={styles.content}>{children}</View>
        <BottomBar active={tab === 'quran' ? 1 : 0}>
          <TabButton icon="feed" label="Feed" isFocused={tab === 'feed'} />
          <TabButton icon="book" label="Quran" isFocused={tab === 'quran'} />
          <TabButton icon="bookmark" label="Saved" isFocused={false} />
          <TabButton icon="user" label="You" isFocused={false} />
        </BottomBar>
      </View>
    </TabBarSpace.Provider>
  );
}

/** Real feed cards, moving up one at a time as if swiped, and starting over at the end. */
function Swipe({ items, header, topic = null }: { items: FeedItem[]; header?: boolean; topic?: Topic | null }) {
  const [index, setIndex] = useState(0);
  const y = useSharedValue(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), EVERY_MS);
    return () => clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    // Back to the start without the long scroll back up; every other move is a swipe.
    if (index === 0) y.set(0);
    else y.set(withTiming(-index * CARD_HEIGHT, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [index, y]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));

  return (
    <View style={{ height: CARD_HEIGHT, overflow: 'hidden' }}>
      <Animated.View style={style}>
        {items.map((item) => (
          <FeedCard key={item.key} item={item} height={CARD_HEIGHT} active={false} />
        ))}
      </Animated.View>
      {header && <FeedHeader topic={topic} onTopic={() => {}} />}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  body: {
    backgroundColor: '#15140F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  screen: { overflow: 'hidden', backgroundColor: colors.page },
  app: { width: SCREEN.width, height: SCREEN.height, backgroundColor: colors.page },
  content: { flex: 1 },
  time: { position: 'absolute', top: 17, left: 52, fontFamily: fonts.uiSemi, fontSize: 17, color: colors.text },
  island: { position: 'absolute', top: 11, left: SCREEN.width / 2 - 62, width: 124, height: 36, borderRadius: 18, backgroundColor: '#000' },
}));
