import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { ART } from '@/data/art';
import { topicLabel, type Topic } from '@/data/content';
import { haptic } from '@/lib/feedback';
import { isDemo, loadPlans, purchase, restorePurchases, STORE, usePlans, type Plan, type PlanInfo } from '@/lib/purchases';
import type { PaywallReason } from '@/lib/upsell';
import { FREE_DAILY_CARDS, FREE_SAVES, useApp } from '@/store/app-store';
import { makeStyles, useColors } from '@/theme/theme';
import { eyebrow, fonts, layout } from '@/theme/tokens';

import { Icon } from './icon';
import { PrimaryButton } from './primary-button';

const joinNames = (names: string[]) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/** Headline and one supporting line, written for why the paywall opened. */
function copyFor(reason: PaywallReason, topic: Topic | undefined, picked: string, goal: number) {
  switch (reason) {
    case 'limit':
      return { title: `That’s your ${FREE_DAILY_CARDS} for today.`, body: 'Plus has no daily limit, so you can keep reading now.' };
    case 'saves':
      return { title: `Your ${FREE_SAVES} free saves are used.`, body: 'With Plus you can keep every card you want to come back to.' };
    case 'topic':
      return {
        title: `The ${topic ? topicLabel(topic) : 'topic'} feed is part of Plus.`,
        body: 'Plus opens every topic feed and takes away the daily limit.',
      };
    default:
      if (goal > FREE_DAILY_CARDS) {
        return {
          title: 'Your plan needs Plus.',
          body: `Your goal is ${goal} cards a day, and the free plan stops at ${FREE_DAILY_CARDS}. Plus has no limit${picked ? ` and opens your ${picked} feeds` : ''}.`,
        };
      }
      return {
        title: 'Make it a daily habit.',
        body: picked
          ? `You picked ${picked}. Plus opens those feeds and takes away the daily limit.`
          : 'Plus opens every topic feed and takes away the daily limit.',
      };
  }
}

type Props = {
  reason: PaywallReason;
  topic?: Topic;
  /** Tighter spacing for the wall that ends the free feed. */
  compact?: boolean;
  onSubscribed?: () => void;
};

