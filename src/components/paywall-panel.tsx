import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { topicLabel, type Topic } from '@/data/content';
import { PAID_STYLES } from '@/data/styles';
import { haptic } from '@/lib/feedback';
import { isDemo, loadPlans, purchase, restorePurchases, usePlans, type Plan } from '@/lib/purchases';
import type { PaywallReason } from '@/lib/upsell';
import { FREE_DAILY_CARDS, FREE_SAVES, useApp } from '@/store/app-store';
import { makeStyles, useColors } from '@/theme/theme';
import { fonts } from '@/theme/tokens';

import { Icon } from './icon';
import { FootLink, PlanTiles, termsFor } from './plus-pages';
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
    case 'styles':
      return {
        title: 'Every card style comes with Plus.',
        body: `Plus opens every topic feed, takes away the daily limit and includes all ${PAID_STYLES.length} paid card styles.`,
      };
    case 'alerts':
      return { title: 'Prayer alerts come with Plus.', body: 'Plus sends an alert at every prayer time and takes away the daily limit.' };
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
        title: 'Scroll the Quran instead.',
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
  /** For short screens: leaves out the second line and the price per day. */
  tight?: boolean;
  onSubscribed?: () => void;
};

/** What Plus gives, the plans and the button. Used by the paywall screen and the end of the free feed. */
export function PaywallPanel({ reason, topic, compact, tight, onSubscribed }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const picked = joinNames(useApp((s) => s.topics).map(topicLabel));
  const goal = useApp((s) => s.dailyGoal);
  const copy = copyFor(reason, topic, picked, goal);

  const benefits = [
    `No daily limit (free is ${FREE_DAILY_CARDS} cards a day)`,
    picked ? `Every topic feed, including ${picked}` : 'Every topic feed',
    'An alert at every prayer time',
    `Save as many cards as you like (free is ${FREE_SAVES})`,
    `All ${PAID_STYLES.length} paid card styles`,
  ];

  return (
    <View>
      <Text style={[styles.title, compact && styles.titleCompact]}>{copy.title}</Text>
      {!tight && <Text style={styles.body}>{copy.body}</Text>}

      {/* The wall at the end of the free feed has less room, so the plans do the talking there. */}
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

      <Offer compact={compact} tight={tight} onSubscribed={onSubscribed} />
    </View>
  );
}

/** Yearly and Monthly, the button, the renewal terms, restore and the legal links. */
export function Offer({ compact, tight, onSubscribed }: { compact?: boolean; tight?: boolean; onSubscribed?: () => void }) {
  const styles = useStyles();
  const plans = usePlans();
  const [plan, setPlan] = useState<Plan>('yearly');
  const chosen = plans[plan] ?? plans.yearly;

  // Retries the store prices if they didn't load when the app opened.
  useEffect(() => {
    loadPlans();
  }, []);

  return (
    <View>
      <View style={[styles.plans, compact && styles.plansCompact]}>
        <PlanTiles
          plan={plan}
          showDaily={!tight}
          onPick={(p) => {
            haptic.tap();
            setPlan(p);
          }}
        />
      </View>

      <PrimaryButton
        label="Subscribe"
        onPress={async () => {
          if (await purchase(plan)) {
            haptic.success();
            onSubscribed?.();
          }
        }}
        style={{ marginTop: compact ? 18 : 24 }}
      />
      <Text style={styles.fine}>
        {termsFor(chosen?.price ?? '')}
        {isDemo ? ' Demo build: no payment is taken.' : ''}
      </Text>
      <View style={styles.links}>
        <FootLink
          label="Restore purchases"
          onPress={async () => {
            if (await restorePurchases()) {
              haptic.success();
              onSubscribed?.();
            }
          }}
        />
        <FootLink label="Terms" onPress={() => router.push('/terms')} />
        <FootLink label="Privacy" onPress={() => router.push('/privacy')} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  title: { fontFamily: fonts.read, fontSize: 28, lineHeight: 36, color: colors.text },
  titleCompact: { fontSize: 25, lineHeight: 32 },
  body: { fontFamily: fonts.read, fontSize: 17, lineHeight: 25, color: colors.read, marginTop: 8 },
  benefits: { marginTop: 24, gap: 12 },
  benefit: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  benefitText: { fontFamily: fonts.ui, fontSize: 15.5, color: colors.read, flex: 1 },
  plans: { marginTop: 32 },
  plansCompact: { marginTop: 26 },
  fine: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 17, color: colors.faint, textAlign: 'center', marginTop: 12 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 },
}));
