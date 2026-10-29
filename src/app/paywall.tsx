import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseButton } from '@/components/ui';
import { PaywallPanel } from '@/components/paywall-panel';
import type { Topic } from '@/data/content';
import { clearPending, type PaywallReason } from '@/lib/upsell';
import { makeStyles } from '@/theme/theme';
import { eyebrow, layout } from '@/theme/tokens';

export default function Paywall() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { reason = 'welcome', topic } = useLocalSearchParams<{ reason?: PaywallReason; topic?: Topic }>();
  // Closing without buying drops the save or topic that opened it.
  useEffect(() => clearPending, []);

  return (
    <View style={styles.screen}>
      <CloseButton style={[styles.close, { top: insets.top + 12 }]} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Scroll Quran Plus</Text>
        <PaywallPanel reason={reason} topic={topic} onSubscribed={() => router.back()} />
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.page },
  close: { position: 'absolute', right: layout.gutter - 6, zIndex: 2 },
  content: { paddingHorizontal: layout.gutter, maxWidth: 560, width: '100%', alignSelf: 'center' },
  eyebrow: { ...eyebrow, color: colors.gold, marginBottom: 12 },
}));
