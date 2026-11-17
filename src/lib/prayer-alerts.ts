import { AppState, Platform } from 'react-native';
import { create } from 'zustand';

import { useApp } from '@/store/app-store';

import { clock, locate, nextPrayers, regionalMethod, SALAH_KEYS } from './prayer';

/**
 * Prayer alerts, a Plus feature: local notifications booked on the phone from the times it works out itself. Nothing
 * is sent anywhere and no server is involved.
 *
 * iOS holds at most 64 booked notifications for an app, so the next 60 alerts are booked (about twelve days with all
 * five prayers) and topped up whenever the app opens. The last one booked also asks the reader to open the app, so
 * someone away for that long isn't left without alerts and without knowing why. Android may deliver an alert a few
 * minutes late to save battery; exact timing would need the exact-alarm permission.
 */

type Notifications = typeof import('expo-notifications');
type S = ReturnType<typeof useApp.getState>;

const ID = 'prayer:';
const CHANNEL = 'prayers';
const MAX = 60;
const DAYS_AHEAD = 30;
/** The alerts are topped up when the app comes back after this long. */
const REFRESH_MS = 6 * 60 * 60 * 1000;
const BODY = 'It’s time to pray.';
const LAST_BODY = 'It’s time to pray. Open Scroll Quran to keep your prayer alerts coming.';

let mod: Notifications | null | undefined;

/**
 * expo-notifications, loaded the first time alerts are needed, so a session without them never loads it (Expo Go
 * logs warnings about it). Null on the web, where nothing can be booked.
 */
function notifications() {
  if (mod !== undefined) return mod;
  mod = null;
  if (Platform.OS === 'web') return mod;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const n = require('expo-notifications') as Notifications;
    // An alert that comes while the app is open still shows.
    n.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
    });
    mod = n;
  } catch {
    mod = null;
  }
  return mod;
}

/** Android files alerts under a channel, and from Android 13 only asks for notifications once one exists. */
async function channel(n: Notifications) {
  if (Platform.OS !== 'android') return;
  await n.setNotificationChannelAsync(CHANNEL, { name: 'Prayer alerts', importance: n.AndroidImportance.HIGH }).catch(() => null);
}

export type AlertProblem = 'notifications' | 'location' | 'unavailable';

/** Why the last try at turning alerts on didn't work, for the line under the switch. */
export const useAlertProblem = create<{ problem: AlertProblem | null }>(() => ({ problem: null }));

const fail = (problem: AlertProblem) => {
  useAlertProblem.setState({ problem });
  return false;
};

/**
 * Asks for notifications, and for location if no place is known yet, then turns alerts on. Returns whether they're on;
 * if not, useAlertProblem says why.
 */
export async function turnOnPrayerAlerts() {
  const n = notifications();
  if (!n) return fail('unavailable');
  try {
    await channel(n);
    let perm = await n.getPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) {
      perm = await n.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
    }
    if (!perm.granted) return fail('notifications');
  } catch {
    return fail('unavailable');
  }
  if (!useApp.getState().prayerPlace && (await locate(true)) !== 'ok') return fail('location');
  useAlertProblem.setState({ problem: null });
  useApp.getState().set({ prayerAlerts: true });
  return true;
}

/** Everything the booked alerts depend on. A change to any of it books them again. */
const alertKey = (s: S) =>
  [
    s.premium,
    s.prayerAlerts,
    SALAH_KEYS.filter((k) => s.alertPrayers[k]).join(','),
    s.prayerPlace?.lat,
    s.prayerPlace?.lng,
    s.prayerMethod,
    s.asrSchool,
  ].join('|');

let queue: Promise<void> = Promise.resolve();
let lastSync = 0;
/** The last booking found notifications turned off; coming back from Settings books again straight away. */
let blocked = false;

/** Books the alerts afresh, or clears them. Calls run one after another, so two never book at once. */
export function syncPrayerAlerts() {
  queue = queue.then(sync).catch(() => {});
  return queue;
}

async function sync() {
  const s = useApp.getState();
  // Alerts that are off and haven't been touched this session have nothing booked.
  if (!s.prayerAlerts && !mod) return;
  const n = notifications();
  if (!n) return;
  lastSync = Date.now();

  const booked = await n.getAllScheduledNotificationsAsync();
  await Promise.all(booked.filter((b) => b.identifier.startsWith(ID)).map((b) => n.cancelScheduledNotificationAsync(b.identifier)));

  // Alerts stay switched on through a lapse in Plus, so they come back with it.
  const place = s.prayerPlace;
  if (!s.premium || !s.prayerAlerts || !place) return;
  // Notifications turned off in Settings since: the prayer times screen says so.
  blocked = !(await n.getPermissionsAsync()).granted;
  if (blocked) {
    useAlertProblem.setState({ problem: 'notifications' });
    return;
  }
  if (useAlertProblem.getState().problem === 'notifications') useAlertProblem.setState({ problem: null });
  await channel(n);

  const keys = SALAH_KEYS.filter((k) => s.alertPrayers[k]);
  // Half a minute's margin, so nothing is booked for a time that's passing as this runs.
  const from = new Date(Date.now() + 30000);
  const prayers = nextPrayers(place, s.prayerMethod ?? regionalMethod(), s.asrSchool, keys, from, MAX, DAYS_AHEAD);
  for (const [i, p] of prayers.entries()) {
    await n.scheduleNotificationAsync({
      identifier: `${ID}${p.at.getTime()}`,
      content: { title: `${p.name} · ${clock(p.at)}`, body: i === prayers.length - 1 ? LAST_BODY : BODY, sound: true },
      trigger: { type: n.SchedulableTriggerInputTypes.DATE, date: p.at, channelId: CHANNEL },
    });
  }
}

let started = false;

/** Books alerts on launch, books them again when anything they depend on changes, and tops them up on return. */
export function startPrayerAlerts() {
  if (started) return;
  started = true;

  const refresh = () => {
    if (!useApp.getState().prayerAlerts) return;
    syncPrayerAlerts();
    // A place more than half a day old is read again, without asking; a move books the alerts again below.
    locate(false);
  };
  refresh();
  useApp.subscribe((s, prev) => {
    if (alertKey(s) !== alertKey(prev)) syncPrayerAlerts();
  });
  AppState.addEventListener('change', (state) => {
    if (state === 'active' && (blocked || Date.now() - lastSync > REFRESH_MS)) refresh();
  });
}

/** Development only: an alert in ten seconds, to check delivery. Returns how many prayer alerts are booked. */
export async function testPrayerAlert() {
  const n = notifications();
  if (!n) return 0;
  const at = new Date(Date.now() + 10000);
  await n.scheduleNotificationAsync({
    content: { title: `Asr · ${clock(at)}`, body: BODY, sound: true },
    trigger: { type: n.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10, channelId: CHANNEL },
  });
  await queue;
  return (await n.getAllScheduledNotificationsAsync()).filter((b) => b.identifier.startsWith(ID)).length;
}
