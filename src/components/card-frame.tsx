import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type HostInstance,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { colors, fonts } from '@/theme/tokens';

import { CardStyleLayer, useCardStyle } from './card-style';
import { Icon } from './icon';

const DOUBLE_TAP_MS = 260;

type Props = {
  height: number;
  contentTop: number;
  contentBottom: number;
  onDoubleTap?: () => void;
  /** Called with 'next' or 'prev' for taps on the right or left of the card. */
  onSingleTap?: (side: 'next' | 'prev') => void;
  shotRef?: Ref<HostInstance>;
  /** Shows the share watermark; only on while an image is being captured. */
  watermark?: boolean;
  children: ReactNode;
  overlay?: ReactNode;
};

/** A full-screen black page with its content centred and always fitting. */
export function CardFrame({ height, contentTop, contentBottom, onDoubleTap, onSingleTap, shotRef, watermark, children, overlay }: Props) {
  const { width } = useWindowDimensions();
  const look = useCardStyle();
  const lastTap = useRef(0);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [burstAt, setBurstAt] = useState({ x: 0, y: 0 });
  const burst = useSharedValue(0);
  const burstOpacity = useSharedValue(0);

  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current);
    },
    [],
  );

  const onPress = (e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    const now = Date.now();
    if (onDoubleTap && now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      if (pending.current) clearTimeout(pending.current);
      setBurstAt({ x: pageX, y: pageY });
      burst.set(0.4);
      burst.set(withSequence(withSpring(1.1, { damping: 10, stiffness: 260 }), withSpring(1, { damping: 14 })));
      burstOpacity.set(0.95);
      burstOpacity.set(withDelay(360, withTiming(0, { duration: 320 })));
      onDoubleTap();
      return;
    }
    lastTap.current = now;
    if (!onSingleTap) return;
    const side = pageX > width * 0.33 ? 'next' : 'prev';
    // Wait out the double-tap window so a like never also turns the page.
    if (onDoubleTap) pending.current = setTimeout(() => onSingleTap(side), DOUBLE_TAP_MS);
    else onSingleTap(side);
  };

  const burstStyle = useAnimatedStyle(() => ({ opacity: burstOpacity.value, transform: [{ scale: burst.value }] }));

  return (
    <View style={[styles.card, { height }]}>
      <Pressable onPress={onPress} style={StyleSheet.absoluteFill} accessible={false}>
        <View ref={shotRef} collapsable={false} style={[StyleSheet.absoluteFill, styles.card]}>
          <CardStyleLayer style={look} height={height} contentTop={contentTop} contentBottom={contentBottom} />
          <View style={[styles.content, { paddingTop: contentTop, paddingBottom: contentBottom }]}>
            <FitBox>{children}</FitBox>
          </View>
          {watermark && <Text style={styles.watermark}>Scroll Quran</Text>}
        </View>
      </Pressable>
      {overlay}
      <Animated.View pointerEvents="none" style={[styles.burst, { left: burstAt.x - 48, top: burstAt.y - 48 }, burstStyle]}>
        <Icon name="heart" size={96} color={colors.gold} filled strokeWidth={0} />
      </Animated.View>
    </View>
  );
}

/** Centres its children and scales them down (never up) when a passage is too long to fit. */
function FitBox({ children }: { children: ReactNode }) {
  const [box, setBox] = useState(0);
  const [natural, setNatural] = useState(0);
  const scale = box && natural > box ? Math.max(0.6, box / natural) : 1;
  return (
    <View style={styles.fitOuter} onLayout={(e: LayoutChangeEvent) => setBox(e.nativeEvent.layout.height)}>
      <View style={{ transform: [{ scale }] }} onLayout={(e: LayoutChangeEvent) => setNatural(e.nativeEvent.layout.height)}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.page, overflow: 'hidden' },
  content: { flex: 1, paddingHorizontal: 28 },
  fitOuter: { flex: 1, justifyContent: 'center' },
  burst: { position: 'absolute', width: 96, height: 96 },
  watermark: { position: 'absolute', left: 28, top: 28, fontFamily: fonts.uiMedium, fontSize: 14, color: colors.quiet },
});
