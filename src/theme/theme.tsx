import { StatusBar } from 'expo-status-bar';
import { createContext, useContext } from 'react';
import { Appearance, StyleSheet, useColorScheme, type ColorSchemeName } from 'react-native';

import { cardStyle, ownsStyle } from '@/data/styles';
import { useApp } from '@/store/app-store';

import { inks, palettes, type Colors } from './tokens';

/** What someone picked in You → Appearance. Light is the default. */
export type AppearancePref = 'light' | 'dark' | 'system';

const schemeFor = (pref: AppearancePref, system: ColorSchemeName | null | undefined) =>
  pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;

/**
 * Gives everything inside it another palette, for previews: a world's colours, or 'base' for the app's own light or
 * dark theme whatever card style is in use.
 */
export const PaletteOverride = createContext<Colors | 'base' | null>(null);

type Chosen = Pick<ReturnType<typeof useApp.getState>, 'cardStyle' | 'ownedStyles' | 'premium'>;

/** The world of the card style in use, if it has one and the reader has that style. */
const worldOf = (s: Chosen) => {
  const style = cardStyle(s.cardStyle);
  return style.world && ownsStyle(style, s.ownedStyles, s.premium) ? style.world : null;
};

/** The world whose colours the app is in, or null when it's in its own light or dark theme. */
export const useWorld = () => useApp(worldOf);

/**
 * The colours of the feed in a world, or null without one. A world's scenes are light in darkness, so the feed and
 * what sits on it (its header, its cards, the tab bar while it's showing) keep the world's dark colours in the light
 * theme too.
 */
export function useFeedColors() {
  const world = useWorld();
  return world ? inks[world].dark : null;
}

/** Light or dark, as picked in You → Appearance. */
function useScheme() {
  const pref = useApp((s) => s.appearance);
  const system = useColorScheme();
  return schemeFor(pref, system);
}

/** The app's own light or dark theme, whatever card style is in use: for what comes before a style is chosen. */
export function useThemeColors() {
  return palettes[useScheme()];
}

/**
 * The palette in use: light or dark, as picked in You → Appearance. A card style with a world of its own colours
 * the whole app in that world's light or dark, every tab and screen, so the feed and the rest are one place. (The
 * feed itself is always in the world's dark: useFeedColors.)
 */
export function useColors(): Colors {
  const forced = useContext(PaletteOverride);
  const world = useWorld();
  const scheme = useScheme();
  if (forced && forced !== 'base') return forced;
  return world && forced !== 'base' ? inks[world][scheme] : palettes[scheme];
}

const ALL_PALETTES: Colors[] = [palettes.light, palettes.dark, ...Object.values(inks).flatMap((w) => [w.dark, w.light])];

/** The palette in use, for code outside components. */
export function currentColors(): Colors {
  const world = worldOf(useApp.getState());
  const scheme = schemeFor(useApp.getState().appearance, Appearance.getColorScheme());
  return world ? inks[world][scheme] : palettes[scheme];
}

type Styles = Parameters<typeof StyleSheet.create>[0];

/**
 * Like StyleSheet.create, but from the palette: returns a hook that gives the styles for the palette in use.
 * Every palette's styles are made once, up front, so switching is instant.
 */
export function makeStyles<S extends Styles>(build: (colors: Colors) => S & Styles) {
  const create = (colors: Colors) => StyleSheet.create(build(colors));
  const sheets = new Map(ALL_PALETTES.map((colors) => [colors, create(colors)] as const));
  return function useStyles() {
    const colors = useColors();
    return (sheets.get(colors) ?? sheets.get(palettes[colors.scheme])) as ReturnType<typeof create>;
  };
}

/** Light status bar text on the dark theme, dark text on the light one. */
export function ThemedStatusBar() {
  return <StatusBar style={useColors().scheme === 'dark' ? 'light' : 'dark'} />;
}
