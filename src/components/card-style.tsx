import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { ART, GLOW } from '@/data/art';
import { cardStyle, ownsStyle, type CardStyleId } from '@/data/styles';
import { useApp } from '@/store/app-store';
import { colors } from '@/theme/tokens';

type Props = {
  style: CardStyleId;
  height: number;
  /** Space the header and footer take, so the frame sits between them. */
  contentTop: number;
  contentBottom: number;
  /** The card's key, so Glow gives each card its own background and keeps it. */
  seed?: string;
};

/**
 * The art behind a card. Glow: a blurred manuscript page. The paid styles: illumination across the top and a
 * strip along the bottom, both fading into the page so the verse keeps a plain dark ground, and the ruled frame
 * between them.
 */
export function CardStyleLayer({ style, height, contentTop, contentBottom, seed = '' }: Props) {
  const s = cardStyle(style);
  if (s.id === 'glow') return <GlowLayer seed={seed} />;
  if (!s.art) return null;
  const art = ART[s.art];
  const top = Math.max(contentTop + 40, height * 0.22);
  const bottom = Math.max(contentBottom * 0.7, height * 0.1);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.head, { height: top }]}>
        <Image source={art.source} contentFit="cover" contentPosition={s.focus} style={StyleSheet.absoluteFill} accessible={false} />
        <LinearGradient
          colors={['rgba(12,21,18,0.35)', 'rgba(12,21,18,0)', colors.page]}
          locations={[0, 0.3, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={[styles.foot, { height: bottom }]}>
        <Image source={art.source} contentFit="cover" contentPosition="bottom" style={StyleSheet.absoluteFill} accessible={false} />
        <LinearGradient colors={[colors.page, 'rgba(12,21,18,0.55)']} style={StyleSheet.absoluteFill} />
      </View>
      <View style={[styles.rule, { top: top - 14, bottom: bottom - 6, borderColor: s.rule }]}>
        <View style={[styles.ruleInner, { borderColor: s.rule }]} />
      </View>
    </View>
  );
}

/** Turns a card key into a steady number, so the same card always gets the same background. */
function pick(seed: string, n: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}

/** A blurred manuscript page drifting very slowly behind the card, dimmed most where the verse sits. */
function GlowLayer({ seed }: { seed: string }) {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.set(withRepeat(withTiming(1, { duration: 18000, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [drift]);
  const moving = useAnimatedStyle(() => ({ transform: [{ scale: 1.08 + 0.07 * drift.get() }] }));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.glow]}>
      <Animated.View style={[StyleSheet.absoluteFill, moving]}>
        <Image source={GLOW[pick(seed, GLOW.length)]} contentFit="cover" style={StyleSheet.absoluteFill} accessible={false} />
      </Animated.View>
      <LinearGradient
        colors={['rgba(12,21,18,0.5)', 'rgba(12,21,18,0.78)', 'rgba(12,21,18,0.78)', 'rgba(12,21,18,0.6)']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

/** The style the cards should use: the chosen one if it's owned, otherwise Glow. */
export function useCardStyle(): CardStyleId {
  return useApp((s) => (ownsStyle(cardStyle(s.cardStyle), s.ownedStyles) ? s.cardStyle : 'glow'));
}

const styles = StyleSheet.create({
  glow: { overflow: 'hidden', backgroundColor: colors.page },
  head: { position: 'absolute', left: 0, right: 0, top: 0, overflow: 'hidden' },
  foot: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  rule: { position: 'absolute', left: 12, right: 12, borderWidth: 1, borderRadius: 2, opacity: 0.55 },
  ruleInner: { position: 'absolute', top: 3, left: 3, right: 3, bottom: 3, borderWidth: StyleSheet.hairlineWidth },
});
