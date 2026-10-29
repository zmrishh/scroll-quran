export type Colors = {
  scheme: 'light' | 'dark';
  page: string;
  raised: string;
  line: string;
  /** Arabic, the key line, primary text. */
  text: string;
  /** The translation. */
  read: string;
  /** References, labels, idle icons. */
  quiet: string;
  /** Hints and placeholders. */
  faint: string;
  gold: string;
  goldSoft: string;
  /** Text and icons on a gold fill. */
  onGold: string;
  right: string;
  wrong: string;
  /** The page and text colours as "r,g,b", for fades and washes: `rgba(${c.pageRgb},0.8)`. */
  pageRgb: string;
  raisedRgb: string;
  textRgb: string;
};

/**
 * Night, in the colours of Islamic art: a deep emerald-black page (mosque tile green),
 * ivory type (mushaf paper) and antique gold (calligraphy, the kiswa's embroidery).
 * Gold is an accent only: ayah markers, Names of Allah, and whatever is active or chosen.
 */
const night: Colors = {
  scheme: 'dark',
  page: '#0C1512',
  raised: '#14201B',
  line: '#22312A',
  text: '#F3EBD8',
  read: '#BDB7A2',
  quiet: '#8C8A78',
  faint: '#5B6259',
  gold: '#C9A65E',
  goldSoft: 'rgba(201,166,94,0.16)',
  onGold: '#0C1512',
  right: '#4FAE85',
  wrong: '#CF6B60',
  pageRgb: '12,21,18',
  raisedRgb: '20,32,27',
  textRgb: '243,235,216',
};

/**
 * Parchment: the manuscripts' own paper, with ink in the night page's green-black and a deeper gold
 * that still reads against light paper.
 */
const parchment: Colors = {
  scheme: 'light',
  page: '#F6F1E6',
  raised: '#FDFAF3',
  line: '#E3D9C5',
  text: '#18221D',
  read: '#3D4842',
  quiet: '#6F6D5E',
  faint: '#A39E8C',
  gold: '#8C6A22',
  goldSoft: 'rgba(140,106,34,0.12)',
  onGold: '#FDFAF3',
  right: '#2A7E58',
  wrong: '#AE4237',
  pageRgb: '246,241,230',
  raisedRgb: '253,250,243',
  textRgb: '24,34,29',
};

export const palettes = { light: parchment, dark: night } as const;

export const fonts = {
  quran: 'AmiriQuran_400Regular',
  arabic: 'Amiri_700Bold',
  read: 'Literata_400Regular',
  readItalic: 'Literata_400Regular_Italic',
  readMedium: 'Literata_500Medium',
  ui: 'InterTight_400Regular',
  uiMedium: 'InterTight_500Medium',
  uiSemi: 'InterTight_600SemiBold',
} as const;

/** Spacing and shape shared by every screen. */
export const layout = {
  /** Side margin of every screen; titles, cards and text all line up on it. */
  gutter: 24,
  /** Space between the blocks of a screen: title, cards, search. */
  gap: 16,
  radius: { sm: 10, md: 14, lg: 20 },
} as const;

/** The small gold capitals above a heading. */
export const eyebrow = { fontFamily: fonts.uiMedium, fontSize: 12.5, letterSpacing: 1.3, textTransform: 'uppercase' } as const;
