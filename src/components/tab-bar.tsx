import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { usePathname } from 'expo-router';
import type { TabListProps, TabTriggerSlotProps } from 'expo-router/ui';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptic } from '@/lib/feedback';
import { TAB_BAR } from '@/theme/layout';
import { makeStyles, useColors } from '@/theme/theme';
import { fonts } from '@/theme/tokens';

import { Icon, type IconName } from './icon';

// The tabs in order, by route, so the highlight knows where to sit.
const ROUTES = ['/', '/quran', '/saved', '/you'];
// Space between the capsule's edge and the highlight inside it.
const INSET = 5;
// Real Liquid Glass on iOS 26; anywhere else, a frosted capsule drawn in the page's colours.
const GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

/**
 * The tab bar as iOS 26 draws it: a capsule floating just above the home indicator, with a highlight that slides on
 * a spring to the tab you pick. `active` sets the tab directly, for previews that aren't on a real route.
 */
export function BottomBar({ children, active, ...props }: TabListProps & { active?: number }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const fromRoute = ROUTES.findIndex((r) => (r === '/' ? pathname === '/' : pathname.startsWith(r)));
  const index = active ?? Math.max(0, fromRoute);
  const [width, setWidth] = useState(0);
  const x = useSharedValue(index);

  useEffect(() => {
    x.set(withSpring(index, { damping: 18, stiffness: 230, mass: 0.7 }));
  }, [index, x]);

  const slot = (width - INSET * 2) / ROUTES.length;
  const lens = useAnimatedStyle(() => ({ width: slot, transform: [{ translateX: INSET + x.get() * slot }] }));

  const capsule = (
    <>
      {width > 0 && <Animated.View pointerEvents="none" style={[styles.lens, lens]} />}
      <View {...props} style={styles.row}>
        {children}
      </View>
    </>
  );

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom - 8, 12) }]}>
      {GLASS ? (
        <GlassView glassEffectStyle="regular" style={styles.capsule} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {capsule}
        </GlassView>
      ) : (
        <View style={[styles.capsule, styles.frosted]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {capsule}
        </View>
      )}
    </View>
  );
}

type ButtonProps = Omit<TabTriggerSlotProps, 'ref'> & { icon: IconName; label: string };

export function TabButton({ icon, label, isFocused, onPress, ...props }: ButtonProps) {
  const colors = useColors();
  const styles = useStyles();
  const color = isFocused ? colors.gold : colors.quiet;
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
      <Icon name={icon} size={22} color={color} strokeWidth={isFocused ? 2 : 1.8} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  // Floats over the screen below it, with nothing behind the capsule, so the page shows through around it.
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: TAB_BAR.gap, paddingHorizontal: 20 },
  capsule: { height: TAB_BAR.height, borderRadius: TAB_BAR.height / 2 },
  frosted: {
    backgroundColor: `rgba(${colors.raisedRgb},0.94)`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    shadowColor: '#000',
    shadowOpacity: colors.scheme === 'dark' ? 0.35 : 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  lens: {
    position: 'absolute',
    top: INSET,
    bottom: INSET,
    borderRadius: (TAB_BAR.height - INSET * 2) / 2,
    backgroundColor: `rgba(${colors.textRgb},0.07)`,
  },
  row: { flex: 1, flexDirection: 'row' },
  button: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontFamily: fonts.uiMedium, fontSize: 10.5 },
}));
