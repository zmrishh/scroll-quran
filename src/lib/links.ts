import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import { currentColors } from '@/theme/theme';

/**
 * Pages that live outside the app. The privacy policy and terms have their own screens (src/app/privacy.tsx,
 * src/app/terms.tsx); the web copy of the policy is for the store listings.
 */
export const LINKS = {
  appleLicence: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  playTerms: 'https://play.google.com/about/play-terms/',
  tanzil: 'https://tanzil.net',
  metOpenAccess: 'https://www.metmuseum.org/hubs/open-access',
  revenueCatPrivacy: 'https://www.revenuecat.com/privacy',
  privacyOnWeb: 'https://zmrishh.github.io/scroll-quran/privacy.html',
};

export const CONTACT_EMAIL = 'amrish@kenesis.ai';

/** Opens a web page in a browser sheet over the app, so reading it never takes people out of Scroll Quran. */
export function openLink(url: string) {
  const colors = currentColors();
  WebBrowser.openBrowserAsync(url, {
    controlsColor: colors.gold,
    toolbarColor: colors.page,
    dismissButtonStyle: 'done',
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  }).catch(() => Linking.openURL(url).catch(() => {}));
}
