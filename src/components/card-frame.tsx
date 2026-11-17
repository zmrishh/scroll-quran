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

import { cardStyle } from '@/data/styles';
import { makeStyles, PaletteOverride, useColors } from '@/theme/theme';
import { fonts, layout } from '@/theme/tokens';

import { CardStyleLayer, Folio, paletteFor, SceneShade, useCardStyle } from './card-style';
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
  /** The card's content key: picks its Glow background, or which of its world's scenes it's set in. */
  seed?: string;
  /** Shows the share watermark; only on while an image is being captured. */
  watermark?: boolean;
  children: ReactNode;
  overlay?: ReactNode;
};

/**
 * A full-screen card in the style it's shown in. That is the reader's own style, except in previews, which may show
 * another; so the card sets its own colours: the style's world, or the app's light or dark theme if it has none.
 */
export function CardFrame(props: Props) {
  const palette = paletteFor(useCardStyle());
  // Scripture (not quizzes or check-ins) is set like a poster in a world: centred in the scene's light.
  const scripture = /^(preview:)?(ayah|dua|name|dhikr):/.test(props.seed ?? '');
  return (
    <PaletteOverride.Provider value={palette ?? 'base'}>
      <Folio.Provider value={!!palette && scripture}>
        <Frame {...props} />
      </Folio.Provider>
    </PaletteOverride.Provider>
  );
}

/** A full-screen page with its content centred and always fitting. */
function Frame({ height, contentTop, contentBottom, onDoubleTap, onSingleTap, shotRef, seed, watermark, children, overlay }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const look = useCardStyle();
  // In a world, the scene is shaded softly behind the words, wherever they turn out to sit.
  const scene = !!cardStyle(look).world;
  // The height the content has, and the height it takes.
  const [box, setBox] = useState(0);
  const [body, setBody] = useState(0);
  const scale = box && body > box ? Math.max(0.6, box / body) : 1;
  const wordsTop = contentTop + Math.max(0, (box - body * scale) / 2);
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
          <CardStyleLayer style={look} seed={seed} />
          {scene && box > 0 && body > 0 && <SceneShade top={wordsTop} height={Math.min(box, body * scale)} head={contentTop} foot={contentBottom} />}
          <View style={[styles.content, { paddingTop: contentTop, paddingBottom: contentBottom }]}>
            <View style={styles.fitOuter} onLayout={(e: LayoutChangeEvent) => setBox(e.nativeEvent.layout.height)}>
              {/* Scaled down (never up) when a passage is too long to fit. */}
              <View style={{ transform: [{ scale }] }}>
                <View onLayout={(e: LayoutChangeEvent) => setBody(e.nativeEvent.layout.height)}>{children}</View>
              </View>
            </View>
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

const useStyles = makeStyles((colors) => ({
  card: { backgroundColor: colors.page, overflow: 'hidden' },
  content: { flex: 1, paddingHorizontal: layout.gutter },
  fitOuter: { flex: 1, justifyContent: 'center' },
  burst: { position: 'absolute', width: 96, height: 96 },
  watermark: { position: 'absolute', left: 28, top: 28, fontFamily: fonts.uiMedium, fontSize: 14, color: colors.quiet },
}));
