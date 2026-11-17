import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { createContext, useContext, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { GLOW } from '@/data/art';
import { SCENES } from '@/data/scenes';
import { cardStyle, ownsStyle, type CardStyleId } from '@/data/styles';
import { useApp } from '@/store/app-store';
import { makeStyles, useColors } from '@/theme/theme';
import { inks } from '@/theme/tokens';

/** Shows cards in a given style regardless of the reader's choice, for previews such as onboarding's. */
export const CardStyleOverride = createContext<CardStyleId | null>(null);

/**
 * True inside a card of scripture set in one of the worlds. Those cards are set like a poster: everything centred in
 * the scene's light. The reading components check it to centre their lines.
 */
export const Folio = createContext(false);
export const useFolio = () => useContext(Folio);

/**
 * The colours a style gives its cards, or null for Glow and Plain, which follow the app's theme. A world's cards are
 * dark in both themes, like its scenes.
 */
export const paletteFor = (style: CardStyleId) => {
  const world = cardStyle(style).world;
  return world ? inks[world].dark : null;
};

/**
 * What's behind a card. Glow: a blurred manuscript page. Plain: nothing. The worlds: one of the world's scenes, a
 * different one from card to card.
 */
export function CardStyleLayer({ style, seed = '' }: { style: CardStyleId; seed?: string }) {
  const s = cardStyle(style);
  if (s.id === 'glow') return <GlowLayer seed={seed} />;
  if (!s.world) return null;
  const scenes = SCENES[s.world];
  return (
    <Image
      pointerEvents="none"
      source={scenes[pick(seed, scenes.length)]}
      contentFit="cover"
      style={[StyleSheet.absoluteFill, { backgroundColor: inks[s.world].dark.page }]}
      accessible={false}
    />
  );
}

type ShadeProps = {
  /** Where the words start and how tall they are. */
  top: number;
  height: number;
  /** How far the header reaches down, and the reference row and tab bar up. */
  head: number;
  foot: number;
};

/**
 * Darkness laid softly over a scene where things have to be read: behind the words, and under the header at the top
 * and the reference row at the bottom. It fades in and out over a long way, like shadow in the scene, with no edge.
 */
export function SceneShade({ top, height, head, foot }: ShadeProps) {
  const colors = useColors();
  const clear = `rgba(${colors.pageRgb},0)`;
  const dark = `rgba(${colors.pageRgb},0.5)`;
  const fade = 110;
  const whole = height + 2 * fade;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[`rgba(${colors.pageRgb},0.6)`, clear]} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: head + 20 }} />
      <LinearGradient
        colors={[clear, dark, dark, clear]}
        locations={[0, fade / whole, 1 - fade / whole, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: top - fade, height: whole }}
      />
      <LinearGradient
        colors={[clear, `rgba(${colors.pageRgb},0.86)`, `rgba(${colors.pageRgb},0.94)`]}
        locations={[0, 0.45, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: foot + 80 }}
      />
    </View>
  );
}

/** Turns a card key into a steady number, so the same card always gets the same background. */
function pick(seed: string, n: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}

// On paper the veil is heavier: dark manuscript pages under a light veil turn grey, so light mode keeps only a tint.
const VEIL = { dark: [0.5, 0.86, 0.86, 0.6], light: [0.74, 0.9, 0.9, 0.78] };

/** A blurred manuscript page drifting very slowly behind the card, dimmed most where the verse sits. */
function GlowLayer({ seed }: { seed: string }) {
  const colors = useColors();
  const styles = useStyles();
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
        colors={VEIL[colors.scheme].map((a) => `rgba(${colors.pageRgb},${a})`) as [string, string, string, string]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

/** The style the cards should use: a preview's override, else the chosen one if it's owned, otherwise Glow. */
export function useCardStyle(): CardStyleId {
  const forced = useContext(CardStyleOverride);
  const chosen = useApp((s) => (ownsStyle(cardStyle(s.cardStyle), s.ownedStyles, s.premium) ? s.cardStyle : 'glow'));
  return forced ?? chosen;
}

const useStyles = makeStyles((colors) => ({
  glow: { overflow: 'hidden', backgroundColor: colors.page },
}));
