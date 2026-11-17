import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';

import { DocScreen } from '@/components/doc';
import { Icon } from '@/components/icon';
import { ARABIC, LIGHT, Light, usePrayerInk } from '@/components/prayer-card';
import { Segmented } from '@/components/segmented';
import { SectionHeader, Surface } from '@/components/ui';
import { haptic } from '@/lib/feedback';
import {
  clock,
  locate,
  METHODS,
  methodName,
  regionalMethod,
  SALAH_KEYS,
  schedule,
  until,
  type AsrSchool,
  type LocateResult,
  type MethodId,
  type SalahKey,
} from '@/lib/prayer';
import { testPrayerAlert, turnOnPrayerAlerts, useAlertProblem, type AlertProblem } from '@/lib/prayer-alerts';
import { openPaywall } from '@/lib/upsell';
import { useApp } from '@/store/app-store';
import { makeStyles, PaletteOverride, useColors } from '@/theme/theme';
import { eyebrow, fonts, layout } from '@/theme/tokens';

const ASR_OPTIONS: { id: AsrSchool; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'hanafi', label: 'Hanafi' },
];

const NAMES: Record<SalahKey, string> = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const ALL_ON: Record<SalahKey, boolean> = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };

const PROBLEMS: Record<AlertProblem, { text: string; settings: boolean }> = {
  notifications: { text: 'Notifications are off for Scroll Quran. Turn them on in Settings.', settings: true },
  location: { text: 'Alerts need your location to work out the times. Allow it in Settings.', settings: true },
  unavailable: { text: 'Prayer alerts work in the app on your phone.', settings: false },
};

