import type { ArtKey } from './art';

export type CardStyleId = 'glow' | 'night' | 'baghdad' | 'blue' | 'rosette' | 'morocco' | 'fatiha';

/**
 * A look for the cards: manuscript illumination across the top and bottom, with the ruled frame (jadwal)
 * that mushafs draw around the text. product is the store product ID; null means free for everyone.
 */
export type CardStyle = {
  id: CardStyleId;
  name: string;
  art: ArtKey | null;
  /** Colour of the jadwal, picked from the art. */
  rule: string;
  /** Which part of the art shows in the top band. */
  focus: 'top' | 'center';
  product: string | null;
};

export const CARD_STYLES: readonly CardStyle[] = [
  // Glow: a different blurred manuscript page behind each card (GLOW in data/art.ts). Plain: the bare page, in either theme.
  { id: 'glow', name: 'Glow', art: null, rule: 'transparent', focus: 'center', product: null },
  { id: 'night', name: 'Plain', art: null, rule: 'transparent', focus: 'center', product: null },
  { id: 'baghdad', name: 'Baghdad', art: 'baghdad', rule: '#C9A65E', focus: 'center', product: null },
  { id: 'blue', name: 'Blue Qur’an', art: 'blue', rule: '#7C97D6', focus: 'center', product: 'style_blue' },
  { id: 'rosette', name: 'Ibrahim Sultan', art: 'rosette', rule: '#C9A65E', focus: 'center', product: 'style_rosette' },
  { id: 'morocco', name: 'Morocco', art: 'morocco', rule: '#D0704E', focus: 'center', product: 'style_morocco' },
  { id: 'fatiha', name: 'Al-Fatiha', art: 'fatiha', rule: '#C9A65E', focus: 'top', product: 'style_fatiha' },
];

/** One purchase that unlocks every paid style. */
export const ALL_STYLES_PRODUCT = 'style_all';

export const STYLE_PRODUCTS = [...CARD_STYLES.flatMap((s) => (s.product ? [s.product] : [])), ALL_STYLES_PRODUCT];

export const cardStyle = (id: string) => CARD_STYLES.find((s) => s.id === id) ?? CARD_STYLES[0];

export const ownsStyle = (style: CardStyle, owned: readonly string[]) =>
  !style.product || owned.includes(style.product) || owned.includes(ALL_STYLES_PRODUCT);
