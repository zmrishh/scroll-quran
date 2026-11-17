import { Linking, Platform } from 'react-native';

import { Block, Bullets, DocLink, DocScreen, Para } from '@/components/doc';
import { CONTACT_EMAIL, LINKS, openLink } from '@/lib/links';
import { STORE } from '@/lib/purchases';

// Names only the platform the app is running on (App Store guideline 2.3.10).
const COMPANY = Platform.OS === 'android' ? 'Google' : 'Apple';
const BACKUP = Platform.OS === 'android' ? 'Google' : 'iCloud';

// Keep in step with site/privacy.html, the copy the store listings link to.
export default function Privacy() {
  return (
    <DocScreen title="Privacy" meta="Effective 17 November 2026">
      <Block title="In short">
        Scroll Quran runs no analytics of its own and does not track you. The free version shows ads from Google; Scroll
        Quran Plus has none. Signing in is optional, and what you do in the app stays on your phone.
      </Block>

      <Block title="Signing in">
        <Para>
          If you choose to sign in with Apple or Google, they give the app an account ID and, if you allow it, your name and
          email address. Apple lets you hide your email address.
        </Para>
        <Para>
          Your name and email address stay on your phone, where the app shows them in the You tab. The account ID is sent to
          RevenueCat (see below) so Plus follows your account to a new phone. We don’t run servers that store accounts.
        </Para>
      </Block>

      <Block title="What stays on your phone">
        <Para>
          Your saved and liked cards, the reflections you write, your mood check-ins, your reading place in the Quran, your
          streak and your settings are stored only on your device. They are never sent to us, and we cannot see them.
          Deleting the app deletes them.
        </Para>
        <Para>
          Your phone may include this information in its own {BACKUP} backups. Those backups are covered by {COMPANY}’s
          privacy policy, not ours.
        </Para>
      </Block>

      <Block title="Location">
        If you turn on prayer times, the app reads your phone’s approximate location and works out the times on your phone.
        Your location is not sent anywhere. You can turn location access off at any time in your phone’s settings.
      </Block>

      <Block title="Notifications">
        Prayer alerts are scheduled on your phone from the times it works out there. No server is involved and nothing is
        sent to deliver them.
      </Block>

      <Block title="Ads">
        <Para>
          Without Plus, the feed has ads on cards of their own, never on a card of Quran. They come from Google AdMob. The
          app asks only for ads that are not chosen from what you do (non-personalised) and that suit all ages, and it
          never asks to track you across other apps.
        </Para>
        <Para>To show ads, count them and measure them, Google receives:</Para>
        <Bullets
          items={[
            'your IP address, which tells it roughly where you are;',
            'your device type, operating system and app version, and an identifier for your device or for this app on it. Your phone’s advertising ID is included only if the phone gives it out; an iPhone doesn’t, because the app never asks to track you;',
            'which ads were shown and tapped, and crash and performance information from the ad software.',
          ]}
        />
        <Para>
          Where the law asks for your consent, in Europe and the UK, Google’s form asks you first, and You → Ad choices lets
          you change your answer. With Plus the app does not ask Google for ads.
        </Para>
      </Block>
      <DocLink label="How Google uses this information" onPress={() => openLink(LINKS.googleAdsPrivacy)} />

      <Block title="Purchases">
        <Para>
          Scroll Quran Plus and card styles are sold through the {STORE}. {COMPANY} takes the payment;
          we never see your card details.
        </Para>
        <Para>
          To know what you’ve bought, and to restore it on a new phone, the app uses RevenueCat, a subscription service. Each
          time the app opens, RevenueCat receives:
        </Para>
        <Bullets
          items={[
            'a random ID the app creates, or your account ID from Apple or Google if you’ve signed in; neither includes your name or email address;',
            'your Scroll Quran purchases and subscription status, if you have any;',
            'technical details: device type, operating system and app version, the country of your store account, and your IP address.',
          ]}
        />
        <Para>This is used only to unlock what you bought and keep it working. It is not used for advertising, and it is not sold.</Para>
      </Block>
      <DocLink label="RevenueCat’s privacy policy" onPress={() => openLink(LINKS.revenueCatPrivacy)} />

      <Block title="Sharing cards">
        When you share a card, the image is made on your phone and handed straight to the app you pick. We don’t receive it.
      </Block>

      <Block title="Links">
        Links in the app, such as to the Tanzil Project, open in a browser view. Those websites have their own privacy
        policies.
      </Block>

      <Block title="Children">
        Scroll Quran is not directed at children under 13. Apart from the sign-in details and the ad information above, it
        collects no personal information from anyone.
      </Block>

      <Block title="Your choices">
        <Bullets
          items={[
            'To delete your account, open the You tab and tap Delete account. It erases everything the app stored on your phone and unlinks your purchases from your account.',
            'To stop Scroll Quran using your Apple ID: Settings → your name → Sign-In & Security → Sign in with Apple. For Google: your Google Account → Security → Your connections to third-party apps & services.',
            'To stop seeing ads, subscribe to Plus. On Android you can also delete your advertising ID: Settings → Google → Ads.',
            `To cancel Plus, use your ${STORE} subscription settings. Deleting the app does not cancel it.`,
            `To have your purchase record at RevenueCat deleted, email us with your ${STORE} order ID and we will delete the matching record.`,
          ]}
        />
      </Block>

      <Block title="Changes">If this policy changes, we will update it here and change the date at the top.</Block>

      <Block title="Contact">Questions about privacy:</Block>
      <DocLink label={CONTACT_EMAIL} onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`).catch(() => {})} />
    </DocScreen>
  );
}
