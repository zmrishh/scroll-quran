import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { topicLabel, type Topic } from '@/data/content';
import { haptic } from '@/lib/feedback';
import { isDemo, LINKS, loadPlans, openLink, purchase, restorePurchases, STORE, usePlans, type Plan } from '@/lib/purchases';
import type { PaywallReason } from '@/lib/upsell';
import { FREE_DAILY_CARDS, FREE_SAVES, useApp } from '@/store/app-store';
import { colors, fonts } from '@/theme/tokens';

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

/** What Plus gives, the two plans and the button. Used by the paywall screen and the end of the free feed. */
export function PaywallPanel({ reason, topic, compact, onSubscribed }: Props) {
  const [plan, setPlan] = useState<Plan>('yearly');
  const plans = usePlans();
  const chosen = plans[plan];
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
  const terms = chosen.price
    ? `${chosen.price}. Renews automatically until you cancel in your ${STORE} settings, at least 24 hours before it renews.${isDemo ? ' Demo build: no payment is taken.' : ''}`
    : '';

  return (
    <View>
      <Text style={[styles.title, compact && styles.titleCompact]}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>

      <View style={[styles.benefits, compact && styles.benefitsCompact]}>
        {benefits.map((b) => (
          <View key={b} style={styles.benefit}>
            <Icon name="check" size={16} color={colors.gold} strokeWidth={2.2} />
            <Text style={[styles.benefitText, compact && styles.benefitTextCompact]}>{b}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.plans, compact && styles.plansCompact]}>
        {(Object.keys(plans) as Plan[]).map((id) => {
          const p = plans[id];
          const on = id === plan;
          return (
            <Pressable
              key={id}
              onPress={() => {
                haptic.tap();
                setPlan(id);
              }}
              style={[styles.plan, compact && styles.planCompact, on && styles.planOn]}>
              <View style={{ flex: 1 }}>
                <View style={styles.planHead}>
                  <Text style={[styles.planTitle, on && { color: colors.text }]}>{p.title}</Text>
                  {p.badge && <Text style={styles.badge}>{p.badge}</Text>}
                </View>
                <Text style={styles.planNote}>{p.note}</Text>
              </View>
              <Text style={[styles.planPrice, on && { color: colors.text }]}>{p.price}</Text>
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton
        label="Subscribe"
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
        <Pressable hitSlop={8} onPress={() => openLink(LINKS.terms)}>
          <Text style={styles.link}>Terms</Text>
        </Pressable>
        <Pressable hitSlop={8} onPress={() => openLink(LINKS.privacy)}>
          <Text style={styles.link}>Privacy</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.read, fontSize: 30, lineHeight: 38, color: colors.text },
  titleCompact: { fontSize: 25, lineHeight: 32 },
  body: { fontFamily: fonts.read, fontSize: 17, lineHeight: 25, color: colors.read, marginTop: 8 },
  benefits: { marginTop: 26, gap: 13 },
  benefitsCompact: { marginTop: 18, gap: 9 },
  benefit: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  benefitText: { fontFamily: fonts.ui, fontSize: 15.5, color: colors.read, flex: 1 },
  benefitTextCompact: { fontSize: 14.5 },
  plans: { marginTop: 28, gap: 10 },
  plansCompact: { marginTop: 18, gap: 8 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 16 },
  planCompact: { paddingVertical: 12 },
  planOn: { borderColor: colors.gold },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planTitle: { fontFamily: fonts.uiMedium, fontSize: 16, color: colors.read },
  badge: {
    fontFamily: fonts.uiSemi,
    fontSize: 11,
    color: colors.page,
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
});
