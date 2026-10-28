import { Alert, Linking, Platform } from 'react-native';
import Purchases, { PURCHASES_ERROR_CODE, type CustomerInfo, type PurchasesError, type PurchasesPackage } from 'react-native-purchases';
import { create } from 'zustand';

import { useApp, type Account } from '@/store/app-store';

export type Plan = 'yearly' | 'monthly';
/** badge: the yearly plan's saving against paying monthly, worked out from the store prices. */
export type PlanInfo = { title: string; price: string; note: string; badge: string | null };

/**
 * RevenueCat setup this code expects: an entitlement with this identifier, and products for it in the
 * current offering's Annual and Monthly packages. There is no free trial.
 */
const ENTITLEMENT = 'plus';

/** RevenueCat's public SDK keys, from .env. Without one (Expo Go, web, local dev) purchases run in demo mode. */
const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

export const isDemo = !API_KEY;

export const STORE = Platform.OS === 'android' ? 'Google Play' : 'App Store';
const STORE_ACCOUNT = Platform.OS === 'android' ? 'Google account' : 'Apple ID';

const DEMO_PLANS: Record<Plan, PlanInfo> = {
  yearly: { title: 'Yearly', price: '$29.99 a year', note: '$2.50 a month, billed yearly', badge: 'Save 50%' },
  monthly: { title: 'Monthly', price: '$4.99 a month', note: 'Cancel any time', badge: null },
};

// With RevenueCat, prices stay blank until the store returns them in the user's own currency.
const LOADING_PLANS: Record<Plan, PlanInfo> = {
  yearly: { title: 'Yearly', price: '', note: '', badge: null },
  monthly: { title: 'Monthly', price: '', note: '', badge: null },
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

/** The RevenueCat customer for an account. Only this opaque ID leaves the phone, never the name or email. */
export const customerId = (a: Account) => `${a.provider}_${a.id}`;

let configured = false;

/** Connects to RevenueCat once the saved state has loaded. Offline, the last known Plus status stays. */
export async function setupPurchases() {
  if (isDemo || configured) return;
  configured = true;
  const account = useApp.getState().account;
  Purchases.configure({ apiKey: API_KEY!, appUserID: account ? customerId(account) : null });
  Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
  try {
    applyCustomerInfo(await Purchases.getCustomerInfo());
  } catch {}
  await loadPlans();
}

/** Ties the subscription to the account that just signed in, so it follows them to a new phone. */
export async function linkAccount(account: Account) {
  if (!configured) return;
  try {
    applyCustomerInfo((await Purchases.logIn(customerId(account))).customerInfo);
  } catch {}
}

export async function unlinkAccount() {
  if (!configured) return;
  try {
    if (!(await Purchases.isAnonymous())) applyCustomerInfo(await Purchases.logOut());
  } catch {}
}

/** Fetches prices from the store. Safe to call again, e.g. when the paywall opens after a failed load. */
export async function loadPlans() {
  if (!configured || (packages.yearly && packages.monthly)) return;
  try {
    const offering = (await Purchases.getOfferings()).current;
    if (!offering?.annual || !offering.monthly) return;
    packages = { yearly: offering.annual, monthly: offering.monthly };
    const year = offering.annual.product;
    const month = offering.monthly.product;
    const saving = Math.round((1 - year.price / (month.price * 12)) * 100);
    usePlans.setState({
      yearly: {
        title: 'Yearly',
        price: `${year.priceString} a year`,
        note: year.pricePerMonthString ? `${year.pricePerMonthString} a month, billed yearly` : 'Billed yearly',
        badge: saving >= 5 ? `Save ${saving}%` : null,
      },
      monthly: { title: 'Monthly', price: `${month.priceString} a month`, note: 'Cancel any time', badge: null },
    });
  } catch {}
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
    if (!active) Alert.alert('Nothing to restore', `No Scroll Quran Plus subscription was found for this ${STORE_ACCOUNT}.`);
    return active;
  } catch (e) {
    Alert.alert('Couldn’t restore', (e as PurchasesError).message || 'Check your connection and try again.');
    return false;
  }
}
