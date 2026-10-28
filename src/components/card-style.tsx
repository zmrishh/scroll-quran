import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { ART } from '@/data/art';
import { cardStyle, ownsStyle, type CardStyleId } from '@/data/styles';
import { useApp } from '@/store/app-store';
import { colors } from '@/theme/tokens';

type Props = {
  style: CardStyleId;
  height: number;
  /** Space the header and footer take, so the frame sits between them. */
  contentTop: number;
  contentBottom: number;
};

/**
 * The art behind a card in a manuscript style: illumination across the top and a strip along the bottom,
 * both fading into the page so the verse keeps a plain dark ground, and the ruled frame between them.
 */
export function CardStyleLayer({ style, height, contentTop, contentBottom }: Props) {
  const s = cardStyle(style);
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

/** The style the cards should use: the chosen one if it's owned, otherwise plain Night. */
export function useCardStyle(): CardStyleId {
  return useApp((s) => (ownsStyle(cardStyle(s.cardStyle), s.ownedStyles) ? s.cardStyle : 'night'));
}

const styles = StyleSheet.create({
  head: { position: 'absolute', left: 0, right: 0, top: 0, overflow: 'hidden' },
  foot: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  rule: { position: 'absolute', left: 12, right: 12, borderWidth: 1, borderRadius: 2, opacity: 0.55 },
  ruleInner: { position: 'absolute', top: 3, left: 3, right: 3, bottom: 3, borderWidth: StyleSheet.hairlineWidth },
});
