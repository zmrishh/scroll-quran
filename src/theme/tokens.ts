/**
 * Night, in the colours of Islamic art: a deep emerald-black page (mosque tile green),
 * ivory type (mushaf paper) and antique gold (calligraphy, the kiswa's embroidery).
 * Gold is an accent only: ayah markers, Names of Allah, and whatever is active or chosen.
 */
export const colors = {
  page: '#0C1512',
  raised: '#14201B',
  line: '#22312A',
  /** Arabic, the key line, primary text. */
  text: '#F3EBD8',
  /** The translation. */
  read: '#BDB7A2',
  /** References, labels, idle icons. */
  quiet: '#8C8A78',
  /** Hints and placeholders. */
  faint: '#5B6259',
  gold: '#C9A65E',
  goldSoft: 'rgba(201,166,94,0.16)',
  right: '#4FAE85',
  wrong: '#CF6B60',
} as const;

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
