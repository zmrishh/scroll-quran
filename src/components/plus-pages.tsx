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

/** The price and what renews, for under the button, as Apple and Google expect. */
export function termsFor(price: string) {
  return price ? `${price}. Renews automatically until you cancel.` : '';
}

type TilesProps = { plan: Plan; onPick: (plan: Plan) => void; delay?: number };

/**
 * Yearly and Monthly side by side, with what the chosen one comes to per day in a sentence underneath. The amount
 * actually charged is the largest price on each tile, as Apple requires; the price per day sits right under it,
 * smaller, and stands out by its colour instead.
 */
export function PlanTiles({ plan, onPick, delay = 0 }: TilesProps) {
  const styles = useStyles();
  const { yearly, monthly } = usePlans();
  // A month is taken as 30 days.
  const yearlyDay = yearly ? perDay(yearly) : null;
  const monthlyDay = monthly ? perDay(monthly, 30) : null;
  const daily = plan === 'yearly' ? yearlyDay : monthlyDay;

  return (
    <View>
      <Animated.View entering={FadeIn.delay(delay).duration(700)} style={styles.pair}>
        {yearly && (
          <Tile
            on={plan === 'yearly'}
            badge={yearly.badge}
            title="Yearly"
            price={yearly.short}
            unit="/year"
            line={yearlyDay ? `${yearlyDay} a day` : 'billed yearly'}
            onPress={() => onPick('yearly')}
          />
        )}
        {monthly && (
          <Tile
            on={plan === 'monthly'}
            title="Monthly"
            price={monthly.short}
            unit="/month"
            line={monthlyDay ? `${monthlyDay} a day` : 'billed monthly'}
            onPress={() => onPick('monthly')}
          />
        )}
      </Animated.View>
      {daily && (
        <Animated.Text key={plan} entering={FadeIn.delay(plan === 'yearly' ? delay + 450 : 0).duration(500)} style={styles.daily}>
          That’s {daily} a day for {HOURS_A_YEAR} hours with the{' '}Quran.
        </Animated.Text>
      )}
    </View>
  );
}

/**
 * The last page of onboarding: the two plans, and the same Continue button as every page before it, with the price
 * and renewal terms right under it. The legal links wait in a quiet line at the bottom.
 */
export function PlanPage({ onDone }: { onDone: () => void }) {
  const styles = useStyles();
  const plans = usePlans();
  const [plan, setPlan] = useState<Plan>('yearly');
  const [busy, setBusy] = useState(false);
  const chosen = plans[plan] ?? plans.yearly;

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

  return (
    <View style={styles.page}>
      <View style={{ marginTop: 36 }}>
        <PlanTiles
          plan={plan}
          delay={450}
          onPick={(p) => {
            haptic.tap();
            setPlan(p);
          }}
        />
      </View>

      <View style={styles.spacer} />

      <PrimaryButton label="Continue" disabled={busy} onPress={buy} />
      <Text style={styles.terms}>
        {termsFor(chosen?.price ?? '')}
        {isDemo ? ' Demo build.' : ''}
      </Text>
      <View style={styles.links}>
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

export function FootLink({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable hitSlop={8} onPress={onPress} accessibilityRole="button">
      <Text style={styles.link}>{label}</Text>
    </Pressable>
  );
}

type TileProps = {
  on: boolean;
  title: string;
  /** The amount actually charged, the largest price on the tile. */
  price: string;
  unit: string;
  /** Under it, in gold: what that comes to per day. */
  line: string;
  badge?: string | null;
  onPress: () => void;
};

/** A plan as a quiet card; the chosen one takes the gold edge. */
function Tile({ on, title, price, unit, line, badge, onPress }: TileProps) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${title}: ${price} ${unit.replace('/', 'a ')}, ${line}${badge ? `, ${badge}` : ''}`}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      style={[styles.tile, on && styles.tileOn]}>
      {badge && <Text style={styles.badge}>{badge}</Text>}
      <Text style={[styles.tileTitle, on && styles.tileTitleOn]}>{title}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.tilePrice}>{price || '…'}</Text>
        <Text style={styles.tileUnit}>{unit}</Text>
      </View>
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
  pair: { flexDirection: 'row', gap: 12 },
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
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 6 },
  tilePrice: { fontFamily: fonts.read, fontSize: 28, lineHeight: 36, color: colors.text, fontVariant: ['tabular-nums'] },
  tileUnit: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet },
  tileLine: { fontFamily: fonts.uiSemi, fontSize: 15, color: colors.gold, marginTop: 4, textAlign: 'center' },
  daily: { fontFamily: fonts.read, fontSize: 16, lineHeight: 24, color: colors.read, textAlign: 'center', marginTop: 24 },

  spacer: { flex: 1, minHeight: 24 },
  terms: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 17, color: colors.faint, textAlign: 'center', marginTop: 12 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 8 },
  link: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.quiet },
}));
