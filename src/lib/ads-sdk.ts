import { TurboModuleRegistry } from 'react-native';

type Sdk = typeof import('react-native-google-mobile-ads');

/**
 * Google's ad SDK, or null where it isn't built into the app. Expo Go only has its own native modules, and the
 * package throws as soon as it's loaded without its own, so it is loaded only where that module exists. The browser
 * gets ads-sdk.web.ts instead.
 */
export const adSdk: Sdk | null = TurboModuleRegistry.get('RNGoogleMobileAdsModule')
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('react-native-google-mobile-ads') as Sdk)
  : null;
