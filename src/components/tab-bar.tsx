import type { TabListProps, TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptic } from '@/lib/feedback';
import { TAB_BAR_HEIGHT } from '@/theme/layout';
import { makeStyles, useColors } from '@/theme/theme';
import { fonts } from '@/theme/tokens';

import { Icon, type IconName } from './icon';

/** A tab bar in the page colour, with no border, so it reads as part of the page. */
export function BottomBar({ children, ...props }: TabListProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View {...props} style={[styles.bar, { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      {children}
    </View>
  );
}

type ButtonProps = Omit<TabTriggerSlotProps, 'ref'> & { icon: IconName; label: string };

export function TabButton({ icon, label, isFocused, onPress, ...props }: ButtonProps) {
  const colors = useColors();
  const styles = useStyles();
  const color = isFocused ? colors.gold : colors.faint;
  return (
    <Pressable
      {...props}
      onPress={(e) => {
        if (!isFocused) haptic.tap();
        onPress?.(e);
      }}
      style={styles.button}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}>
      <Icon name={icon} size={21} color={color} strokeWidth={1.8} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  bar: { flexDirection: 'row', backgroundColor: colors.page },
  button: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontFamily: fonts.uiMedium, fontSize: 11 },
}));
