import type { Topic } from '@/data/content';
import { moodInfo } from '@/data/moods';
import { updateToOffer } from '@/lib/update';
import { moodToday, useApp } from '@/store/app-store';

import { createFeed, type FeedItem } from './engine';

const CHECKIN_ITEM: FeedItem = { kind: 'checkin', key: 'checkin', topics: [] };
const UPDATE_ITEM: FeedItem = { kind: 'update', key: 'update', topics: [] };
/** Whether the update card has opened a feed since the app was opened. */
let updateOffered = false;
/** How strongly today's mood pulls the "For you" feed towards its topics. */
const MOOD_BOOST = 20;
/** Without Plus, the feed has one ad card after every this many cards. */
export const AD_EVERY = 5;

/** Whether an item is a card to read: not an ad, the check-in or the update card. Only these count as read. */
export const counts = (i: FeedItem) => i.kind !== 'ad' && i.kind !== 'checkin' && i.kind !== 'update';

/** Affinity scores with today's mood folded in. */
function currentAffinity() {
  const s = useApp.getState();
  const mood = moodToday(s);
  if (!mood) return s.affinity;
  const affinity = { ...s.affinity };
  for (const t of moodInfo(mood)?.topics ?? []) affinity[t] = (affinity[t] ?? 0) + MOOD_BOOST;
  return affinity;
}

/** One scroll session: the generator, with an ad card between its cards for a reader without Plus. */
export function createSession(topic: Topic | null) {
  const feed = createFeed(topic);
  // Cards handed out since the last ad, and how many ads so far (for their keys).
  let sinceAd = 0;
  let ads = 0;

  const take = (n: number): FeedItem[] => {
    const out: FeedItem[] = [];
    for (const item of feed.batch(n, topic ? useApp.getState().affinity : currentAffinity())) {
      if (sinceAd >= AD_EVERY && !useApp.getState().premium) {
        out.push({ kind: 'ad', key: `ad:${++ads}`, topics: [] });
        sinceAd = 0;
      }
      out.push(item);
      sinceAd++;
    }
    return out;
  };

  return {
    topic,
    /**
     * The opening cards. "For you" starts the day with the heart check-in, and before anything else comes the update
     * card, when the App Store has a newer version.
     */
    start(n: number): FeedItem[] {
      const s = useApp.getState();
      const checkIn = !topic && !moodToday(s);
      // Once each time the app opens, not again on every change of topic.
      const update = !updateOffered && !!updateToOffer(s);
      if (update) updateOffered = true;
      return [...(update ? [UPDATE_ITEM] : []), ...(checkIn ? [CHECKIN_ITEM] : []), ...take(n)];
    },
    /** `n` more cards, and the ads that fall between them. */
    take,
    /** Swaps unread cards for fresh ones (after a check-in). The ads keep their place: the unread cards are uncounted. */
    replace(unread: FeedItem[], n: number): FeedItem[] {
      for (const item of [...unread].reverse()) {
        if (item.kind === 'ad') sinceAd = AD_EVERY;
        else if (counts(item)) sinceAd--;
      }
      sinceAd = Math.max(0, sinceAd);
      return take(n);
    },
  };
}