const joinNames = (names: string[]) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/** Today's five prayers with a bell on each, the alerts switch, and how the times are worked out. */
export default function PrayerTimesScreen() {
  const colors = useColors();
  const styles = useStyles();
  const chosen = useApp((s) => s.prayerMethod);
  const asr = useApp((s) => s.asrSchool);
  const place = useApp((s) => s.prayerPlace);
  const plus = useApp((s) => s.premium);
  const alertsOn = useApp((s) => s.premium && s.prayerAlerts);
  const alertPrayers = useApp((s) => s.alertPrayers);
  const problem = useAlertProblem((s) => s.problem);
  const [now, setNow] = useState(() => new Date());
  const [busy, setBusy] = useState(false);
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [booked, setBooked] = useState<number | null>(null);
  const regional = regionalMethod();
  const ink = usePrayerInk();
  const picked = SALAH_KEYS.filter((k) => alertPrayers[k]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => {
      clearInterval(timer);
      // A note from this visit doesn't carry over to the next.
      useAlertProblem.setState({ problem: null });
    };
  }, []);

  // Free users go to Plus first, and alerts come on once they've bought it.
  const turnOn = async () => {
    if (!plus) {
      openPaywall('alerts');
      return;
    }
    if (busy) return;
    setBusy(true);
    if (await turnOnPrayerAlerts()) haptic.success();
    setBusy(false);
  };

  const switchAlerts = (on: boolean) => {
    haptic.tap();
    if (on) turnOn();
    else useApp.getState().set({ prayerAlerts: false });
  };

  // A bell turns alerts on when they're off, and otherwise its own prayer. Silencing the last one turns alerts off,
  // ready to start again with all five.
  const ring = (key: SalahKey) => {
    haptic.tap();
    if (!alertsOn) {
      turnOn();
      return;
    }
    const next = { ...alertPrayers, [key]: !alertPrayers[key] };
    if (SALAH_KEYS.some((k) => next[k])) useApp.getState().set({ alertPrayers: next });
    else useApp.getState().set({ prayerAlerts: false, alertPrayers: ALL_ON });
  };

  const pick = (id: MethodId | null) => {
    haptic.tap();
    useApp.getState().set({ prayerMethod: id });
    setMethodsOpen(false);
  };

  return (
    <DocScreen title="Prayer times" meta={now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}>
      {/* The day's card is a window of light, dark in both themes, in the same colours as the one on the Quran tab. */}
      <PaletteOverride.Provider value={ink}>
        {place ? (
          <DayCard place={place} method={chosen ?? regional} asr={asr} now={now} bells={alertsOn ? alertPrayers : null} onBell={ring} />
        ) : (
          <PlacePrompt />
        )}
      </PaletteOverride.Provider>

      <Surface style={[styles.group, styles.first]}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.labelRow}>
              <Text style={styles.switchLabel}>Prayer alerts</Text>
              {!plus && <Text style={styles.plusTag}>Plus</Text>}
            </View>
            <Text style={styles.rowNote}>
              {alertsOn
                ? picked.length === SALAH_KEYS.length
                  ? 'All five prayers'
                  : joinNames(picked.map((k) => NAMES[k]))
                : 'A notification at each prayer time'}
            </Text>
          </View>
          <Switch
            value={alertsOn}
            disabled={busy}
            onValueChange={switchAlerts}
            trackColor={{ true: colors.gold, false: colors.line }}
            thumbColor={colors.text}
            ios_backgroundColor={colors.line}
          />
        </View>

        {problem && (
          <Pressable
            disabled={!PROBLEMS[problem].settings}
            onPress={() => Linking.openSettings().catch(() => {})}
            style={[styles.problem, styles.divider]}
            accessibilityRole={PROBLEMS[problem].settings ? 'button' : 'text'}>
            <Text style={styles.problemText}>{PROBLEMS[problem].text}</Text>
          </Pressable>
        )}

        {__DEV__ && alertsOn && (
          <Pressable onPress={async () => setBooked(await testPrayerAlert())} style={[styles.row, styles.divider]}>
            <Text style={styles.devText}>Test alert in 10 seconds (development){booked === null ? '' : ` · ${booked} booked`}</Text>
          </Pressable>
        )}
      </Surface>

      <SectionHeader title="Calculation" />
      <Surface style={styles.group}>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Asr</Text>
          <Segmented value={asr} options={ASR_OPTIONS} onChange={(asrSchool) => useApp.getState().set({ asrSchool })} />
        </View>

        <Pressable
          onPress={() => {
            haptic.tap();
            setMethodsOpen((o) => !o);
          }}
          accessibilityRole="button"
          accessibilityState={{ expanded: methodsOpen }}
          style={({ pressed }) => [styles.row, styles.divider, pressed && { opacity: 0.6 }]}>
          <Text style={styles.rowLabel}>Method</Text>
          <Text style={styles.rowDetail} numberOfLines={1}>
            {chosen ? methodName(chosen) : 'Automatic'}
          </Text>
          <Icon name={methodsOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.faint} />
        </Pressable>
        {methodsOpen && (
          <View style={styles.methods}>
            <Option label="Automatic" detail={methodName(regional)} on={chosen === null} onPress={() => pick(null)} />
            {METHODS.map((m) => (
              <Option key={m.id} label={m.name} on={chosen === m.id} onPress={() => pick(m.id)} />
            ))}
          </View>
        )}

        <Pressable
          onPress={async () => {
            if ((await locate(true)) === 'ok') haptic.success();
          }}
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, styles.divider, pressed && { opacity: 0.6 }]}>
          <Text style={styles.rowLabel}>Update my location</Text>
          <Icon name="chevron-right" size={18} color={colors.faint} />
        </Pressable>
      </Surface>
    </DocScreen>
  );
}

type DayProps = {
  place: { lat: number; lng: number };
  method: MethodId;
  asr: AsrSchool;
  now: Date;
  /** Which prayers have an alert, or null while alerts are off. */
  bells: Record<SalahKey, boolean> | null;
  onBell: (key: SalahKey) => void;
};

