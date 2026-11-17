import { Pressable, Text, View } from 'react-native';

import { haptic } from '@/lib/feedback';
import { newerVersion, openAppStore } from '@/lib/update';
import { useApp } from '@/store/app-store';
import { useChrome } from '@/theme/layout';
import { makeStyles } from '@/theme/theme';
import { eyebrow, fonts, layout } from '@/theme/tokens';

import { PrimaryButton } from '../primary-button';

/**
 * The first card of the feed when the App Store has a newer version than the one running. "Later" puts that version
 * away for good; the card is back when there's a newer one still.
 */
export function UpdateCard({ height }: { height: number }) {
  const styles = useStyles();
  const chrome = useChrome();
  const version = useApp(newerVersion);

  return (
    <View style={[styles.card, { height, paddingTop: chrome.contentTop, paddingBottom: chrome.contentBottom }]}>
      <View style={styles.words}>
        <Text style={styles.label}>Update</Text>
        <Text style={styles.title}>A new version of Scroll Quran is ready.</Text>
        <Text style={styles.body}>{version ? `Version ${version} is on the App Store.` : 'It’s on the App Store.'}</Text>
        <PrimaryButton label="Update" onPress={openAppStore} style={{ marginTop: 24 }} />
        <Pressable
          hitSlop={10}
          onPress={() => {
            haptic.tap();
            useApp.getState().set({ updateSkipped: version });
          }}
          style={styles.later}
          accessibilityRole="button">
          <Text style={styles.laterText}>Later</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: { backgroundColor: colors.page, paddingHorizontal: layout.gutter, alignItems: 'center', justifyContent: 'center' },
  words: { alignSelf: 'stretch', maxWidth: 420 },
  label: { ...eyebrow, color: colors.gold, marginBottom: 12 },
  title: { fontFamily: fonts.read, fontSize: 28, lineHeight: 36, color: colors.text },
  body: { fontFamily: fonts.read, fontSize: 17, lineHeight: 25, color: colors.read, marginTop: 8 },
  later: { alignSelf: 'center', marginTop: 16, paddingVertical: 2 },
  laterText: { fontFamily: fonts.uiMedium, fontSize: 15, color: colors.quiet },
}));
