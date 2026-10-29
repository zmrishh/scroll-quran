import { StatusBar } from 'expo-status-bar';
import { Appearance, StyleSheet, useColorScheme, type ColorSchemeName } from 'react-native';

import { useApp } from '@/store/app-store';

import { palettes, type Colors } from './tokens';

/** What someone picked in You → Appearance. Light is the default. */
export type AppearancePref = 'light' | 'dark' | 'system';

const schemeFor = (pref: AppearancePref, system: ColorSchemeName | null | undefined) =>
  pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;

/** The palette in use. */
export function useColors(): Colors {
  const pref = useApp((s) => s.appearance);
  const system = useColorScheme();
  return palettes[schemeFor(pref, system)];
}

/** The palette in use, for code outside components. */
export function currentColors(): Colors {
  return palettes[schemeFor(useApp.getState().appearance, Appearance.getColorScheme())];
}

type Styles = Parameters<typeof StyleSheet.create>[0];

/**
 * Like StyleSheet.create, but from the palette: returns a hook that gives the styles for the current theme.
 * Both themes' styles are made once, up front, so switching is instant.
 */
export function makeStyles<S extends Styles>(build: (colors: Colors) => S & Styles) {
  const sheets = { light: StyleSheet.create(build(palettes.light)), dark: StyleSheet.create(build(palettes.dark)) };
  return function useStyles() {
    return sheets[useColors().scheme];
  };
}

/** Light status bar text on the dark theme, dark text on the light one. */
export function ThemedStatusBar() {
  return <StatusBar style={useColors().scheme === 'dark' ? 'light' : 'dark'} />;
}
