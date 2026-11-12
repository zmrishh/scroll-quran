import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, Text, View, type HostInstance, type StyleProp, type TextStyle } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';

import { useColors } from '@/theme/theme';

// The soft edge of the pen, and how quickly it moves along a line.
const EDGE = 28;
const MS_PER_PX = 1.35;

type Line = { x: number; y: number; width: number; height: number };
type Props = { children: ReactNode; style?: StyleProp<TextStyle>; delay?: number };

/**
 * Text that writes itself in, one line after another and left to right, the way the Basmala is written on the
 * launch screen. A cover in the page colour slides off each line with a soft leading edge, so it only works on the
 * plain page. With Reduce Motion it fades in instead.
 */
export function InkText({ children, style, delay = 0 }: Props) {
  const reduce = useReducedMotion();
  // The measured lines, or 'plain' if they never arrive, in which case the words show without the writing.
  // Whichever comes first stays.
  const [layout, setLayout] = useState<Line[] | 'plain' | null>(null);
  const lines = Array.isArray(layout) ? layout : null;
  const settle = (next: Line[] | 'plain') => setLayout((now) => now ?? next);
  const clock = useSharedValue(0);
  const boxRef = useRef<HostInstance>(null);
  const total = lines ? lines.reduce((t, l) => t + (l.width + EDGE) * MS_PER_PX, 0) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setLayout((now) => now ?? 'plain'), 900);
    return () => clearTimeout(timer);
  }, []);

  // Browsers don't report lines, so there the whole block is written as one, measured once it's on the page.
  useEffect(() => {
    if (Platform.OS !== 'web' || reduce) return;
    // It can take a few frames for the screen to be laid out, so look until it has a size.
    let frame = 0;
    const look = () => {
      const r = (boxRef.current as unknown as HTMLElement | null)?.getBoundingClientRect();
      if (r?.width) setLayout((now) => now ?? [{ x: 0, y: 0, width: r.width, height: r.height }]);
      else frame = requestAnimationFrame(look);
    };
    frame = requestAnimationFrame(look);
    return () => cancelAnimationFrame(frame);
  }, [reduce]);

  useEffect(() => {
    if (!lines || reduce) return;
    clock.set(0);
    clock.set(withDelay(delay, withTiming(total, { duration: total, easing: Easing.linear })));
  }, [lines, total, delay, reduce, clock]);

  if (reduce) {
    return (
      <Animated.Text entering={FadeIn.delay(delay).duration(500)} style={style}>
        {children}
      </Animated.Text>
    );
  }

  // Each line starts when the one before it ends.
  const parts = (lines ?? []).reduce<{ line: Line; start: number; duration: number }[]>((list, line) => {
    const before = list[list.length - 1];
    return [...list, { line, start: before ? before.start + before.duration : 0, duration: (line.width + EDGE) * MS_PER_PX }];
  }, []);

  return (
    <View ref={boxRef} style={styles.box}>
      <Text
        style={[style, !layout && styles.hidden]}
        onTextLayout={(e) => {
          settle(e.nativeEvent.lines.map(({ x, y, width, height }) => ({ x, y, width, height })));
        }}>
        {children}
      </Text>
      {parts.map((p, i) => (
        <Cover key={i} clock={clock} line={p.line} start={p.start} duration={p.duration} />
      ))}
    </View>
  );
}

function Cover({ clock, line, start, duration }: { clock: SharedValue<number>; line: Line; start: number; duration: number }) {
  const colors = useColors();
  const style = useAnimatedStyle(() => {
    const x = Math.min(1, Math.max(0, (clock.get() - start) / duration));
    const eased = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    return { transform: [{ translateX: eased * (line.width + EDGE) }] };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.cover, { left: line.x - EDGE, top: line.y, width: line.width + EDGE * 2, height: line.height }, style]}>
      <LinearGradient
        colors={[`rgba(${colors.pageRgb},0)`, colors.page]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: EDGE }}
      />
      <View style={{ flex: 1, backgroundColor: colors.page }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
  hidden: { opacity: 0 },
  cover: { position: 'absolute', flexDirection: 'row' },
});
