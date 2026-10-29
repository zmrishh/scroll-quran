import { useEffect, useRef, useState } from 'react';
import { AppState, FlatList, Platform, View, type ListViewToken } from 'react-native';

import { FeedCard } from '@/components/feed-card';
import { FeedHeader } from '@/components/feed-header';
import type { Topic } from '@/data/content';
import type { FeedItem } from '@/feed/engine';
import { createSession } from '@/feed/session';
import { takePendingTopic } from '@/lib/upsell';
import { useApp } from '@/store/app-store';
import { makeStyles } from '@/theme/theme';

const BATCH = 10;

export default function FeedScreen() {
  const styles = useStyles();
  // Cards fill the space above the tab bar, measured rather than assumed.
  const [height, setHeight] = useState(0);
  const hintSeen = useApp((s) => s.hintSeen);
  const [session, setSession] = useState(() => createSession(null));
  const [items, setItems] = useState(() => session.start(BATCH));
  const [active, setActive] = useState(0);

  const listRef = useRef<FlatList<FeedItem>>(null);
  const seen = useRef(new Set<string>());
  const activeSince = useRef(0);
  const onActiveChange = useRef<(index: number) => void>(() => {});
  const restart = useRef<() => void>(() => {});
  const changeTopicRef = useRef<(t: Topic | null) => void>(() => {});

  useEffect(() => {
    activeSince.current = Date.now();
    useApp.getState().touchDay();
  }, []);

  // Coming back to the app on a new day starts a fresh feed, so yesterday's limit and
  // check-in don't linger while the app was sitting in the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const before = useApp.getState().day;
      useApp.getState().touchDay();
      if (useApp.getState().day !== before) restart.current();
    });
    return () => sub.remove();
  }, []);

  // Upgrading opens the topic that was tapped, or removes the limit card and keeps the feed flowing. Losing Plus
  // (a lapsed subscription, a refund) starts "For you" again under the free allowance.
  useEffect(
    () =>
      useApp.subscribe((s, prev) => {
        // Development only: "Reset today's free cards" in the You tab.
        if (!s.premium && s.day === prev.day && s.viewedToday === 0 && prev.viewedToday > 0) changeTopicRef.current(null);
        if (s.premium === prev.premium) return;
        const topic = s.premium ? takePendingTopic() : null;
        if (!s.premium || topic) changeTopicRef.current(topic);
        else if (session.unlock()) setItems((list) => [...list.filter((i) => i.kind !== 'limit'), ...session.take(BATCH)]);
      }),
    [session],
  );

  useEffect(() => {
    onActiveChange.current = (index) => {
      const prev = items[active];
      const next = items[index];
      if (!next) return;
      const app = useApp.getState();
      if (next.kind !== 'limit' && next.kind !== 'checkin' && !seen.current.has(next.key)) {
        seen.current.add(next.key);
        app.recordView();
      }
      if (index === active) return;
      const dwell = Date.now() - activeSince.current;
      if (prev && prev.kind !== 'limit' && prev.kind !== 'checkin') {
        if (dwell > 4000) app.nudge(prev.topics, 1);
        else if (dwell < 1200) app.nudge(prev.topics, -0.5);
      }
      if (index > 0 && !app.hintSeen) app.set({ hintSeen: true });
      activeSince.current = Date.now();
      setActive(index);
    };
  });

  const [onViewable] = useState(() => ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable && v.index != null);
    if (first?.index != null) onActiveChange.current(first.index);
  });
  const [viewability] = useState({ itemVisiblePercentThreshold: 60 });

  // After the check-in, the cards still to come are swapped for ones that meet the reader's mood.
  const onMood = () => {
    const at = active;
    setItems((list) => [...list.slice(0, at + 1), ...session.replace(list.slice(at + 1), BATCH)]);
    setTimeout(() => listRef.current?.scrollToIndex({ index: at + 1, animated: true }), 900);
  };

  const changeTopic = (t: Topic | null) => {
    const next = createSession(t);
    setSession(next);
    setItems(next.start(BATCH));
    setActive(0);
    activeSince.current = Date.now();
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  useEffect(() => {
    restart.current = () => changeTopic(session.topic);
    changeTopicRef.current = changeTopic;
  });

  return (
    <View style={styles.screen} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      {height > 0 && (
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(i) => i.key}
          renderItem={({ item, index }) => (
            <FeedCard
              item={item}
              height={height}
              active={index === active}
              showHint={index === 0 && !hintSeen && item.kind !== 'checkin'}
              onMood={onMood}
            />
          )}
          {...(Platform.OS === 'web'
            ? { pagingEnabled: true }
            : { snapToInterval: height, snapToAlignment: 'start' as const, disableIntervalMomentum: true })}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={viewability}
          onEndReached={() => {
            if (!session.limited) setItems((list) => [...list, ...session.take(BATCH)]);
          }}
          onEndReachedThreshold={3}
          windowSize={5}
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
      <FeedHeader topic={session.topic} onTopic={changeTopic} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.page },
}));
