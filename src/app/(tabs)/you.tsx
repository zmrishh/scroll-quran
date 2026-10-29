import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCardStyle } from '@/components/card-style';
import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { Segmented } from '@/components/segmented';
import { Bar, Ring, SectionHeader, Surface } from '@/components/ui';
import { NAMES } from '@/data/content';
import { cardStyle } from '@/data/styles';
import { moodInfo } from '@/data/moods';
import { deleteAccount, signOut } from '@/lib/auth';
import { confirm } from '@/lib/confirm';
import { isDemo, STORE } from '@/lib/purchases';
import { openPaywall } from '@/lib/upsell';
import {
  currentStreak,
  DAILY_GOALS,
  dailyTarget,
  FREE_DAILY_CARDS,
  isToday,
  moodToday,
  useApp,
  type ArabicSize,
  type Display,
} from '@/store/app-store';
import { makeStyles, useColors, type AppearancePref } from '@/theme/theme';
import { fonts, layout } from '@/theme/tokens';

const DISPLAY_OPTIONS: { id: Display; label: string }[] = [
  { id: 'both', label: 'Both' },
  { id: 'arabic', label: 'Arabic' },
  { id: 'english', label: 'English' },
];

const APPEARANCE_OPTIONS: { id: AppearancePref; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'Auto' },
];

const SIZE_OPTIONS: { id: ArabicSize; label: string }[] = [
  { id: 's', label: 'Small' },
  { id: 'm', label: 'Medium' },
  { id: 'l', label: 'Large' },
];

const GOAL_OPTIONS = DAILY_GOALS.map((g) => ({ id: String(g), label: `${g} cards` }));

