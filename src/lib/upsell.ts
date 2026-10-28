import { router } from 'expo-router';

import type { Topic } from '@/data/content';
import { FREE_SAVES, useApp } from '@/store/app-store';

import { haptic } from './feedback';

export type PaywallReason = 'welcome' | 'limit' | 'saves' | 'topic';

export function openPaywall(reason: PaywallReason, topic?: Topic) {
  router.push({ pathname: '/paywall', params: topic ? { reason, topic } : { reason } });
}

/** Saves or unsaves a card; a free user's fourth save opens the paywall instead. */
export function saveOrUpsell(key: string, topics: readonly Topic[]) {
  const s = useApp.getState();
  if (!s.premium && !s.saved[key] && Object.keys(s.saved).length >= FREE_SAVES) {
    haptic.error();
    openPaywall('saves');
    return;
  }
  if (s.toggleSave(key, topics)) haptic.success();
  else haptic.tap();
}