/** The day's five prayers in the light of the next one: past ones fade, the next is in gold, each has its bell. */
function DayCard({ place, method, asr, now, bells, onBell }: DayProps) {
  // The Arabic names step aside on narrow phones, so each time keeps its line.
  const roomy = useWindowDimensions().width >= 360;
  const colors = useColors();
  const day = useDay();
  const { today, next } = schedule(place, method, asr, now);

  return (
    <Light index={LIGHT[next.key]} style={day.card}>
      <View style={day.head}>
        <Text style={day.eyebrow}>Today</Text>
        <Text style={day.next}>
          {next.name} {until(next.at, now)}
        </Text>
      </View>

      {today.map((p) => {
        const isNext = p.at.getTime() === next.at.getTime();
        const past = p.at <= now;
        const on = !!bells?.[p.key];
        return (
          <View key={p.key} style={day.row}>
            <View style={[day.nameBox, past && day.past]}>
              <Text style={[day.name, isNext && day.gold]}>{p.name}</Text>
              {roomy && <Text style={day.arabic}>{ARABIC[p.name]}</Text>}
            </View>
            <Text style={[day.time, isNext && day.gold, past && day.past]}>{clock(p.at)}</Text>
            <Pressable
              onPress={() => onBell(p.key)}
              accessibilityRole="switch"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${p.name} alert`}
              style={({ pressed }) => [day.bell, pressed && { opacity: 0.5 }]}>
              <Icon name="bell" size={18} color={on ? colors.gold : `rgba(${colors.textRgb},0.38)`} filled={on} strokeWidth={1.8} />
            </Pressable>
          </View>
        );
      })}
    </Light>
  );
}

/** Before a place is known: one tap reads it, or sends someone who said no to Settings. */
function PlacePrompt() {
  const day = useDay();
  const [status, setStatus] = useState<LocateResult | null>(null);
  const blocked = status === 'blocked';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={async () => (blocked ? Linking.openSettings().catch(() => {}) : setStatus(await locate(true)))}>
      {({ pressed }) => (
        <Light index={0} style={[day.card, day.prompt, pressed && { opacity: 0.85 }]}>
          <Text style={day.eyebrow}>Today</Text>
          <View style={day.promptRow}>
            <Text style={day.promptTitle}>{blocked ? 'Allow location in Settings' : 'Show today’s prayers'}</Text>
            <Text style={day.promptArrow}>→</Text>
          </View>
        </Light>
      )}
    </Pressable>
  );
}

function Option({ label, detail, on, onPress }: { label: string; detail?: string; on: boolean; onPress: () => void }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && { opacity: 0.6 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, on && { color: colors.text }]}>{label}</Text>
        {detail && <Text style={styles.optionDetail}>{detail}</Text>}
      </View>
      <View style={[styles.radio, on && styles.radioOn]}>{on && <Icon name="check" size={12} color={colors.page} strokeWidth={3} />}</View>
    </Pressable>
  );
}

const useDay = makeStyles((night) => ({
  card: { borderRadius: layout.radius.lg, overflow: 'hidden', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6, marginTop: 20, backgroundColor: night.raised },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  eyebrow: { ...eyebrow, color: night.gold },
  next: { flexShrink: 1, fontFamily: fonts.readItalic, fontSize: 15, color: night.read, textAlign: 'right' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: `rgba(${night.textRgb},0.14)`,
  },
  nameBox: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  name: { fontFamily: fonts.read, fontSize: 20, color: night.text },
  arabic: { fontFamily: fonts.arabic, fontSize: 16, lineHeight: 32, color: night.gold, opacity: 0.8 },
  time: { fontFamily: fonts.uiMedium, fontSize: 16, color: night.text, fontVariant: ['tabular-nums'] },
  gold: { color: night.gold },
  past: { opacity: 0.45 },
  bell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: 6, marginRight: -12 },
  prompt: { paddingBottom: 22 },
  promptRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  promptTitle: { flex: 1, fontFamily: fonts.read, fontSize: 24, color: night.text },
  promptArrow: { fontFamily: fonts.read, fontSize: 24, color: night.gold },
}));

const useStyles = makeStyles((colors) => ({
  group: { paddingVertical: 4 },
  first: { marginTop: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontFamily: fonts.uiMedium, fontSize: 15.5, color: colors.text },
  rowLabel: { flex: 1, fontFamily: fonts.uiMedium, fontSize: 15.5, color: colors.text },
  plusTag: {
    fontFamily: fonts.uiSemi,
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.gold,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  rowNote: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet, marginTop: 3 },
  problem: { paddingVertical: 12 },
  problemText: { fontFamily: fonts.ui, fontSize: 13.5, lineHeight: 19, color: colors.gold },
  devText: { flex: 1, fontFamily: fonts.ui, fontSize: 13, color: colors.quiet },
  setting: { paddingVertical: 14, gap: 10 },
  settingLabel: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 52 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  rowDetail: { flexShrink: 1, maxWidth: '60%', fontFamily: fonts.ui, fontSize: 14.5, color: colors.quiet },
  methods: { paddingBottom: 6 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 50,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  optionLabel: { fontFamily: fonts.read, fontSize: 16, color: colors.read },
  optionDetail: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.quiet, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.faint, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.gold, borderColor: colors.gold },
}));
