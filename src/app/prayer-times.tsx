import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Block, DocScreen } from '@/components/doc';
import { Icon } from '@/components/icon';
import { Segmented } from '@/components/segmented';
import { haptic } from '@/lib/feedback';
import { locate, METHODS, methodName, regionalMethod, type AsrSchool, type MethodId } from '@/lib/prayer';
import { useApp } from '@/store/app-store';
import { colors, fonts } from '@/theme/tokens';

const ASR_OPTIONS: { id: AsrSchool; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'hanafi', label: 'Hanafi' },
];

/** How prayer times are worked out: the calculation method, the Asr school, and refreshing the place. */
export default function PrayerTimesSettings() {
  const chosen = useApp((s) => s.prayerMethod);
  const asr = useApp((s) => s.asrSchool);
  const regional = regionalMethod();

  const pick = (id: MethodId | null) => {
    haptic.tap();
    useApp.getState().set({ prayerMethod: id });
  };

  return (
    <DocScreen title="Prayer times">
      <Block title="Asr">
        <View style={styles.segment}>
          <Segmented value={asr} options={ASR_OPTIONS} onChange={(asrSchool) => useApp.getState().set({ asrSchool })} />
        </View>
      </Block>

      <Block title="Calculation method">
        <View style={styles.list}>
          <Option label="Automatic" detail={methodName(regional)} on={chosen === null} onPress={() => pick(null)} />
          {METHODS.map((m) => (
            <Option key={m.id} label={m.name} on={chosen === m.id} onPress={() => pick(m.id)} />
          ))}
        </View>
      </Block>

      <Pressable
        onPress={async () => {
          if ((await locate(true)) === 'ok') haptic.success();
        }}
        style={styles.update}>
        <Text style={styles.updateText}>Update my location</Text>
        <Icon name="chevron-right" size={16} color={colors.text} />
      </Pressable>
    </DocScreen>
  );
}

function Option({ label, detail, on, onPress }: { label: string; detail?: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={onPress} style={({ pressed }) => [styles.option, pressed && { opacity: 0.6 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, on && { color: colors.text }]}>{label}</Text>
        {detail && <Text style={styles.optionDetail}>{detail}</Text>}
      </View>
      <View style={[styles.radio, on && styles.radioOn]}>{on && <Icon name="check" size={12} color={colors.page} strokeWidth={3} />}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segment: { marginTop: 4 },
  list: { marginTop: 2 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  optionLabel: { fontFamily: fonts.read, fontSize: 16.5, color: colors.read },
  optionDetail: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.quiet, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.faint, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  update: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 24 },
  updateText: { fontFamily: fonts.uiMedium, fontSize: 15, color: colors.text },
});
