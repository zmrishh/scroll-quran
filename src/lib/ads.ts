import { Platform } from 'react-native';
import { create } from 'zustand';

import { useApp } from '@/store/app-store';

import { adSdk } from './ads-sdk';

// The banner ad units for the ad cards in the feed, from AdMob (Apps → Ad units). Left empty, and always in
// development, Google's test unit is used: its ads are marked "Test Ad" and are safe to tap.
const UNIT = Platform.select({
  ios: process.env.EXPO_PUBLIC_ADMOB_IOS_FEED_UNIT,
  android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_FEED_UNIT,
});

export const feedAdUnit = () => (__DEV__ || !UNIT ? (adSdk?.TestIds.BANNER ?? '') : UNIT);

/** What every ad request asks for: ads that aren't chosen from what the reader does. */
export const AD_REQUEST = { requestNonPersonalizedAdsOnly: true };

type AdsState = {
  /** Ads can be asked for: the SDK has started and, where the law asks for it, the reader has answered. */
  ready: boolean;
  /** The reader is somewhere they must be able to change their answer about ads, so You shows "Ad choices". */
  choices: boolean;
};

export const useAds = create<AdsState>(() => ({ ready: false, choices: false }));

// Where consent for ads is the law: the EEA, the UK and Switzerland, told from the phone's time zone. Only used when
// Google itself can't be asked.
const CONSENT_ZONE = /^(Europe\/|Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe)|Asia\/(Nicosia|Famagusta)|Africa\/Ceuta|Arctic\/)/;

function inConsentRegion() {
  try {
    return CONSENT_ZONE.test(Intl.DateTimeFormat().resolvedOptions().timeZone ?? '');
  } catch {
    return true;
  }
}

let starting = false;

/**
 * Starts the ad SDK for a reader without Plus: when the feed first opens, or when Plus ends. Readers with Plus never
 * start it, and nothing here runs before onboarding is over.
 */
export async function startAds() {
  const sdk = adSdk;
  if (!sdk || starting || useAds.getState().ready || useApp.getState().premium) return;
  starting = true;
  try {
    // Where consent is the law, Google's own form asks for it (set up in AdMob → Privacy & messaging).
    const asked = await sdk.AdsConsent.gatherConsent().catch(() => null);
    const info = asked ?? (await sdk.AdsConsent.getConsentInfo().catch(() => null));
    useAds.setState({ choices: info?.privacyOptionsRequirementStatus === sdk.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED });
    // If Google couldn't be asked at all, last time's answer stands; with none, there are no ads where consent is
    // the law, and non-personalised ads everywhere else.
    if (!(info?.canRequestAds || (!asked && !inConsentRegion()))) return;
    const ads = sdk.default();
    // General audiences only: nothing that doesn't belong in a Quran app.
    await ads.setRequestConfiguration({ maxAdContentRating: sdk.MaxAdContentRating.G });
    await ads.initialize();
    useAds.setState({ ready: true });
  } catch {
    // No ads this time; the ad cards show the Plus card instead.
  } finally {
    starting = false;
  }
}

/** Google's form for changing the answer about ads, where one is required. */
export async function showAdChoices() {
  await adSdk?.AdsConsent.showPrivacyOptionsForm().catch(() => null);
  startAds();
}

useApp.subscribe((s, prev) => {
  if (prev.premium && !s.premium) startAds();
});
