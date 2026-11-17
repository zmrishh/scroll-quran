import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AD_REQUEST, feedAdUnit, useAds } from '@/lib/ads';
import { adSdk } from '@/lib/ads-sdk';
import { openPaywall } from '@/lib/upsell';
import { useApp } from '@/store/app-store';
import { useChrome } from '@/theme/layout';
import { makeStyles, useColors } from '@/theme/theme';
import { eyebrow, fonts, layout } from '@/theme/tokens';

import { Icon } from '../icon';
import { PrimaryButton } from '../primary-button';

// Google's "medium rectangle", the one banner size made to sit in the middle of a page.
const SLOT = { width: 300, height: 250 };

/**
 * An ad on a card of its own, between the cards of a feed without Plus. It is never on a card of scripture, it says
 * what it is, and it offers the way out. `near` is true once the card is the next one, so an ad is asked for just
 * before it's seen and not for cards that are never reached.
 */
export function AdCard({ height, near }: { height: number; near: boolean }) {
  const colors = useColors();
  const styles = useStyles();
  const chrome = useChrome();
  const premium = useApp((s) => s.premium);
  const ready = useAds((s) => s.ready);
  const [wanted, setWanted] = useState(near);
  if (near && !wanted) setWanted(true);
  const [failed, setFailed] = useState(false);
  const sdk = adSdk;

  return (
    <View style={[styles.card, { height, paddingTop: chrome.contentTop, paddingBottom: chrome.contentBottom }]}>
      {premium ? (
        // Plus was bought with this card already in the feed.
        <View style={styles.words}>
          <Text style={styles.title}>No more ads.</Text>
          <Text style={styles.body}>Thank you for supporting Scroll Quran.</Text>
        </View>
      ) : sdk && ready && wanted && !failed ? (
        <>
          {/* Google allows two labels on its ads, this one and "Sponsored Links". */}
          <Text style={styles.label}>Advertisements</Text>
          <View style={styles.slot}>
            <sdk.BannerAd
              unitId={feedAdUnit()}
              size={sdk.BannerAdSize.MEDIUM_RECTANGLE}
              requestOptions={AD_REQUEST}
              onAdFailedToLoad={() => setFailed(true)}
            />
          </View>
          <Pressable hitSlop={10} onPress={() => openPaywall('ads')} style={styles.out} accessibilityRole="button">
            <Text style={styles.outText}>Read without ads</Text>
            <Icon name="chevron-right" size={15} color={colors.gold} strokeWidth={2.2} />
          </Pressable>
        </>
      ) : (
        // No ad to show (none came back, the phone is offline, or this build has no ad SDK): Plus, in its place.
        <View style={styles.words}>
          <Text style={styles.plus}>Scroll Quran Plus</Text>
          <Text style={styles.title}>Read without ads.</Text>
          <Text style={styles.body}>Plus takes the ads out of your feed, opens every topic feed and sends an alert at every prayer time.</Text>
          <PrimaryButton label="See Plus" onPress={() => openPaywall('ads')} style={{ marginTop: 24 }} />
          {__DEV__ && !sdk && <Text style={styles.dev}>An ad shows here in a real build. Expo Go and the browser have no ad SDK.</Text>}
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: { backgroundColor: colors.page, paddingHorizontal: layout.gutter, alignItems: 'center', justifyContent: 'center' },
  label: { ...eyebrow, fontSize: 11, color: colors.faint, marginBottom: 12 },
  // The ad is shown whole, with nothing over it or cut from it, and the link below keeps its distance, so no tap
  // meant for the app lands on the ad.
  slot: { ...SLOT, backgroundColor: colors.raised },
  out: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 32, paddingVertical: 2 },
  outText: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.gold },
  words: { alignSelf: 'stretch', maxWidth: 420 },
  plus: { ...eyebrow, color: colors.gold, marginBottom: 12 },
  title: { fontFamily: fonts.read, fontSize: 28, lineHeight: 36, color: colors.text },
  body: { fontFamily: fonts.read, fontSize: 17, lineHeight: 25, color: colors.read, marginTop: 8 },
  dev: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 17, color: colors.faint, marginTop: 14 },
}));