const PROVIDERS = { apple: 'Apple', google: 'Google', test: 'a test account' };

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function YouScreen() {
  const colors = useColors();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const s = useApp();
  const look = useCardStyle();
  const mood = moodToday(s);
  const namesMet = NAMES.filter((n) => s.seenNames[n.id]).length;
  const streak = currentStreak(s);
  const target = dailyTarget(s);
  const viewed = isToday(s.day) ? s.viewedToday : 0;
  const left = Math.max(0, target - viewed);
  const cardsLeft = `${left} more card${left === 1 ? '' : 's'}`;
  const streakNote = isToday(s.lastActiveDay)
    ? 'Today’s goal is done. Come back tomorrow to keep it going.'
    : streak
      ? `${cardsLeft} today to keep your streak.`
      : `Read ${left} card${left === 1 ? '' : 's'} today to start a streak.`;
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: dayKey(d), label: d.toLocaleDateString('en', { weekday: 'narrow' }), today: i === 6 };
  });
  const stats = [
    { value: s.totals.dhikr, label: 'dhikr counted' },
    { value: s.totals.memorised, label: 'ayat memorised' },
    { value: s.totals.ameen, label: 'times Ameen' },
    { value: Object.keys(s.notes).length, label: 'reflections' },
    { value: Object.keys(s.liked).length, label: 'cards liked' },
    {
      value: s.totals.quizAnswered ? `${Math.round((s.totals.quizCorrect / s.totals.quizAnswered) * 100)}%` : '–',
      label: 'quiz accuracy',
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.salam}>السلام عليكم</Text>
        <Text style={styles.title}>Your journey</Text>

        <Surface style={styles.streak}>
          <View style={styles.streakTop}>
            <Text style={styles.streakNumber}>{streak}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakLabel}>day streak</Text>
              <Text style={styles.streakNote}>{streakNote}</Text>
            </View>
          </View>
          <View style={styles.week}>
            {week.map((d) => {
              const on = s.activeDays.includes(d.key);
              return (
                <View key={d.key} style={styles.day}>
                  <View style={[styles.dayDot, on && styles.dayDotOn, d.today && !on && styles.dayDotToday]}>
                    {on && <Icon name="check" size={14} color={colors.page} strokeWidth={3} />}
                  </View>
                  <Text style={[styles.dayLabel, d.today && { color: colors.text }]}>{d.label}</Text>
                </View>
              );
            })}
          </View>
        </Surface>

        <View style={styles.pair}>
          <Surface style={styles.half}>
            <Ring size={62} progress={Math.min(1, viewed / target)}>
              <Text style={styles.ringValue}>{viewed}</Text>
            </Ring>
            <Text style={styles.halfLabel}>cards today</Text>
            <Text style={styles.halfNote}>
              {`Goal ${target}`}
              {!s.premium && s.dailyGoal > FREE_DAILY_CARDS ? ` (${s.dailyGoal} with Plus)` : ''}
            </Text>
          </Surface>
          <Surface style={styles.half}>
            <Text style={styles.halfLabel}>Your heart today</Text>
            <Text style={[styles.mood, !mood && { color: colors.faint }]}>{(mood && moodInfo(mood)?.label) ?? 'Not asked yet'}</Text>
          </Surface>
        </View>

        <SectionHeader title="Your practice" />
        <View style={styles.grid}>
          {stats.map((st) => (
            <Surface key={st.label} style={styles.tile}>
              <Text style={styles.tileValue}>{typeof st.value === 'number' ? st.value.toLocaleString() : st.value}</Text>
              <Text style={styles.tileLabel}>{st.label}</Text>
            </Surface>
          ))}
        </View>

        <SectionHeader title="Names of Allah" detail={`${namesMet} of ${NAMES.length} met`} />
        <Surface>
          <Bar progress={namesMet / NAMES.length} />
          <View style={styles.names}>
            {NAMES.map((n) => {
              const met = !!s.seenNames[n.id];
              return (
                <View key={n.id} style={[styles.name, met && styles.nameMet]}>
                  {met ? <Text style={styles.nameText}>{n.arabic}</Text> : <View style={styles.nameDot} />}
                </View>
              );
            })}
          </View>
        </Surface>

        {s.premium ? (
          <Surface accent style={styles.plus}>
            <View style={styles.plusHead}>
              <Text style={styles.plusTitle}>Scroll Quran Plus</Text>
              <Text style={styles.plusBadge}>Active</Text>
            </View>
            <Text style={styles.plusBody}>No daily limit, every topic feed, unlimited saves and clean shares.</Text>
          </Surface>
        ) : (
          <Surface accent style={styles.plus}>
            <Text style={styles.plusTitle}>Scroll Quran Plus</Text>
            <Text style={styles.plusBody}>No daily limit, every topic feed and unlimited saves.</Text>
            <PrimaryButton label="See Plus" onPress={() => openPaywall('welcome')} style={{ marginTop: 16 }} />
          </Surface>
        )}

        <SectionHeader title="Reading" />
        <Surface style={styles.group}>
          <Row label="Card style" detail={cardStyle(look).name} onPress={() => router.push('/styles')} />
          <View style={[styles.setting, styles.divider]}>
            <Text style={styles.settingLabel}>Daily goal</Text>
            <Segmented value={String(s.dailyGoal)} options={GOAL_OPTIONS} onChange={(g) => s.set({ dailyGoal: Number(g) })} />
          </View>
          <View style={[styles.setting, styles.divider]}>
            <Text style={styles.settingLabel}>Show</Text>
            <Segmented value={s.display} options={DISPLAY_OPTIONS} onChange={(display) => s.set({ display })} />
          </View>
          <View style={[styles.setting, styles.divider]}>
            <Text style={styles.settingLabel}>Arabic size</Text>
            <Segmented value={s.arabicSize} options={SIZE_OPTIONS} onChange={(arabicSize) => s.set({ arabicSize })} />
          </View>
          <View style={[styles.setting, styles.divider]}>
            <Text style={styles.settingLabel}>Appearance</Text>
            <Segmented value={s.appearance} options={APPEARANCE_OPTIONS} onChange={(appearance) => s.set({ appearance })} />
          </View>
          <View style={[styles.switchRow, styles.divider]}>
            <Text style={styles.rowLabel}>Vibration</Text>
            <Switch
              value={s.haptics}
              onValueChange={(haptics) => s.set({ haptics })}
              trackColor={{ true: colors.gold, false: colors.line }}
              thumbColor={colors.text}
              ios_backgroundColor={colors.line}
            />
          </View>
        </Surface>

        <SectionHeader title="About" />
        <Surface style={styles.group}>
          <Row label="Sources and licences" onPress={() => router.push('/about')} />
          <Row label="Privacy" divider onPress={() => router.push('/privacy')} />
          <Row label="Terms of use" divider onPress={() => router.push('/terms')} />
          <Row
            label="Replay the intro"
            divider
            onPress={() => {
              s.set({ hintSeen: false });
              useApp.setState({ onboarded: false });
              router.replace('/onboarding');
            }}
          />
          {isDemo && s.premium && <Row label="Turn off Plus (demo)" divider onPress={() => s.set({ premium: false })} />}
          {__DEV__ && !s.premium && s.viewedToday > 0 && (
            <Row label="Reset today’s free cards (development)" divider onPress={() => useApp.setState({ viewedToday: 0 })} />
          )}
        </Surface>

        {!s.account && (
          <>
            <SectionHeader title="Account" />
            <Surface style={styles.group}>
              <Row label="Sign in" onPress={() => router.push('/sign-in')} />
            </Surface>
          </>
        )}

        {s.account && (
          <>
            <SectionHeader title="Account" />
            <Surface style={styles.group}>
              <View style={styles.account}>
                <Text style={styles.accountName}>{s.account.name ?? s.account.email ?? 'Signed in'}</Text>
                <Text style={styles.accountNote}>
                  {`Signed in with ${PROVIDERS[s.account.provider]}`}
                  {s.account.name && s.account.email ? ` · ${s.account.email}` : ''}
                </Text>
              </View>
              <Row
                label="Sign out"
                divider
                onPress={() =>
                  confirm('Sign out?', '', 'Sign out', () => {
                    signOut();
                  })
                }
              />
              <Row
                label="Delete account"
                divider
                danger
                onPress={() =>
                  confirm(
                    'Delete your account?',
                    `This erases your saved cards, reflections and streak. It doesn’t cancel Plus; do that in your ${STORE} settings.`,
                    'Delete',
                    () => {
                      deleteAccount();
                    },
                  )
                }
              />
            </Surface>
          </>
        )}
      </ScrollView>
    </View>
  );
}

