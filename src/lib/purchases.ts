import { Alert, Linking, Platform } from 'react-native';
import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
  type PurchasesStoreProduct,
} from 'react-native-purchases';
import { create } from 'zustand';

import { useApp } from '@/store/app-store';

export type Plan = 'yearly' | 'monthly';
export type PlanInfo = { title: string; price: string; note: string; trialDays: number };

/**
 * RevenueCat setup this code expects: an entitlement with this identifier, and products for it in the
 * current offering's Annual and Monthly packages.
 */
const ENTITLEMENT = 'plus';

/** RevenueCat's public SDK keys, from .env. Without one (Expo Go, web, local dev) purchases run in demo mode. */
const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

export const isDemo = !API_KEY;

export const STORE = Platform.OS === 'android' ? 'Google Play' : 'App Store';
const ACCOUNT = Platform.OS === 'android' ? 'Google account' : 'Apple ID';

const DEMO_PLANS: Record<Plan, PlanInfo> = {
  yearly: { title: 'Yearly', price: '$29.99 a year', note: '3 days free, then $2.50 a month', trialDays: 3 },
  monthly: { title: 'Monthly', price: '$4.99 a month', note: 'Cancel any time', trialDays: 0 },
};

// With RevenueCat, prices stay blank until the store returns them in the user's own currency.
const LOADING_PLANS: Record<Plan, PlanInfo> = {
  yearly: { title: 'Yearly', price: '', note: '', trialDays: 0 },
  monthly: { title: 'Monthly', price: '', note: '', trialDays: 0 },
};

/** The plans as the paywall shows them. */
export const usePlans = create<Record<Plan, PlanInfo>>(() => (isDemo ? DEMO_PLANS : LOADING_PLANS));

let packages: Partial<Record<Plan, PurchasesPackage>> = {};

/**
 * Required on subscription paywalls (App Store guideline 3.1.2). Apple's standard licence works
 * as the terms. The privacy page is site/privacy.html, published to GitHub Pages by .github/workflows/website.yml.
 */
export const LINKS = {
  terms: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  privacy: 'https://zmrishh.github.io/scroll-quran/privacy.html',
};

export const openLink = (url: string) => Linking.openURL(url).catch(() => {});

const isActive = (info: CustomerInfo) => ENTITLEMENT in info.entitlements.active;

/** RevenueCat is the source of truth for Plus, so an expired or refunded subscription turns it off. */
function applyCustomerInfo(info: CustomerInfo) {
  useApp.getState().set({ premium: isActive(info) });
}

let configured = false;

/** Connects to RevenueCat once the saved state has loaded. Offline, the last known Plus status stays. */
export async function setupPurchases() {
  if (isDemo || configured) return;
  configured = true;
  Purchases.configure({ apiKey: API_KEY! });
  Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
  try {
    applyCustomerInfo(await Purchases.getCustomerInfo());
  } catch {}
  await loadPlans();
}

/** Fetches prices from the store. Safe to call again, e.g. when the paywall opens after a failed load. */
export async function loadPlans() {
  if (!configured || (packages.yearly && packages.monthly)) return;
  try {
    const offering = (await Purchases.getOfferings()).current;
    if (!offering?.annual || !offering.monthly) return;
    packages = { yearly: offering.annual, monthly: offering.monthly };
    const trial = await trialDays(offering.annual.product);
    usePlans.setState({
      yearly: { title: 'Yearly', price: `${offering.annual.product.priceString} a year`, note: yearlyNote(offering.annual.product, trial), trialDays: trial },
      monthly: { title: 'Monthly', price: `${offering.monthly.product.priceString} a month`, note: 'Cancel any time', trialDays: 0 },
    });
  } catch {}
}

const DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

/** Length of the free trial this person can still get, in days; 0 if there isn't one or it was used. */
async function trialDays(product: PurchasesStoreProduct) {
  if (Platform.OS === 'android') {
    // Google Play only offers a free phase to people who are eligible for it.
    const free = product.defaultOption?.freePhase?.billingPeriod;
    return free ? free.value * (DAYS[free.unit] ?? 0) : 0;
  }
  const intro = product.introPrice;
  if (!intro || intro.price !== 0) return 0;
  try {
    const status = (await Purchases.checkTrialOrIntroductoryPriceEligibility([product.identifier]))[product.identifier]?.status;
    if (status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE) return 0;
  } catch {}
  return intro.periodNumberOfUnits * intro.cycles * (DAYS[intro.periodUnit] ?? 0);
}

function yearlyNote(product: PurchasesStoreProduct, trial: number) {
  const monthly = product.pricePerMonthString;
  if (trial) return monthly ? `${trial} days free, then ${monthly} a month` : `${trial} days free`;
  return monthly ? `${monthly} a month, billed yearly` : 'Billed yearly';
}

/** Buys a plan. Returns true once Plus is active; cancelling or failing returns false. */
export async function purchase(plan: Plan): Promise<boolean> {
  if (isDemo) {
    // Demo mode exists to try the paywall during development. A release build never unlocks without paying.
    if (!__DEV__) {
      Alert.alert('Purchases aren’t set up', 'This build has no RevenueCat key.');
      return false;
    }
    useApp.getState().set({ premium: true });
    return true;
  }
  await loadPlans();
  const pkg = packages[plan];
  if (!pkg) {
    Alert.alert(`Couldn’t reach the ${STORE}`, 'Check your connection and try again.');
    return false;
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    applyCustomerInfo(customerInfo);
    return isActive(customerInfo);
  } catch (e) {
    const error = e as PurchasesError;
    if (error.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      Alert.alert('The purchase didn’t go through', error.message || 'Please try again.');
    }
    return false;
  }
}

/** Restores Plus bought earlier on the same Apple ID or Google account. Tells the person if nothing was found. */
export async function restorePurchases(): Promise<boolean> {
  try {
    const active = isDemo ? useApp.getState().premium : isActive(await Purchases.restorePurchases());
    if (!isDemo) useApp.getState().set({ premium: active });
    if (!active) Alert.alert('Nothing to restore', `No Scroll Quran Plus subscription was found for this ${ACCOUNT}.`);
    return active;
  } catch (e) {
    Alert.alert('Couldn’t restore', (e as PurchasesError).message || 'Check your connection and try again.');
    return false;
  }
}
