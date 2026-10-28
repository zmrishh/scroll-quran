import { CalculationMethod, Coordinates, HighLatitudeRule, Madhab, PrayerTimes } from 'adhan';
import * as Location from 'expo-location';

import { useApp } from '@/store/app-store';

/** The calculation methods people actually choose between, by the authority that sets them. */
export const METHODS = [
  { id: 'MuslimWorldLeague', name: 'Muslim World League' },
  { id: 'NorthAmerica', name: 'ISNA, North America' },
  { id: 'MoonsightingCommittee', name: 'Moonsighting Committee' },
  { id: 'UmmAlQura', name: 'Umm al-Qura, Makkah' },
  { id: 'Egyptian', name: 'Egyptian General Authority' },
  { id: 'Karachi', name: 'University of Islamic Sciences, Karachi' },
  { id: 'Dubai', name: 'Dubai' },
  { id: 'Qatar', name: 'Qatar' },
  { id: 'Kuwait', name: 'Kuwait' },
  { id: 'Singapore', name: 'Singapore, Malaysia and Indonesia' },
  { id: 'Turkey', name: 'Diyanet, Turkey' },
  { id: 'Tehran', name: 'Institute of Geophysics, Tehran' },
] as const;

export type MethodId = (typeof METHODS)[number]['id'];
export type AsrSchool = 'standard' | 'hanafi';

/** Time zones whose usual method isn't the Muslim World League's. Matched by prefix, most specific first. */
const BY_ZONE: [string, MethodId][] = [
  ['America/', 'NorthAmerica'],
  ['Asia/Riyadh', 'UmmAlQura'],
  ['Asia/Aden', 'UmmAlQura'],
  ['Asia/Dubai', 'Dubai'],
  ['Asia/Muscat', 'Dubai'],
  ['Asia/Qatar', 'Qatar'],
  ['Asia/Bahrain', 'Qatar'],
  ['Asia/Kuwait', 'Kuwait'],
  ['Asia/Karachi', 'Karachi'],
  ['Asia/Kolkata', 'Karachi'],
  ['Asia/Calcutta', 'Karachi'],
  ['Asia/Dhaka', 'Karachi'],
  ['Asia/Kabul', 'Karachi'],
  ['Asia/Singapore', 'Singapore'],
  ['Asia/Kuala_Lumpur', 'Singapore'],
  ['Asia/Jakarta', 'Singapore'],
  ['Asia/Makassar', 'Singapore'],
  ['Asia/Brunei', 'Singapore'],
  ['Europe/Istanbul', 'Turkey'],
  ['Asia/Tehran', 'Tehran'],
  ['Africa/', 'Egyptian'],
];

/** The method most mosques use where the phone's clock is set; used until someone picks one. */
export function regionalMethod(): MethodId {
  let zone = '';
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {}
  return BY_ZONE.find(([prefix]) => zone.startsWith(prefix))?.[1] ?? 'MuslimWorldLeague';
}

export const methodName = (id: MethodId) => METHODS.find((m) => m.id === id)?.name ?? id;

export type Salah = { key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; name: string; at: Date };

/** The five prayers for a day at a place. On Fridays, Dhuhr is shown as Jumu'ah. */
export function dayTimes(place: { lat: number; lng: number }, method: MethodId, asr: AsrSchool, date: Date): Salah[] {
  const coordinates = new Coordinates(place.lat, place.lng);
  const params = CalculationMethod[method]();
  params.madhab = asr === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  // Keeps Fajr and Isha sensible in summer far from the equator, where twilight never fully ends.
  params.highLatitudeRule = HighLatitudeRule.recommended(coordinates);
  const t = new PrayerTimes(coordinates, date, params);
  return [
    { key: 'fajr', name: 'Fajr', at: t.fajr },
    { key: 'dhuhr', name: date.getDay() === 5 ? 'Jumu’ah' : 'Dhuhr', at: t.dhuhr },
    { key: 'asr', name: 'Asr', at: t.asr },
    { key: 'maghrib', name: 'Maghrib', at: t.maghrib },
    { key: 'isha', name: 'Isha', at: t.isha },
  ];
}

/** Today's prayers and the next one to come: tomorrow's Fajr once Isha has passed. */
export function schedule(place: { lat: number; lng: number }, method: MethodId, asr: AsrSchool, now: Date) {
  const today = dayTimes(place, method, asr, now);
  const upcoming = today.find((p) => p.at > now);
  if (upcoming) return { today, next: upcoming };
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { today, next: dayTimes(place, method, asr, tomorrow)[0] };
}

export const clock = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/** The time without AM/PM, for the row of five, where the order of the day already makes it clear. */
export const shortClock = (d: Date) => clock(d).replace(/\s?[AP]\.?M\.?$/i, '');

/** "in 45 min", "in 2 h 5 min". */
export function until(at: Date, now: Date) {
  const mins = Math.max(1, Math.ceil((at.getTime() - now.getTime()) / 60000));
  if (mins < 60) return `in ${mins} min`;
  const h = Math.floor(mins / 60);
  return mins % 60 ? `in ${h} h ${mins % 60} min` : `in ${h} h`;
}

export type LocateResult = 'ok' | 'denied' | 'blocked' | 'failed';

const STALE_MS = 12 * 60 * 60 * 1000;

/**
 * Reads the phone's approximate position for prayer times. Asks for permission only when ask is true, i.e. when
 * someone taps to turn prayer times on; otherwise it quietly refreshes a place more than 12 hours old.
 */
export async function locate(ask: boolean): Promise<LocateResult> {
  try {
    let perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== 'granted' && ask && perm.canAskAgain) perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return perm.canAskAgain ? 'denied' : 'blocked';
    const place = useApp.getState().prayerPlace;
    if (!ask && place && Date.now() - place.at < STALE_MS) return 'ok';
    const pos =
      (await Location.getLastKnownPositionAsync({ maxAge: STALE_MS })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    // About a kilometre is plenty for prayer times, so that's all that's kept.
    const round = (n: number) => Math.round(n * 100) / 100;
    useApp.getState().set({ prayerPlace: { lat: round(pos.coords.latitude), lng: round(pos.coords.longitude), at: Date.now() } });
    return 'ok';
  } catch {
    return 'failed';
  }
}
