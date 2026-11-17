export type Colors = {
  scheme: 'light' | 'dark';
  page: string;
  raised: string;
  line: string;
  /** Arabic, the key line, primary text. */
  text: string;
  /** The Quran's script. The text colour in the app's own themes; its own white in a card style's world. */
  script: string;
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
  script: '#F3EBD8',
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
  script: '#18221D',
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

/**
 * The colours of each world a card style can set its cards in (data/scenes.ts), with the world's own light as the
 * accent in place of gold. The dark ones are the scenes' own, for the feed and for the rest of the app in the dark
 * theme; the light ones are the same world on paper, for the rest of the app in the light theme.
 */
export const inks = {
  night: {
    dark: {
      ...night,
      page: '#03050B',
      raised: '#0A1020',
      line: 'rgba(238,243,255,0.14)',
      text: '#EEF3FF',
      script: '#F5F8FF',
      read: '#C8D3EA',
      quiet: '#93A0BC',
      faint: '#64708C',
      gold: '#A9C8FF',
      goldSoft: 'rgba(169,200,255,0.16)',
      onGold: '#03050B',
      pageRgb: '3,5,11',
      raisedRgb: '10,16,32',
      textRgb: '238,243,255',
    },
    light: {
      ...parchment,
      page: '#E9EFF8',
      raised: '#F4F7FC',
      line: 'rgba(16,26,46,0.14)',
      text: '#101A2E',
      script: '#0F1F45',
      read: '#2C3A55',
      quiet: '#5C6A85',
      faint: '#8E9AB2',
      gold: '#2F5FC4',
      goldSoft: 'rgba(47,95,196,0.12)',
      onGold: '#F4F7FC',
      pageRgb: '233,239,248',
      raisedRgb: '244,247,252',
      textRgb: '16,26,46',
    },
  },
  radiance: {
    dark: {
      ...night,
      page: '#02060C',
      raised: '#08131C',
      line: 'rgba(239,248,255,0.14)',
      text: '#EFF8FF',
      script: '#FFFFFF',
      read: '#C9DCE8',
      quiet: '#8FA6B6',
      faint: '#5E7484',
      gold: '#9FE0F2',
      goldSoft: 'rgba(159,224,242,0.16)',
      onGold: '#02060C',
      pageRgb: '2,6,12',
      raisedRgb: '8,19,28',
      textRgb: '239,248,255',
    },
    light: {
      ...parchment,
      page: '#EEF6F7',
      raised: '#F7FBFB',
      line: 'rgba(14,34,41,0.14)',
      text: '#0E2229',
      script: '#0B2A33',
      read: '#2A444C',
      quiet: '#5A747C',
      faint: '#8CA2A8',
      gold: '#147C92',
      goldSoft: 'rgba(20,124,146,0.12)',
      onGold: '#F7FBFB',
      pageRgb: '238,246,247',
      raisedRgb: '247,251,251',
      textRgb: '14,34,41',
    },
  },
  violet: {
    dark: {
      ...night,
      page: '#07010E',
      raised: '#150624',
      line: 'rgba(255,239,252,0.14)',
      text: '#FFEFFC',
      script: '#FFF4FD',
      read: '#E3C9E6',
      quiet: '#AC8FB6',
      faint: '#775C84',
      gold: '#FF8FE6',
      goldSoft: 'rgba(255,143,230,0.16)',
      onGold: '#07010E',
      pageRgb: '7,1,14',
      raisedRgb: '21,6,36',
      textRgb: '255,239,252',
    },
    light: {
      ...parchment,
      page: '#F5ECF7',
      raised: '#FBF5FC',
      line: 'rgba(42,16,51,0.14)',
      text: '#2A1033',
      script: '#3A1248',
      read: '#4A2E55',
      quiet: '#7A5E85',
      faint: '#A891B0',
      gold: '#A62BB0',
      goldSoft: 'rgba(166,43,176,0.12)',
      onGold: '#FBF5FC',
      pageRgb: '245,236,247',
      raisedRgb: '251,245,252',
      textRgb: '42,16,51',
    },
  },
  gold: {
    dark: {
      ...night,
      page: '#070301',
      raised: '#170B04',
      line: 'rgba(255,243,222,0.14)',
      text: '#FFF3DE',
      script: '#FFF6E6',
      read: '#E6D2B0',
      quiet: '#B09A78',
      faint: '#7C684C',
      gold: '#F2B552',
      goldSoft: 'rgba(242,181,82,0.16)',
      onGold: '#070301',
      pageRgb: '7,3,1',
      raisedRgb: '23,11,4',
      textRgb: '255,243,222',
    },
    light: {
      ...parchment,
      page: '#F8F0DE',
      raised: '#FDF8EC',
      line: 'rgba(42,30,10,0.14)',
      text: '#2A1E0A',
      script: '#3A2808',
      read: '#4D3F26',
      quiet: '#7A6A4C',
      faint: '#A89A7C',
      gold: '#9A6A12',
      goldSoft: 'rgba(154,106,18,0.12)',
      onGold: '#FDF8EC',
      pageRgb: '248,240,222',
      raisedRgb: '253,248,236',
      textRgb: '42,30,10',
    },
  },
  ember: {
    dark: {
      ...night,
      page: '#060302',
      raised: '#160A06',
      line: 'rgba(255,239,226,0.14)',
      text: '#FFEFE2',
      script: '#FFF3E9',
      read: '#E6CDBB',
      quiet: '#B09482',
      faint: '#7C6052',
      gold: '#FF9A4D',
      goldSoft: 'rgba(255,154,77,0.16)',
      onGold: '#060302',
      pageRgb: '6,3,2',
      raisedRgb: '22,10,6',
      textRgb: '255,239,226',
    },
    light: {
      ...parchment,
      page: '#FAEDE6',
      raised: '#FEF6F1',
      line: 'rgba(46,20,12,0.14)',
      text: '#2E140C',
      script: '#44180C',
      read: '#553228',
      quiet: '#85625A',
      faint: '#B0948C',
      gold: '#C24A1C',
      goldSoft: 'rgba(194,74,28,0.12)',
      onGold: '#FEF6F1',
      pageRgb: '250,237,230',
      raisedRgb: '254,246,241',
      textRgb: '46,20,12',
    },
  },
} satisfies Record<string, { dark: Colors; light: Colors }>;

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
