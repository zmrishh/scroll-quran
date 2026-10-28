import { Linking } from 'react-native';

import { useApp } from '@/store/app-store';

export type Plan = 'yearly' | 'monthly';

// Display prices for the demo. With RevenueCat these come from the store, localised per country.
export const PLANS: Record<Plan, { title: string; price: string; note: string }> = {
  yearly: { title: 'Yearly', price: '$29.99 a year', note: '3 days free, then $2.50 a month' },
  monthly: { title: 'Monthly', price: '$4.99 a month', note: 'Cancel any time' },
};

/**
 * Required on subscription paywalls (App Store guideline 3.1.2). Apple's standard licence works
 * as the terms; the privacy policy must be a page you host before submitting.
 */
export const LINKS = {
  terms: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  privacy: 'https://scrollquran.com/privacy',
};

export const openLink = (url: string) => Linking.openURL(url).catch(() => {});

/**
 * Buys a plan. Demo build: switches Plus on with no payment.
 * Production: replace the body with RevenueCat's purchasePackage and set premium from its entitlement.
 */
export async function purchase(_plan: Plan): Promise<boolean> {
  useApp.getState().set({ premium: true });
  return true;
}

/**
 * Restores an earlier purchase on a new phone. Demo build: there is nothing to restore.
 * Production: replace with RevenueCat's restorePurchases and set premium from its entitlement.
 */
export async function restorePurchases(): Promise<boolean> {
  return useApp.getState().premium;
}
