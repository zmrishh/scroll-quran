import { Pressable, StyleSheet, Text, View } from 'react-native';

import { haptic } from '@/lib/feedback';
import { colors, fonts } from '@/theme/tokens';

type Props<T extends string> = { value: T; options: readonly { id: T; label: string }[]; onChange: (v: T) => void };

/** A small segmented control: a sunken track with the chosen option lit in gold. */
export function Segmented<T extends string>({ value, options, onChange }: Props<T>) {
  return (
    <View style={styles.track}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (on) return;
              haptic.tap();
              onChange(o.id);
            }}
            style={[styles.seg, on && styles.segOn]}>
            <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: colors.page, borderRadius: 11, padding: 3 },
  seg: { flex: 1, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segOn: { backgroundColor: colors.goldSoft },
  label: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.quiet },
  labelOn: { color: colors.gold },
});
