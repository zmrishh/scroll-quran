import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardStyleLayer, useCardStyle } from '@/components/card-style';
import { Icon } from '@/components/icon';
import { PASSAGES } from '@/data/content';
import { ALL_STYLES_PRODUCT, CARD_STYLES, ownsStyle, type CardStyle } from '@/data/styles';
import { haptic } from '@/lib/feedback';
import { buyStyle, isDemo, loadStylePrices, restorePurchases, useStylePrices } from '@/lib/purchases';
import { useApp } from '@/store/app-store';
import { colors, fonts } from '@/theme/tokens';

const SAMPLE = PASSAGES.find((p) => p.id === '94:5-6')!.ayat[0];
const PAID = CARD_STYLES.filter((s) => s.product);
const TILE_HEIGHT = 230;

export default function Styles() {
  const insets = useSafeAreaInsets();
  const inUse = useCardStyle();
  const owned = useApp((s) => s.ownedStyles);
  const prices = useStylePrices();
  const [busy, setBusy] = useState(false);
  const allOwned = PAID.every((s) => ownsStyle(s, owned));

  useEffect(() => {
    loadStylePrices();
  }, []);

  const buy = async (product: string) => {
    if (busy) return false;
    setBusy(true);
    const ok = await buyStyle(product);
    setBusy(false);
    if (ok) haptic.success();
    return ok;
  };

  const choose = async (s: CardStyle) => {
    if (ownsStyle(s, owned) || (await buy(s.product!))) {
      haptic.tap();
      useApp.getState().set({ cardStyle: s.id });
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Card styles</Text>
          <Pressable accessibilityLabel="Close" hitSlop={12} onPress={() => router.back()} style={styles.close}>
            <Icon name="x" size={18} color={colors.read} strokeWidth={2.4} />
          </Pressable>
        </View>
        <Text style={styles.sub}>Illumination from Quran manuscripts at The Met, on every card you read and share.</Text>

        {!allOwned && (
          <Pressable
            disabled={busy}
            onPress={async () => {
              if (await buy(ALL_STYLES_PRODUCT)) useApp.getState().set({ cardStyle: PAID[0].id });
            }}
            style={({ pressed }) => [styles.bundle, pressed && { opacity: 0.8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bundleTitle}>All {PAID.length} styles</Text>
              <Text style={styles.bundleNote}>Pay once, keep them for good</Text>
            </View>
            <Text style={styles.bundlePrice}>{prices[ALL_STYLES_PRODUCT] ?? ''}</Text>
          </Pressable>
        )}

        <View style={styles.grid}>
          {CARD_STYLES.map((s) => {
            const has = ownsStyle(s, owned);
            const active = inUse === s.id;
            return (
              <Pressable
                key={s.id}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={`${s.name} style${active ? ', in use' : has ? '' : `, ${prices[s.product!] ?? ''}`}`}
                onPress={() => choose(s)}
                style={({ pressed }) => [styles.tile, pressed && { opacity: 0.8 }]}>
                <View style={[styles.preview, active && styles.previewOn]}>
                  <CardStyleLayer style={s.id} height={TILE_HEIGHT} contentTop={24} contentBottom={22} seed="ayah:94:5-6" />
                  <View style={styles.previewText}>
                    <Text style={styles.previewArabic}>{SAMPLE.ar}</Text>
                    <Text style={styles.previewEnglish}>{SAMPLE.en}</Text>
                  </View>
                </View>
                <View style={styles.tileFoot}>
                  <Text style={styles.tileName}>{s.name}</Text>
                  {active ? (
                    <Icon name="check" size={16} color={colors.gold} strokeWidth={2.6} />
                  ) : (
                    <Text style={[styles.tileState, !has && styles.tilePrice]}>{has ? 'Use' : (prices[s.product!] ?? '')}</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable hitSlop={8} onPress={() => restorePurchases()} style={styles.restore}>
          <Text style={styles.restoreText}>Restore purchases</Text>
        </Pressable>
        {isDemo && <Text style={styles.demo}>Demo build: no payment is taken.</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  content: { paddingHorizontal: 20, maxWidth: 640, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  title: { fontFamily: fonts.read, fontSize: 32, color: colors.text },
  close: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  sub: { fontFamily: fonts.ui, fontSize: 14.5, lineHeight: 21, color: colors.quiet, marginTop: 6, paddingHorizontal: 4 },
  bundle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.goldSoft,
  },
  bundleTitle: { fontFamily: fonts.uiMedium, fontSize: 16, color: colors.text },
  bundleNote: { fontFamily: fonts.ui, fontSize: 13, color: colors.read, marginTop: 2 },
  bundlePrice: { fontFamily: fonts.uiMedium, fontSize: 16, color: colors.gold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
  tile: { width: '48%', flexGrow: 1 },
  preview: {
    height: TILE_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.page,
    borderWidth: 1,
    borderColor: colors.line,
  },
  previewOn: { borderColor: colors.gold, borderWidth: 1.5 },
  previewText: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  previewArabic: { fontFamily: fonts.quran, fontSize: 19, lineHeight: 38, color: colors.text, textAlign: 'center', writingDirection: 'rtl' },
  previewEnglish: { fontFamily: fonts.read, fontSize: 12, lineHeight: 17, color: colors.read, textAlign: 'center', marginTop: 4 },
  tileFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 8 },
  tileName: { fontFamily: fonts.uiMedium, fontSize: 14.5, color: colors.text },
  tileState: { fontFamily: fonts.uiMedium, fontSize: 13.5, color: colors.quiet },
  tilePrice: { color: colors.gold },
  restore: { alignSelf: 'center', marginTop: 26 },
  restoreText: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet, textDecorationLine: 'underline' },
  demo: { fontFamily: fonts.ui, fontSize: 12, color: colors.faint, textAlign: 'center', marginTop: 8 },
});
