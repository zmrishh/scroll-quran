import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { haptic } from '@/lib/feedback';
import { isDemo, perDay, purchase, restorePurchases, usePlans, type Plan } from '@/lib/purchases';
import { makeStyles } from '@/theme/theme';
import { eyebrow, fonts, layout } from '@/theme/tokens';

import { PrimaryButton } from './primary-button';

// Fifteen minutes a day, swapped from the feed to the Quran, over a year.
const MINUTES_A_DAY = 15;
export const HOURS_A_YEAR = Math.round((MINUTES_A_DAY * 365) / 60);

/** What fifteen minutes a day comes to, and what a single letter is worth. Nothing else. */
export function ValuePage() {
  const styles = useStyles();
  return (
    <Animated.View entering={FadeIn.delay(500).duration(700)} style={styles.value}>
      <Text style={styles.hours}>{HOURS_A_YEAR} hours</Text>
      <Text style={styles.hoursLine}>with the Quran this year, instead of the{' '}feed.</Text>
      <View style={styles.rule} />
      <Text style={styles.quote}>
        “Whoever reads a letter of the Book of Allah has a good deed, and every good deed is multiplied by ten.”
      </Text>
      <Text style={styles.source}>The Prophet ﷺ · Tirmidhi 2910</Text>
    </Animated.View>
  );
}

/**
 * The last page of onboarding: Yearly or Monthly side by side, what the year comes to per day, and the same Continue
 * button as every page before it, with the price and renewal terms right under it. Lifetime and the legal links wait
 * in a quiet line at the bottom.
 */
export function PlanPage({ onDone }: { onDone: () => void }) {
  const styles = useStyles();
  const plans = usePlans();
  const [plan, setPlan] = useState<Plan>('yearly');
  const [all, setAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const { yearly, monthly, lifetime } = plans;
  const chosen = plans[plan] ?? yearly;
  const daily = yearly ? perDay(yearly) : null;
  const monthOfYear = yearly ? perDay(yearly, 12) : null;

  const pick = (p: Plan) => {
    haptic.tap();
    setPlan(p);
  };

  const buy = async () => {
    if (busy || !chosen) return;
    setBusy(true);
    const ok = await purchase(plan);
    setBusy(false);
    if (ok) {
      haptic.success();
      onDone();
    }
  };

  // The price and what renews, next to the button, as Apple and Google expect.
  const terms = !chosen?.price ? '' : plan === 'lifetime' ? `${chosen.price}. Nothing renews.` : `${chosen.price}. Renews automatically until you cancel.`;

  return (
    <View style={styles.page}>
      <Animated.View entering={FadeIn.delay(450).duration(700)} style={styles.pair}>
        {yearly && (
          <Tile
            on={plan === 'yearly'}
            badge={yearly.badge}
            title="Yearly"
            price={yearly.short}
            line={monthOfYear ? `${monthOfYear} a month` : 'billed yearly'}
            onPress={() => pick('yearly')}
          />
        )}
        {monthly && <Tile on={plan === 'monthly'} title="Monthly" price={monthly.short} line="billed monthly" onPress={() => pick('monthly')} />}
      </Animated.View>
      {all && lifetime && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.lifetime}>
          <Tile on={plan === 'lifetime'} title="Lifetime" price={lifetime.short} line="once, every card style included" onPress={() => pick('lifetime')} />
        </Animated.View>
      )}

      {plan === 'yearly' && daily && (
        <Animated.Text entering={FadeIn.delay(900).duration(700)} style={styles.daily}>
          That’s {daily} a day for {HOURS_A_YEAR} hours with the{' '}Quran.
        </Animated.Text>
      )}

      <View style={styles.spacer} />

      <PrimaryButton label="Continue" disabled={busy} onPress={buy} />
      <Text style={styles.terms}>
        {terms}
        {isDemo ? ' Demo build.' : ''}
      </Text>
      <View style={styles.links}>
        {!all && lifetime && <FootLink label="All plans" onPress={() => setAll(true)} />}
        <FootLink
          label="Restore"
          onPress={async () => {
            if (await restorePurchases()) onDone();
          }}
        />
        <FootLink label="Terms" onPress={() => router.push('/terms')} />
        <FootLink label="Privacy" onPress={() => router.push('/privacy')} />
      </View>
    </View>
  );
}

function FootLink({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable hitSlop={8} onPress={onPress} accessibilityRole="button">
      <Text style={styles.link}>{label}</Text>
    </Pressable>
  );
}

type TileProps = { on: boolean; title: string; price: string; line: string; badge?: string | null; onPress: () => void };

/** A plan as a quiet card; the chosen one takes the gold edge. */
function Tile({ on, title, price, line, badge, onPress }: TileProps) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      style={[styles.tile, on && styles.tileOn]}>
      {badge && <Text style={styles.badge}>{badge}</Text>}
      <Text style={[styles.tileTitle, on && styles.tileTitleOn]}>{title}</Text>
      <Text style={styles.tilePrice}>{price || '…'}</Text>
      <Text style={styles.tileLine}>{line}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  value: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 24 },
  hours: { fontFamily: fonts.read, fontSize: 64, lineHeight: 74, color: colors.gold, fontVariant: ['tabular-nums'] },
  hoursLine: { fontFamily: fonts.read, fontSize: 18, lineHeight: 26, color: colors.read, textAlign: 'center', marginTop: 4 },
  rule: { width: 40, height: 1, backgroundColor: colors.gold, opacity: 0.5, marginVertical: 30 },
  quote: { fontFamily: fonts.readItalic, fontSize: 18, lineHeight: 28, color: colors.read, textAlign: 'center' },
  source: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet, textAlign: 'center', marginTop: 12 },

  page: { flex: 1 },
  pair: { flexDirection: 'row', gap: 12, marginTop: 36 },
  lifetime: { marginTop: 12, flexDirection: 'row' },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 12,
    borderRadius: layout.radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tileOn: { borderColor: colors.gold, borderWidth: 1.5, backgroundColor: colors.raised },
  badge: {
    position: 'absolute',
    top: -10,
    ...eyebrow,
    fontSize: 10.5,
    color: colors.onGold,
    backgroundColor: colors.gold,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  tileTitle: { fontFamily: fonts.uiMedium, fontSize: 14.5, color: colors.quiet },
  tileTitleOn: { color: colors.text },
  tilePrice: { fontFamily: fonts.read, fontSize: 26, lineHeight: 34, color: colors.text, marginTop: 6, fontVariant: ['tabular-nums'] },
  tileLine: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet, marginTop: 2, textAlign: 'center' },
  daily: { fontFamily: fonts.read, fontSize: 16, lineHeight: 24, color: colors.read, textAlign: 'center', marginTop: 28 },

  spacer: { flex: 1, minHeight: 24 },
  terms: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 17, color: colors.faint, textAlign: 'center', marginTop: 12 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 8 },
  link: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.quiet },
}));
