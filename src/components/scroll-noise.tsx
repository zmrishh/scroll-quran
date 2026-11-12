import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { makeStyles, useColors } from '@/theme/theme';

const POST = 330;
const POSTS = 4;
const FLICK_MS = 620;
const REST_MS = 520;

/**
 * The feeds we all know, drawn as faint empty posts flicked past one at a time behind the opening lines. When `on`
 * turns off they slow to a stop and fade, which is the point the story makes.
 */
export function ScrollNoise({ on }: { on: boolean }) {
  const colors = useColors();
  const styles = useStyles();
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (on) {
      fade.set(withTiming(1, { duration: 900 }));
      if (reduce) return;
      // One flick per post, a pause, then the next; after a full set it jumps back to an identical place.
      const flicks = Array.from({ length: POSTS }, (_, i) =>
        withDelay(REST_MS, withTiming(-(i + 1) * POST, { duration: FLICK_MS, easing: Easing.out(Easing.cubic) })),
      );
      y.set(withRepeat(withSequence(...flicks, withTiming(0, { duration: 0 })), -1));
    } else {
      cancelAnimation(y);
      y.set(withTiming(y.get() - POST * 0.45, { duration: 1600, easing: Easing.out(Easing.quad) }));
      fade.set(withTiming(0, { duration: 1600, easing: Easing.in(Easing.quad) }));
    }
  }, [on, reduce, y, fade]);

  const layer = useAnimatedStyle(() => ({ opacity: fade.get() }));
  const move = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.wrap, layer]}>
      <Animated.View style={move}>
        {Array.from({ length: POSTS * 2 + 1 }, (_, i) => (
          <View key={i} style={styles.post}>
            <View style={styles.head}>
              <View style={styles.avatar} />
              <View style={[styles.bar, { width: 96 }]} />
            </View>
            <View style={styles.media} />
            <View style={[styles.bar, { width: '78%', marginTop: 14 }]} />
            <View style={[styles.bar, { width: '46%', marginTop: 8 }]} />
          </View>
        ))}
      </Animated.View>
      <LinearGradient
        colors={[colors.page, `rgba(${colors.pageRgb},0)`, `rgba(${colors.pageRgb},0)`, colors.page]}
        locations={[0, 0.22, 0.78, 1]}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { overflow: 'hidden', paddingHorizontal: 40 },
  post: { height: POST, paddingTop: 22, opacity: 0.075 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.text },
  bar: { height: 9, borderRadius: 5, backgroundColor: colors.text },
  media: { height: 200, borderRadius: 14, backgroundColor: colors.text },
}));
