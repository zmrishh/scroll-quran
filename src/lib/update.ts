import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';

import { useApp } from '@/store/app-store';

// Scroll Quran on the App Store ("Scroll Quran: Daily Ayah & Dua"). The number is the app's Apple ID: App Store
// Connect → App Information, and the end of its App Store link.
const APP_STORE_ID = '6828883847';
const LOOKUP = `https://itunes.apple.com/lookup?id=${APP_STORE_ID}`;
const STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;
// A new version isn't offered on its first day: the App Store takes a while to have it everywhere.
const SETTLE_MS = 24 * 60 * 60 * 1000;

/** The version of the app that is running, from app.json as it was when the app was built. */
export const installedVersion = Constants.expoConfig?.version ?? '0';

/** Whether version `a` is newer than `b`, part by part: 1.10 is newer than 1.9. */
export function isNewer(a: string, b: string) {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d > 0;
  }
  return false;
}

/**
 * Asks the App Store which version is the latest, once each time the app opens, and remembers the answer. The feed
 * offers the update the next time it starts. iPhone only: Google Play has no such question to ask.
 */
export async function checkForUpdate() {
  if (Platform.OS !== 'ios') return;
  try {
    const app = (await (await fetch(LOOKUP)).json())?.results?.[0];
    if (typeof app?.version !== 'string') return;
    const since = Date.parse(app.currentVersionReleaseDate ?? '');
    if (Number.isNaN(since) || Date.now() - since > SETTLE_MS) useApp.getState().set({ storeVersion: app.version });
  } catch {
    // Offline, or the App Store didn't answer: ask again next time.
  }
}

type Versions = Pick<ReturnType<typeof useApp.getState>, 'storeVersion' | 'updateSkipped'>;

/** The version on the App Store, if it is newer than the one running. */
export const newerVersion = (s: Versions) => (s.storeVersion && isNewer(s.storeVersion, installedVersion) ? s.storeVersion : null);

/** The version to offer in the feed: a newer one that the reader hasn't put off with "Later". */
export const updateToOffer = (s: Versions) => {
  const v = newerVersion(s);
  return v && v !== s.updateSkipped ? v : null;
};

export const openAppStore = () => Linking.openURL(STORE_URL).catch(() => {});
