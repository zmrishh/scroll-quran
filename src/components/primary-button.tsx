import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { haptic } from '@/lib/feedback';
import { colors, fonts } from '@/theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** solid: gold with dark text. quiet: outlined. */
  tone?: 'solid' | 'quiet';
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, onPress, disabled, tone = 'solid', style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        haptic.medium();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        tone === 'solid' ? styles.solid : styles.quiet,
        { opacity: disabled ? 0.35 : pressed ? 0.8 : 1 },
        style,
      ]}>
      <Text style={[styles.label, { color: tone === 'solid' ? colors.page : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  solid: { backgroundColor: colors.gold },
  quiet: { borderWidth: 1, borderColor: colors.line },
  label: { fontFamily: fonts.uiMedium, fontSize: 16 },
});
