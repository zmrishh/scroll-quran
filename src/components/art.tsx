import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { ART, type ArtKey } from '@/data/art';
import { makeStyles, useColors } from '@/theme/theme';
import { fonts } from '@/theme/tokens';

type Props = {
  art: ArtKey;
  style?: StyleProp<ViewStyle>;
  /** How far down the page colour fades in: 'edge' just softens the bottom, 'deep' leaves room for text over the art. */
  fade?: 'edge' | 'deep';
  /** Where the museum caption sits, or none. */
  caption?: 'top' | 'bottom' | false;
  /** Adds space above a top caption, for the status bar. */
  inset?: number;
};

/** A piece of manuscript illumination that drifts very slowly, fading into the page. */
export function ArtPanel({ art, style, fade = 'edge', caption = 'bottom', inset = 0 }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const piece = ART[art];
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.set(withRepeat(withTiming(1, { duration: 16000, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [drift]);

  const moving = useAnimatedStyle(() => ({
    transform: [{ scale: 1.04 + 0.06 * drift.get() }, { translateY: -8 * drift.get() }],
  }));

  return (
    <View style={[styles.frame, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, moving]}>
        <Image source={piece.source} contentFit="cover" transition={500} style={StyleSheet.absoluteFill} accessible={false} />
      </Animated.View>
      <LinearGradient
        colors={fade === 'deep' ? [`rgba(${colors.pageRgb},0.35)`, `rgba(${colors.pageRgb},0)`, `rgba(${colors.pageRgb},0.75)`, colors.page] : [`rgba(${colors.pageRgb},0.45)`, `rgba(${colors.pageRgb},0)`, `rgba(${colors.pageRgb},0)`, colors.page]}
        locations={fade === 'deep' ? [0, 0.25, 0.62, 0.9] : [0, 0.3, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />
      {caption && (
        <Text
          style={[styles.caption, caption === 'top' ? { top: inset + 10 } : { bottom: 12 }]}
          accessibilityLabel={`${piece.title}, ${piece.place}, The Metropolitan Museum of Art`}>
          {piece.title} · {piece.place} · The Met
        </Text>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  frame: { overflow: 'hidden', backgroundColor: colors.raised },
  caption: {
    position: 'absolute',
    left: 20,
    right: 20,
    fontFamily: fonts.ui,
    fontSize: 11,
    letterSpacing: 0.2,
    color: 'rgba(243,235,216,0.72)',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
  },
}));
