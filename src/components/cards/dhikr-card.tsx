import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import type { Dhikr } from '@/data/content';
import { haptic } from '@/lib/feedback';
import { useApp } from '@/store/app-store';
import { colors, fonts } from '@/theme/tokens';

const RING = 210;
const RADIUS = 92;

/** Dhikr with a 33-bead tasbih: each tap fills a bead; every 11th bead is a little larger. */
export function DhikrCard({ dhikr }: { dhikr: Dhikr }) {
  const [count, setCount] = useState(0);
  const addDhikr = useApp((s) => s.addDhikr);
  const pulse = useSharedValue(1);
  const done = count >= dhikr.target;

  const onTap = () => {
    if (done) {
      setCount(0);
      haptic.soft();
      return;
    }
    const next = count + 1;
    setCount(next);
    addDhikr(1);
    pulse.set(withSequence(withTiming(0.96, { duration: 60 }), withSpring(1, { damping: 10, stiffness: 320 })));
    if (next === dhikr.target) haptic.success();
    else if (next % 11 === 0) haptic.medium();
    else haptic.tap();
  };

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <>
      <Text style={styles.arabic}>{dhikr.arabic}</Text>
      <Text style={styles.translit}>{dhikr.translit}</Text>
      <Text style={styles.meaning}>{dhikr.meaning}</Text>

      <Pressable onPress={onTap} accessibilityRole="button" accessibilityLabel={`Count ${dhikr.translit}`} style={styles.ringPress}>
        <Animated.View style={[styles.ring, pulseStyle]}>
          <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
            {Array.from({ length: dhikr.target }, (_, i) => {
              const a = (i / dhikr.target) * Math.PI * 2 - Math.PI / 2;
              const big = (i + 1) % 11 === 0;
              return (
                <Circle
                  key={i}
                  cx={RING / 2 + RADIUS * Math.cos(a)}
                  cy={RING / 2 + RADIUS * Math.sin(a)}
                  r={big ? 5.5 : 4}
                  fill={i < count ? colors.gold : colors.line}
                />
              );
            })}
          </Svg>
          <Text style={styles.count}>{count}</Text>
          <Text style={styles.of}>{done ? 'done' : `of ${dhikr.target}`}</Text>
        </Animated.View>
      </Pressable>
      <View style={styles.hintRow}>
        <Text style={styles.hint}>{done ? 'Alhamdulillah. Tap to begin again.' : 'Tap the circle to count'}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  arabic: { fontFamily: fonts.arabic, fontSize: 40, lineHeight: 82, color: colors.text, textAlign: 'right', writingDirection: 'rtl' },
  translit: { fontFamily: fonts.uiMedium, fontSize: 18, color: colors.text, marginTop: 4 },
  meaning: { fontFamily: fonts.read, fontSize: 17, lineHeight: 25, color: colors.read, marginTop: 4 },
  ringPress: { alignSelf: 'center', marginTop: 34 },
  ring: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  count: { fontFamily: fonts.ui, fontSize: 56, lineHeight: 62, color: colors.text, fontVariant: ['tabular-nums'] },
  of: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet },
  hintRow: { alignItems: 'center', marginTop: 12 },
  hint: { fontFamily: fonts.ui, fontSize: 13, color: colors.faint },
});