/** What Plus gives, the plans and the button. Used by the paywall screen and the end of the free feed. */
export function PaywallPanel({ reason, topic, compact, onSubscribed }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const plans = usePlans();
  // Lifetime is the one on offer first; until someone picks, it's chosen whenever the store has it.
  const [choice, setChoice] = useState<Plan | null>(null);
  const plan: Plan = choice ?? (plans.lifetime ? 'lifetime' : 'yearly');
  const chosen = plans[plan] ?? plans.yearly!;
  const subscriptions = (['yearly', 'monthly'] as const).filter((id) => plans[id]);
  const select = (id: Plan) => {
    haptic.tap();
    setChoice(id);
  };
  const picked = joinNames(useApp((s) => s.topics).map(topicLabel));
  const goal = useApp((s) => s.dailyGoal);
  const copy = copyFor(reason, topic, picked, goal);

  const benefits = [
    `No daily limit (free is ${FREE_DAILY_CARDS} cards a day)`,
    picked ? `Every topic feed, including ${picked}` : 'Every topic feed',
    `Save as many cards as you like (free is ${FREE_SAVES})`,
    'Share cards without the watermark',
  ];

  // Retries the store prices if they didn't load when the app opened.
  useEffect(() => {
    loadPlans();
  }, []);

  // Apple and Google both expect the renewal terms next to the button.
  const once = plan === 'lifetime';
  const terms = chosen.price
    ? `${chosen.price}. ${once ? 'One payment. Nothing renews.' : `Renews automatically until you cancel in your ${STORE} settings, at least 24 hours before it renews.`}${isDemo ? ' Demo build: no payment is taken.' : ''}`
    : '';

  return (
    <View>
      <Text style={[styles.title, compact && styles.titleCompact]}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>

      {/* The wall at the end of the free feed has less room; the Lifetime card does the selling there. */}
      {!compact && (
        <View style={styles.benefits}>
          {benefits.map((b) => (
            <View key={b} style={styles.benefit}>
              <Icon name="check" size={16} color={colors.gold} strokeWidth={2.2} />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.plans, compact && styles.plansCompact]}>
        {plans.lifetime && (
          <LifetimeCard
            info={plans.lifetime}
            yearly={plans.yearly}
            on={plan === 'lifetime'}
            compact={compact}
            onPress={() => select('lifetime')}
          />
        )}
        {plans.lifetime && <Text style={styles.or}>or subscribe</Text>}
        <View style={styles.subscriptions}>
          {subscriptions.map((id) => {
            const p = plans[id]!;
            const on = id === plan;
            return (
              <Pressable
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => select(id)}
                style={[styles.plan, on && styles.planOn]}>
                <View style={styles.planHead}>
                  <Text style={[styles.planTitle, on && { color: colors.text }]}>{p.title}</Text>
                  {p.badge && <Text style={styles.badge}>{p.badge}</Text>}
                </View>
                <Text style={[styles.planPrice, on && { color: colors.text }]}>{p.price || '…'}</Text>
                {!compact && <Text style={styles.planNote}>{p.note}</Text>}
              </Pressable>
            );
          })}
        </View>
      </View>

      <PrimaryButton
        label={once ? (chosen.short ? `Get Lifetime · ${chosen.short}` : 'Get Lifetime') : 'Subscribe'}
        onPress={async () => {
          if (await purchase(plan)) {
            haptic.success();
            onSubscribed?.();
          }
        }}
        style={{ marginTop: compact ? 16 : 22 }}
      />
      <Text style={styles.fine}>{terms}</Text>
      <View style={styles.links}>
        <Pressable
          hitSlop={8}
          onPress={async () => {
            if (await restorePurchases()) {
              haptic.success();
              onSubscribed?.();
            }
          }}>
          <Text style={styles.link}>Restore purchases</Text>
        </Pressable>
        <Pressable hitSlop={8} onPress={() => router.push('/terms')}>
          <Text style={styles.link}>Terms</Text>
        </Pressable>
        <Pressable hitSlop={8} onPress={() => router.push('/privacy')}>
          <Text style={styles.link}>Privacy</Text>
        </Pressable>
      </View>
    </View>
  );
}

const LIFETIME_PROMISES = ['Every Plus feature, for good', 'Nothing renews, nothing to cancel', 'Comes back on a new phone'];

type LifetimeProps = { info: PlanInfo; yearly: PlanInfo | null; on: boolean; compact?: boolean; onPress: () => void };

/**
 * The featured plan: a card with manuscript light behind it and a slow gold shimmer. The one number it adds,
 * how many months of Yearly the price equals, is worked out from the store's own prices.
 */
function LifetimeCard({ info, yearly, on, compact, onPress }: LifetimeProps) {
  const colors = useColors();
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const sweep = useSharedValue(0);
  const months = info.amount && yearly?.amount ? Math.round(info.amount / (yearly.amount / 12)) : null;

  useEffect(() => {
    sweep.set(
      withRepeat(withSequence(withDelay(2200, withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) })), withTiming(0, { duration: 0 })), -1),
    );
  }, [sweep]);
  const shimmer = useAnimatedStyle(() => ({ transform: [{ translateX: -120 + (width + 240) * sweep.get() }, { rotate: '18deg' }] }));

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`Lifetime, ${info.short}, one payment${months ? `, pays for itself in ${months} months` : ''}`}
      onPress={onPress}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.lifetime, on && styles.lifetimeOn]}>
      <Image source={ART.rosette.source} contentFit="cover" style={styles.lifetimeArt} accessible={false} />
      <LinearGradient
        colors={[colors.raised, colors.raised, `rgba(${colors.raisedRgb},0.15)`]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View pointerEvents="none" style={[styles.shimmer, shimmer]}>
        <LinearGradient
          colors={['rgba(255,233,180,0)', 'rgba(255,233,180,0.28)', 'rgba(255,233,180,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.lifetimeHead}>
        <Text style={styles.bestValue}>Best value</Text>
        <View style={[styles.radio, on && styles.radioOn]}>{on && <Icon name="check" size={12} color={colors.onGold} strokeWidth={3} />}</View>
      </View>
      <Text style={styles.lifetimeTitle}>Lifetime</Text>
      <View style={styles.priceRow}>
        <Text style={styles.lifetimePrice}>{info.short || '…'}</Text>
        <Text style={styles.once}>one payment</Text>
      </View>
      {months && <Text style={styles.payback}>Pays for itself in {months} months</Text>}
      {!compact && (
        <View style={styles.promises}>
          {LIFETIME_PROMISES.map((p) => (
            <View key={p} style={styles.promise}>
              <Icon name="check" size={14} color={colors.gold} strokeWidth={2.4} />
              <Text style={styles.promiseText}>{p}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  title: { fontFamily: fonts.read, fontSize: 28, lineHeight: 36, color: colors.text },
  titleCompact: { fontSize: 25, lineHeight: 32 },
  body: { fontFamily: fonts.read, fontSize: 17, lineHeight: 25, color: colors.read, marginTop: 8 },
  benefits: { marginTop: 24, gap: 12 },
  benefit: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  benefitText: { fontFamily: fonts.ui, fontSize: 15.5, color: colors.read, flex: 1 },
  plans: { marginTop: 24 },
  plansCompact: { marginTop: 18 },
  lifetime: {
    borderRadius: layout.radius.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.raised,
    overflow: 'hidden',
    padding: 18,
  },
  lifetimeOn: { borderColor: colors.gold },
  lifetimeArt: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '62%' },
  shimmer: { position: 'absolute', top: -40, bottom: -40, width: 80 },
  lifetimeHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bestValue: {
    ...eyebrow,
    fontSize: 11,
    color: colors.onGold,
    backgroundColor: colors.gold,
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.faint, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  lifetimeTitle: { fontFamily: fonts.read, fontSize: 24, color: colors.text, marginTop: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 },
  lifetimePrice: { fontFamily: fonts.read, fontSize: 34, lineHeight: 42, color: colors.text, fontVariant: ['tabular-nums'] },
  once: { fontFamily: fonts.ui, fontSize: 14, color: colors.read },
  payback: { fontFamily: fonts.uiMedium, fontSize: 13.5, color: colors.gold, marginTop: 2 },
  promises: { gap: 6, marginTop: 14 },
  promise: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  promiseText: { fontFamily: fonts.ui, fontSize: 14, color: colors.read },
  or: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet, textAlign: 'center', marginTop: 16, marginBottom: 10 },
  subscriptions: { flexDirection: 'row', gap: 10 },
  plan: { flex: 1, borderRadius: layout.radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 4 },
  planOn: { borderColor: colors.gold },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  planTitle: { fontFamily: fonts.uiMedium, fontSize: 16, color: colors.read },
  badge: {
    fontFamily: fonts.uiSemi,
    fontSize: 11,
    color: colors.onGold,
    backgroundColor: colors.gold,
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  planNote: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet, marginTop: 2 },
  planPrice: { fontFamily: fonts.uiMedium, fontSize: 15, color: colors.read },
  fine: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 17, color: colors.faint, textAlign: 'center', marginTop: 12 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 },
  link: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.quiet, textDecorationLine: 'underline' },
}));
