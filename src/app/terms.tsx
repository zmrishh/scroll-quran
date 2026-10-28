import { Linking, Platform } from 'react-native';

import { Block, Bullets, DocLink, DocScreen } from '@/components/doc';
import { CONTACT_EMAIL, LINKS, openLink } from '@/lib/links';
import { STORE } from '@/lib/purchases';

const ACCOUNT = Platform.OS === 'android' ? 'Google account' : 'Apple ID';

export default function Terms() {
  return (
    <DocScreen title="Terms of use" meta="Effective 28 October 2026">
      <Block title="Scroll Quran">
        Scroll Quran is for your personal use. The Quran text, translation and art come from the sources credited on the
        Sources screen.
      </Block>

      <Block title="Plus and card styles">
        <Bullets
          items={[
            `Monthly and yearly plans renew automatically until you cancel. Cancel at least 24 hours before the current period ends to avoid the next charge.`,
            `Payment is taken from your ${ACCOUNT} when you confirm a purchase.`,
            `Manage or cancel a plan in your ${STORE} subscription settings. Deleting the app does not cancel it.`,
            'Lifetime Plus and card styles are one-time purchases. Nothing renews.',
            `Refunds are handled by ${Platform.OS === 'android' ? 'Google' : 'Apple'} under their own policies.`,
          ]}
        />
      </Block>

      {Platform.OS === 'android' ? (
        <>
          <Block title="Licence">Purchases through Google Play are also covered by the Google Play Terms of Service.</Block>
          <DocLink label="Google Play Terms of Service" onPress={() => openLink(LINKS.playTerms)} />
        </>
      ) : (
        <>
          <Block title="Licence">
            Your use of the app is also covered by Apple’s standard licence agreement for apps from the App Store.
          </Block>
          <DocLink label="Apple’s licence agreement" onPress={() => openLink(LINKS.appleLicence)} />
        </>
      )}

      <Block title="Contact">Questions about these terms:</Block>
      <DocLink label={CONTACT_EMAIL} onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`).catch(() => {})} />
    </DocScreen>
  );
}
