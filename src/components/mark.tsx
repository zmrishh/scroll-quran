import { useEffect, useId } from 'react';
import { Platform } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Geometry in a 100×100 box, matching the app icon: two squares whose corners sit 40 from the centre.
const R = 40;
const W = R * 0.14;
const H = R / Math.SQRT2;
const PERIMETER = 8 * H;
const DOT = R * 0.2;

type Props = {
  size: number;
  /** Draws the squares stroke by stroke, then drops the dot in. */
  draw?: boolean;
  delay?: number;
  duration?: number;
};

/** The ۞ mark from the app icon: two interlaced squares with a dot at the centre. */
export function Mark({ size, draw = false, delay = 0, duration = 1100 }: Props) {
  const id = `mark${useId().replace(/:/g, '')}`;
  // Animated SVG props don't reach react-native-svg on web, so the web version is drawn already finished.
  const animate = draw && Platform.OS !== 'web';
  const progress = useSharedValue(animate ? 0 : 1);
  const dot = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    progress.set(withDelay(delay, withTiming(1, { duration, easing: Easing.inOut(Easing.cubic) })));
    dot.set(withDelay(delay + duration * 0.75, withTiming(1, { duration: 380, easing: Easing.out(Easing.back(2.2)) })));
  }, [animate, delay, duration, progress, dot]);

  const first = useAnimatedProps(() => ({ strokeDashoffset: PERIMETER * (1 - progress.get()) }));
  // The second square starts a beat later, so the two read as drawn one after the other.
  const second = useAnimatedProps(() => ({ strokeDashoffset: PERIMETER * (1 - Math.min(1, Math.max(0, progress.get() * 1.25 - 0.25))) }));
  const center = useAnimatedProps(() => ({ r: DOT * dot.get() }));

  const square = { x: 50 - H, y: 50 - H, width: 2 * H, height: 2 * H, rx: W * 0.35, fill: 'none', stroke: `url(#${id})`, strokeWidth: W, strokeLinejoin: 'round' as const };

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={id} x1="0" y1={50 - R} x2="0" y2={50 + R} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#E2C27E" />
          <Stop offset="1" stopColor="#B48C47" />
        </LinearGradient>
      </Defs>
      {animate ? (
        <>
          <AnimatedRect {...square} strokeDasharray={PERIMETER} animatedProps={first} />
          <AnimatedRect {...square} strokeDasharray={PERIMETER} transform="rotate(45 50 50)" animatedProps={second} />
          <AnimatedCircle cx={50} cy={50} fill={`url(#${id})`} animatedProps={center} />
        </>
      ) : (
        <>
          <Rect {...square} />
          <Rect {...square} transform="rotate(45 50 50)" />
          <Circle cx={50} cy={50} r={DOT} fill={`url(#${id})`} />
        </>
      )}
    </Svg>
  );
}
