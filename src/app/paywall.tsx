import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { PaywallPanel } from '@/components/paywall-panel';
import type { Topic } from '@/data/content';
import type { PaywallReason } from '@/lib/upsell';
import { colors, fonts } from '@/theme/tokens';

export default function Paywall() {
  const insets = useSafeAreaInsets();
  const { reason = 'welcome', topic } = useLocalSearchParams<{ reason?: PaywallReason; topic?: Topic }>();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Pressable accessibilityLabel="Close" hitSlop={12} onPress={() => router.back()} style={[styles.close, { top: insets.top + 12 }]}>
        <Icon name="x" size={20} color={colors.quiet} strokeWidth={2} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Scroll Quran Plus</Text>
        <PaywallPanel reason={reason} topic={topic} onSubscribed={() => router.back()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  close: { position: 'absolute', right: 24, zIndex: 2, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 28, maxWidth: 560, width: '100%', alignSelf: 'center' },
  eyebrow: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.gold, marginBottom: 12 },
});