type RowProps = { label: string; detail?: string; onPress: () => void; divider?: boolean; danger?: boolean };

function Row({ label, detail, onPress, divider, danger }: RowProps) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, divider && styles.divider, pressed && { opacity: 0.6 }]}>
      <Text style={[styles.rowLabel, danger && { color: colors.wrong }]}>{label}</Text>
      {detail && <Text style={styles.rowDetail}>{detail}</Text>}
      <Icon name="chevron-right" size={18} color={colors.faint} />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.page },
  content: { paddingHorizontal: layout.gutter, paddingBottom: 40, maxWidth: 600, width: '100%', alignSelf: 'center' },
  salam: { fontFamily: fonts.arabic, fontSize: 18, lineHeight: 32, color: colors.gold, textAlign: 'left' },
  title: { fontFamily: fonts.read, fontSize: 32, color: colors.text, marginBottom: layout.gap },
  streak: { paddingBottom: 16 },
  streakTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  streakNumber: { fontFamily: fonts.read, fontSize: 52, lineHeight: 60, color: colors.gold },
  streakLabel: { fontFamily: fonts.uiMedium, fontSize: 17, color: colors.text },
  streakNote: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 18, color: colors.quiet, marginTop: 2 },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  day: { alignItems: 'center', gap: 6 },
  dayDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  dayDotOn: { backgroundColor: colors.gold },
  dayDotToday: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.gold },
  dayLabel: { fontFamily: fonts.ui, fontSize: 12, color: colors.faint },
  pair: { flexDirection: 'row', gap: 12, marginTop: 12 },
  half: { flex: 1, minHeight: 150, justifyContent: 'flex-end' },
  ringValue: { fontFamily: fonts.uiMedium, fontSize: 18, color: colors.text, fontVariant: ['tabular-nums'] },
  halfLabel: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.text, marginTop: 12 },
  halfNote: { fontFamily: fonts.ui, fontSize: 12.5, lineHeight: 17, color: colors.quiet, marginTop: 2 },
  mood: { fontFamily: fonts.read, fontSize: 26, color: colors.gold, marginTop: 'auto' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '30%', flexGrow: 1, padding: 14 },
  tileValue: { fontFamily: fonts.uiMedium, fontSize: 24, color: colors.text, fontVariant: ['tabular-nums'] },
  tileLabel: { fontFamily: fonts.ui, fontSize: 12, color: colors.quiet, marginTop: 2 },
  names: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 },
  name: { width: '18.4%', aspectRatio: 1.25, borderRadius: 10, backgroundColor: colors.page, alignItems: 'center', justifyContent: 'center' },
  nameMet: { backgroundColor: colors.goldSoft },
  nameText: { fontFamily: fonts.arabic, fontSize: 14, lineHeight: 28, color: colors.gold },
  nameDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.line },
  plus: { marginTop: 30 },
  plusHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  plusTitle: { fontFamily: fonts.read, fontSize: 22, color: colors.text },
  plusBadge: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    letterSpacing: 0.4,
    color: colors.onGold,
    backgroundColor: colors.gold,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  plusBody: { fontFamily: fonts.ui, fontSize: 14.5, lineHeight: 21, color: colors.read, marginTop: 4 },
  group: { paddingVertical: 4 },
  setting: { paddingVertical: 14, gap: 10 },
  settingLabel: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.text },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', height: 52 },
  rowLabel: { flex: 1, fontFamily: fonts.uiMedium, fontSize: 15.5, color: colors.text },
  rowDetail: { fontFamily: fonts.ui, fontSize: 14.5, color: colors.quiet, marginRight: 6 },
  account: { paddingVertical: 14 },
  accountName: { fontFamily: fonts.uiMedium, fontSize: 16, color: colors.text },
  accountNote: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet, marginTop: 2 },
}));
