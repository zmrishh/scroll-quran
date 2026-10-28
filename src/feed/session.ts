import type { Topic } from '@/data/content';
import { moodInfo } from '@/data/moods';
import { moodToday, remainingToday, useApp } from '@/store/app-store';

import { createFeed, type FeedItem } from './engine';

const LIMIT_ITEM: FeedItem = { kind: 'limit', key: 'limit', topics: [] };
const CHECKIN_ITEM: FeedItem = { kind: 'checkin', key: 'checkin', topics: [] };
/** How strongly today's mood pulls the "For you" feed towards its topics. */
const MOOD_BOOST = 20;

const counts = (i: FeedItem) => i.kind !== 'limit' && i.kind !== 'checkin';

/** Affinity scores with today's mood folded in. */
function currentAffinity() {
  const s = useApp.getState();
  const mood = moodToday(s);
  if (!mood) return s.affinity;
  const affinity = { ...s.affinity };
  for (const t of moodInfo(mood)?.topics ?? []) affinity[t] = (affinity[t] ?? 0) + MOOD_BOOST;
  return affinity;
}

/** One scroll session: the generator plus the free daily allowance that caps it. */
export function createSession(topic: Topic | null) {
  const feed = createFeed(topic);
  let budget = remainingToday(useApp.getState());
  let limited = false;

  const take = (n: number): FeedItem[] => {
    const allow = Math.min(n, budget);
    const out = allow > 0 ? feed.batch(allow, topic ? useApp.getState().affinity : currentAffinity()) : [];
    budget -= allow;
    if (budget <= 0 && !limited) {
      limited = true;
      out.push(LIMIT_ITEM);
    }
    return out;
  };

  return {
    topic,
    get limited() {
      return limited;
    },
    /** The opening cards. "For you" starts the day with the heart check-in. */
    start(n: number): FeedItem[] {
      const checkIn = !topic && budget > 0 && !moodToday(useApp.getState());
      return checkIn ? [CHECKIN_ITEM, ...take(n)] : take(n);
    },
    /** Up to `n` more cards; ends with the limit card once the allowance runs out. */
    take,
    /** Swaps unread cards for fresh ones (after a check-in), returning their allowance first. */
    replace(unread: FeedItem[], n: number): FeedItem[] {
      budget += unread.filter(counts).length;
      if (unread.some((i) => i.kind === 'limit')) limited = false;
      return take(n);
    },
    /** Lifts the cap after an upgrade. Returns false if the cap was never hit. */
    unlock() {
      budget = Infinity;
      if (!limited) return false;
      limited = false;
      return true;
    },
  };
}
