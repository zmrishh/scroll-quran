import { router } from 'expo-router';

import type { Topic } from '@/data/content';
import { FREE_SAVES, useApp } from '@/store/app-store';

import { haptic } from './feedback';

export type PaywallReason = 'welcome' | 'limit' | 'saves' | 'topic' | 'styles';

/** What the paywall interrupted, finished once Plus turns on: the card being saved, or the topic being opened. */
type Pending = { save: { key: string; topics: readonly Topic[] } } | { topic: Topic };
let pending: Pending | null = null;

export function openPaywall(reason: PaywallReason, topic?: Topic) {
  pending = reason === 'topic' && topic ? { topic } : null;
  router.push({ pathname: '/paywall', params: topic ? { reason, topic } : { reason } });
}

/** Forgets the interrupted action, when the paywall closes without a purchase. */
export function clearPending() {
  pending = null;
}

/** The topic a free user tapped before upgrading, taken once. The feed opens it as soon as Plus is on. */
export function takePendingTopic() {
  const topic = pending && 'topic' in pending ? pending.topic : null;
  if (topic) pending = null;
  return topic;
}

/** Saves or unsaves a card; a free user's fourth save opens the paywall instead, and saves it after upgrading. */
export function saveOrUpsell(key: string, topics: readonly Topic[]) {
  const s = useApp.getState();
  if (!s.premium && !s.saved[key] && Object.keys(s.saved).length >= FREE_SAVES) {
    haptic.error();
    openPaywall('saves');
    pending = { save: { key, topics } };
    return;
  }
  if (s.toggleSave(key, topics)) haptic.success();
  else haptic.tap();
}

useApp.subscribe((s, prev) => {
  if (!s.premium || prev.premium || !pending || !('save' in pending)) return;
  const { key, topics } = pending.save;
  pending = null;
  if (!s.saved[key]) s.toggleSave(key, topics);
});
