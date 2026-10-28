import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Alert, Platform } from 'react-native';

import { useApp, type Account } from '@/store/app-store';

import { linkAccount, unlinkAccount } from './purchases';

/**
 * Sign-in has no server behind it: Apple or Google confirms who the person is, and that ID ties their
 * subscription (through RevenueCat) to their account on any phone. Everything else stays on the device.
 */

/** iOS OAuth client ID from Google Cloud, in .env. Android needs no ID in the app, only its SHA-1 registered there. */
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type GoogleModule = typeof import('@react-native-google-signin/google-signin');
let google: GoogleModule | null | undefined;

/** The Google sign-in module, or null where it can't run (Expo Go, web, or iOS without a client ID). */
function googleModule() {
  if (google !== undefined) return google;
  google = null;
  if (inExpoGo || Platform.OS === 'web' || (Platform.OS === 'ios' && !GOOGLE_IOS_CLIENT_ID)) return google;
  try {
    // Loaded on demand: importing it where its native code is missing would crash the app.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    google = require('@react-native-google-signin/google-signin') as GoogleModule;
    google.GoogleSignin.configure(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {});
  } catch {
    google = null;
  }
  return google;
}

export type Providers = { apple: boolean; google: boolean; test: boolean };

export async function availableProviders(): Promise<Providers> {
  const apple = Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync().catch(() => false));
  const hasGoogle = !!googleModule();
  // Development only, so the flow can be tried in Expo Go and the browser.
  return { apple, google: hasGoogle, test: __DEV__ && !(apple && hasGoogle) };
}

async function finish(account: Account) {
  // Apple only sends the name and email the first time; keep the ones from an earlier sign-in.
  const before = useApp.getState().lastProfile;
  const known = before?.id === account.id ? before : null;
  const full = { ...account, name: account.name ?? known?.name ?? null, email: account.email ?? known?.email ?? null };
  useApp.getState().setAccount(full);
  await linkAccount(full);
  return full;
}

/** Each returns the account, or null if the person cancelled. Other failures show an alert and return null. */
export async function signInWithApple() {
  try {
    const c = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
    const name = [c.fullName?.givenName, c.fullName?.familyName].filter(Boolean).join(' ') || null;
    return await finish({ provider: 'apple', id: c.user, name, email: c.email });
  } catch (e) {
    if ((e as { code?: string }).code !== 'ERR_REQUEST_CANCELED') failed('Apple');
    return null;
  }
}

export async function signInWithGoogle() {
  const g = googleModule();
  if (!g) return null;
  try {
    await g.GoogleSignin.hasPlayServices();
    const res = await g.GoogleSignin.signIn();
    if (!g.isSuccessResponse(res)) return null;
    const u = res.data.user;
    return await finish({ provider: 'google', id: u.id, name: u.name, email: u.email });
  } catch (e) {
    if (!(g.isErrorWithCode(e) && e.code === g.statusCodes.IN_PROGRESS)) failed('Google');
    return null;
  }
}

export function signInForTesting() {
  return finish({ provider: 'test', id: 'test-user', name: 'Test user', email: null });
}

const failed = (provider: string) => Alert.alert(`Couldn’t sign in with ${provider}`, 'Please try again.');

export async function signOut() {
  if (useApp.getState().account?.provider === 'google') await googleModule()?.GoogleSignin.signOut().catch(() => null);
  await unlinkAccount();
  useApp.getState().setAccount(null);
}

/**
 * Deletes the account: disconnects Google, unlinks the subscription and erases everything on this phone.
 * A subscription keeps running until it's cancelled in the store, which the confirmation says.
 */
export async function deleteAccount() {
  if (useApp.getState().account?.provider === 'google') await googleModule()?.GoogleSignin.revokeAccess().catch(() => null);
  await unlinkAccount();
  useApp.getState().resetAll();
}
