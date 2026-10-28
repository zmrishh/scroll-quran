import { Alert, Linking, Platform } from 'react-native';
import Purchases, {
  PRODUCT_CATEGORY,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
  type PurchasesStoreProduct,
} from 'react-native-purchases';
import { create } from 'zustand';

import { ALL_STYLES_PRODUCT, STYLE_PRODUCTS } from '@/data/styles';
import { useApp, type Account } from '@/store/app-store';

export type Plan = 'yearly' | 'monthly' | 'lifetime';
/** badge: the yearly plan's saving against paying monthly, worked out from the store prices. */
export type PlanInfo = { title: string; price: string; note: string; badge: string | null };

/**
 * RevenueCat setup this code expects: an entitlement with this identifier, with the yearly, monthly and
 * lifetime products attached, all in the current offering's Annual, Monthly and Lifetime packages.
 * There is no free trial. Card styles are separate one-time products (see STYLE_PRODUCTS).
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

const DEMO_PLANS: Record<Plan, PlanInfo | null> = {
  yearly: { title: 'Yearly', price: '$29.99 a year', note: '$2.50 a month, billed yearly', badge: 'Save 50%' },
  monthly: { title: 'Monthly', price: '$4.99 a month', note: 'Cancel any time', badge: null },
  lifetime: { title: 'Lifetime', price: '$49.99 once', note: 'Pay once, keep Plus for good', badge: null },
};

// With RevenueCat, prices stay blank until the store returns them in the user's own currency.
const LOADING_PLANS: Record<Plan, PlanInfo | null> = {
  yearly: { title: 'Yearly', price: '', note: '', badge: null },
  monthly: { title: 'Monthly', price: '', note: '', badge: null },
  lifetime: null,
};

/** The plans as the paywall shows them; null when the store has no such plan. */
export const usePlans = create<Record<Plan, PlanInfo | null>>(() => (isDemo ? DEMO_PLANS : LOADING_PLANS));

/** Card style prices by product ID, in the user's currency once the store answers. */
export const useStylePrices = create<Record<string, string>>(() =>
  isDemo ? Object.fromEntries(STYLE_PRODUCTS.map((p) => [p, p === ALL_STYLES_PRODUCT ? '$7.99' : '$2.99'])) : {},
);

let packages: Partial<Record<Plan, PurchasesPackage>> = {};
let styleProducts: Record<string, PurchasesStoreProduct> = {};

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

/** RevenueCat is the source of truth: an expired or refunded purchase turns Plus or a style off. */
function applyCustomerInfo(info: CustomerInfo) {
  const ownedStyles = info.nonSubscriptionTransactions.map((t) => t.productIdentifier).filter((id) => STYLE_PRODUCTS.includes(id));
  useApp.getState().set({ premium: isActive(info), ownedStyles });
}

/** The RevenueCat customer for an account. Only this opaque ID leaves the phone, never the name or email. */
export const customerId = (a: Account) => `${a.provider}_${a.id}`;

let configured = false;

/** Connects to RevenueCat once the saved state has loaded. Offline, the last known status stays. */
export async function setupPurchases() {
  if (isDemo || configured) return;
  configured = true;
  const account = useApp.getState().account;
  Purchases.configure({ apiKey: API_KEY!, appUserID: account ? customerId(account) : null });
  Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
  try {
    applyCustomerInfo(await Purchases.getCustomerInfo());
  } catch {}
  await Promise.all([loadPlans(), loadStylePrices()]);
}

/** Ties purchases to the account that just signed in, so they follow it to a new phone. */
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
    packages = { yearly: offering.annual, monthly: offering.monthly, lifetime: offering.lifetime ?? undefined };
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
      lifetime: offering.lifetime
        ? { title: 'Lifetime', price: `${offering.lifetime.product.priceString} once`, note: 'Pay once, keep Plus for good', badge: null }
        : null,
    });
  } catch {}
}

export async function loadStylePrices() {
  if (!configured || Object.keys(styleProducts).length) return;
  try {
    const products = await Purchases.getProducts(STYLE_PRODUCTS, PRODUCT_CATEGORY.NON_SUBSCRIPTION);
    styleProducts = Object.fromEntries(products.map((p) => [p.identifier, p]));
    useStylePrices.setState(Object.fromEntries(products.map((p) => [p.identifier, p.priceString])));
  } catch {}
}

/** Shows why a purchase failed, unless the person just cancelled it. */
function purchaseFailed(e: unknown) {
  const error = e as PurchasesError;
  if (error.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
    Alert.alert('The purchase didn’t go through', error.message || 'Please try again.');
  }
}

/** Demo mode exists to try the paywall during development. A release build never unlocks without paying. */
function demoAllowed() {
  if (__DEV__) return true;
  Alert.alert('Purchases aren’t set up', 'This build has no RevenueCat key.');
  return false;
}

/** Buys a plan. Returns true once Plus is active; cancelling or failing returns false. */
export async function purchase(plan: Plan): Promise<boolean> {
  if (isDemo) {
    if (!demoAllowed()) return false;
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
    purchaseFailed(e);
    return false;
  }
}

/** Buys a card style, or all of them with ALL_STYLES_PRODUCT. Returns true once it's owned. */
export async function buyStyle(product: string): Promise<boolean> {
  if (isDemo) {
    if (!demoAllowed()) return false;
    useApp.getState().set({ ownedStyles: [...useApp.getState().ownedStyles, product] });
    return true;
  }
  await loadStylePrices();
  const item = styleProducts[product];
  if (!item) {
    Alert.alert(`Couldn’t reach the ${STORE}`, 'Check your connection and try again.');
    return false;
  }
  try {
    const { customerInfo } = await Purchases.purchaseStoreProduct(item);
    applyCustomerInfo(customerInfo);
    return useApp.getState().ownedStyles.includes(product);
  } catch (e) {
    purchaseFailed(e);
    return false;
  }
}

/** Restores Plus and card styles bought earlier on the same Apple ID or Google account. Says if nothing was found. */
export async function restorePurchases(): Promise<boolean> {
  try {
    if (!isDemo) applyCustomerInfo(await Purchases.restorePurchases());
    const s = useApp.getState();
    const found = s.premium || s.ownedStyles.length > 0;
    if (!found) Alert.alert('Nothing to restore', `No Scroll Quran purchases were found for this ${STORE_ACCOUNT}.`);
    return s.premium;
  } catch (e) {
    Alert.alert('Couldn’t restore', (e as PurchasesError).message || 'Check your connection and try again.');
    return false;
  }
}
